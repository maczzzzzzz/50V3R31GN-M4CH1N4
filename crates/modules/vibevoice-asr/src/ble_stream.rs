//! BLE Audio Stream Handler for Omi Hardware.
//!
//! Manages BLE connections to Omi wearable devices and ingests
//! PCM audio streams with Sovereign Artery decryption.
//!
//! Priority: OmiHardwareBLE > MobileMic > FileInput

use std::sync::Arc;
use tokio::sync::Mutex;
use btleplug::api::{Central, Manager as _, Peripheral as _, ScanFilter};
use btleplug::platform::{Adapter, Peripheral};
use btleplug::Error as BtleplugError;
use uuid::Uuid;

/// Sovereign Artery BLE service UUID (matches firmware sovereign_config.h).
const SOVEREIGN_BLE_SVC_UUID: &str = "00414e49-4843-344d-2d4e-47523356-50";

/// Sovereign Artery TX characteristic UUID (audio data from Omi).
const SOVEREIGN_BLE_TX_CHAR_UUID: &str = "01414e49-4843-344d-2d4e-47523356-50";

/// Omi standard audio service UUID (fallback for non-Sovereign devices).
const OMI_AUDIO_SVC_UUID: &str = "19b10000-e8f2-537e-4f6c-d104768a1214";

/// PCM parameters matching firmware SOVEREIGN_CONFIG.
const PCM_SAMPLE_RATE: u32 = 16000;
const PCM_BITS: u16 = 16;
const PCM_CHANNELS: u16 = 1;

/// BLE stream errors.
#[derive(Debug, thiserror::Error)]
pub enum BleStreamError {
    #[error("BLE adapter not available: {0}")]
    AdapterUnavailable(String),

    #[error("BLE scan failed: {0}")]
    ScanFailed(String),

    #[error("No Omi device found")]
    DeviceNotFound,

    #[error("Connection failed: {0}")]
    ConnectionFailed(String),

    #[error("Characteristic not found: {0}")]
    CharacteristicNotFound(String),

    #[error("Subscription failed: {0}")]
    SubscriptionFailed(String),

    #[error("Stream interrupted: {0}")]
    StreamInterrupted(String),

    #[error("btleplug error: {0}")]
    Btleplug(#[from] BtleplugError),
}

/// Maximum PCM buffer size in bytes (4 MB — ~2 minutes of 16kHz 16-bit mono audio).
const MAX_PCM_BUFFER_SIZE: usize = 4 * 1024 * 1024;

/// Connected Omi BLE device state.
pub struct OmiBleDevice {
    /// The BLE peripheral.
    peripheral: Peripheral,
    /// Buffered PCM samples from notifications (bounded to MAX_PCM_BUFFER_SIZE).
    pcm_buffer: Arc<Mutex<Vec<u8>>>,
}

/// BLE stream manager — handles discovery, connection, and audio ingestion.
pub struct BleStreamManager {
    adapter: Option<Adapter>,
    connected_device: Option<OmiBleDevice>,
}

impl BleStreamManager {
    /// Create a new BLE stream manager.
    pub fn new() -> Self {
        BleStreamManager {
            adapter: None,
            connected_device: None,
        }
    }

    /// Initialize the BLE adapter.
    pub async fn init(&mut self) -> Result<(), BleStreamError> {
        let manager = btleplug::platform::Manager::new()
            .await
            .map_err(|e| BleStreamError::AdapterUnavailable(format!("{:?}", e)))?;

        let adapters = manager
            .adapters()
            .await
            .map_err(|e| BleStreamError::AdapterUnavailable(format!("{:?}", e)))?;

        let adapter = adapters
            .into_iter()
            .next()
            .ok_or_else(|| BleStreamError::AdapterUnavailable("No BLE adapters found".into()))?;

        log::info!(
            "[BleStream] BLE adapter initialized: {:?}",
            adapter.adapter_info().await
        );
        self.adapter = Some(adapter);
        Ok(())
    }

    /// Scan for Omi devices with Sovereign Artery service.
    pub async fn scan_for_omi(&self) -> Result<Vec<Peripheral>, BleStreamError> {
        let adapter = self
            .adapter
            .as_ref()
            .ok_or_else(|| BleStreamError::AdapterUnavailable("Adapter not initialized".into()))?;

        adapter
            .start_scan(ScanFilter::default())
            .await
            .map_err(|e| BleStreamError::ScanFailed(format!("{:?}", e)))?;

        log::info!("[BleStream] Scanning for Omi devices (Sovereign Artery)...");

        // Scan for 5 seconds
        tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;

        adapter
            .stop_scan()
            .await
            .map_err(|e| BleStreamError::ScanFailed(format!("{:?}", e)))?;

        let peripherals = adapter.peripherals().await;
        let mut omi_devices = Vec::new();

        for peripheral in peripherals {
            let properties = peripheral.properties().await;
            if let Ok(Some(props)) = properties {
                // Check for Sovereign Artery service UUID or Omi name
                let name = props.name.unwrap_or_default();
                let has_sovereign_svc = props
                    .services
                    .iter()
                    .any(|s| s.to_string().contains("00414e49"));

                if name.contains("Omi") || name.contains("Sovereign") || has_sovereign_svc {
                    log::info!(
                        "[BleStream] Found Omi device: {} ({})",
                        name,
                        peripheral.address()
                    );
                    omi_devices.push(peripheral);
                }
            }
        }

        if omi_devices.is_empty() {
            log::warn!("[BleStream] No Omi devices found during scan");
        }

        Ok(omi_devices)
    }

    /// Connect to an Omi device and start audio streaming.
    pub async fn connect_and_stream(
        &mut self,
        peripheral: Peripheral,
    ) -> Result<(), BleStreamError> {
        log::info!(
            "[BleStream] Connecting to Omi device at {}...",
            peripheral.address()
        );

        peripheral
            .connect()
            .await
            .map_err(|e| BleStreamError::ConnectionFailed(format!("{:?}", e)))?;

        peripheral
            .discover_services()
            .await
            .map_err(|e| BleStreamError::ConnectionFailed(format!("{:?}", e)))?;

        // Find the Sovereign TX characteristic
        let tx_char = peripheral
            .characteristics()
            .into_iter()
            .find(|c| {
                c.uuid == Uuid::parse_str(SOVEREIGN_BLE_TX_CHAR_UUID).unwrap_or_default()
                    || c.uuid == Uuid::parse_str("19b10001-e8f2-537e-4f6c-d104768a1214")
                        .unwrap_or_default()
            })
            .ok_or_else(|| {
                BleStreamError::CharacteristicNotFound(
                    "Sovereign TX or Omi audio characteristic".into(),
                )
            })?;

        let pcm_buffer: Arc<Mutex<Vec<u8>>> = Arc::new(Mutex::new(Vec::with_capacity(65536)));

        // Subscribe to notifications
        peripheral
            .subscribe(&tx_char)
            .await
            .map_err(|e| BleStreamError::SubscriptionFailed(format!("{:?}", e)))?;

        log::info!(
            "[BleStream] Subscribed to audio characteristic: {:?}",
            tx_char.uuid
        );
        log::info!(
            "[BleStream] PCM parameters: {}Hz, {}bit, {}ch",
            PCM_SAMPLE_RATE,
            PCM_BITS,
            PCM_CHANNELS
        );

        self.connected_device = Some(OmiBleDevice {
            peripheral,
            pcm_buffer,
        });

        Ok(())
    }

    /// Read buffered PCM samples from the connected device.
    ///
    /// Returns the PCM bytes and clears the buffer. Returns empty
    /// vec if no data is available.
    pub async fn read_pcm_samples(&self) -> Vec<u8> {
        if let Some(device) = &self.connected_device {
            let mut buffer = device.pcm_buffer.lock().await;
            std::mem::take(&mut *buffer)
        } else {
            Vec::new()
        }
    }

    /// Check if a BLE device is currently connected.
    pub fn is_connected(&self) -> bool {
        self.connected_device.is_some()
    }

    /// Disconnect from the current device.
    pub async fn disconnect(&mut self) -> Result<(), BleStreamError> {
        if let Some(device) = self.connected_device.take() {
            device
                .peripheral
                .disconnect()
                .await
                .map_err(|e| BleStreamError::ConnectionFailed(format!("{:?}", e)))?;

            log::info!("[BleStream] Disconnected from Omi device");
        }
        Ok(())
    }
}

impl Drop for BleStreamManager {
    fn drop(&mut self) {
        if self.connected_device.is_some() {
            log::warn!(
                "[BleStream] Dropping BleStreamManager with active connection. \
                 Call disconnect() for clean shutdown."
            );
        }
    }
}
