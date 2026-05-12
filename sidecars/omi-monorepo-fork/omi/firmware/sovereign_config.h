/**
 * sovereign_config.h — Sovereign Machina Zero-Trust Artery Configuration
 *
 * Defines encryption parameters for the Tailscale Zero-Trust Artery
 * integration with the nRF52 BLE stack on Omi hardware.
 *
 * Phase 5: Omi Voice Layering (Hardware Artery)
 * Node C (Falcon/Oracle): 10.0.0.12 / 100.102.109.81
 *
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2025 Sovereign Machina
 */

#ifndef SOVEREIGN_CONFIG_H_
#define SOVEREIGN_CONFIG_H_

#include <zephyr/kernel.h>
#include <zephyr/sys/byteorder.h>

#ifdef __cplusplus
extern "C" {
#endif

/* ── Sovereign Artery Network Identity ────────────────────────────────── */

/** Target Tailscale Artery node for BLE-relayed audio (Node C). */
#define SOVEREIGN_ARTERY_TARGET_IP    "100.102.109.81"
#define SOVEREIGN_ARTERY_TARGET_PORT  4242

/** BLE service UUID for Sovereign Artery encrypted channel.
 *  Custom 128-bit UUID: omi-sovereign-artery-v1
 */
#define SOVEREIGN_BLE_SVC_UUID_LSB  0x50, 0x56, 0x33, 0x52, \
                                     0x31, 0x47, 0x4e, 0x2d, \
                                     0x4d, 0x34, 0x43, 0x48, \
                                     0x49, 0x4e, 0x41, 0x00

/** BLE characteristic UUID for encrypted audio TX. */
#define SOVEREIGN_BLE_TX_CHAR_UUID_LSB  0x50, 0x56, 0x33, 0x52, \
                                         0x31, 0x47, 0x4e, 0x2d, \
                                         0x4d, 0x34, 0x43, 0x48, \
                                         0x49, 0x4e, 0x41, 0x01

/** BLE characteristic UUID for encrypted audio RX (command channel). */
#define SOVEREIGN_BLE_RX_CHAR_UUID_LSB  0x50, 0x56, 0x33, 0x52, \
                                         0x31, 0x47, 0x4e, 0x2d, \
                                         0x4d, 0x34, 0x43, 0x48, \
                                         0x49, 0x4e, 0x41, 0x02

/* ── Encryption Parameters ───────────────────────────────────────────── */

/** AES-256-CCM key length (bytes). */
#define SOVEREIGN_AES_KEY_LEN       32

/** AES-CCM nonce length (bytes). */
#define SOVEREIGN_AES_NONCE_LEN     12

/** AES-CCM authentication tag length (bytes). */
#define SOVEREIGN_AES_TAG_LEN       16

/** Packet counter size (bytes) — anti-replay protection. */
#define SOVEREIGN_PKT_COUNTER_LEN   8

/** Maximum encrypted payload per BLE packet (bytes).
 *  MTU 247 - L2CAP header (4) - nonce (12) - tag (16) - counter (8) = 207
 */
#define SOVEREIGN_MAX_PAYLOAD       207

/** AES-CCM associated data: device ID + packet counter. */
#define SOVEREIGN_AAD_LEN           16

/* ── Audio Parameters ────────────────────────────────────────────────── */

/** PCM sample rate from Omi mic. */
#define SOVEREIGN_PCM_SAMPLE_RATE   16000

/** Bits per PCM sample. */
#define SOVEREIGN_PCM_BITS          16

/** Number of audio channels. */
#define SOVEREIGN_PCM_CHANNELS      1

/** Audio frame duration in ms for batching PCM into BLE packets. */
#define SOVEREIGN_FRAME_DURATION_MS 20

/** Samples per frame: 16000 Hz * 20ms / 1000 = 320. */
#define SOVEREIGN_SAMPLES_PER_FRAME 320

/** Bytes per PCM frame: 320 samples * 2 bytes = 640. */
#define SOVEREIGN_FRAME_BYTES       (SOVEREIGN_SAMPLES_PER_FRAME * (SOVEREIGN_PCM_BITS / 8))

/** Number of frames to buffer before TX (latency vs reliability tradeoff). */
#define SOVEREIGN_TX_FRAME_BATCH    2

/* ── Session Management ──────────────────────────────────────────────── */

/** Maximum number of retransmission attempts for encrypted packets. */
#define SOVEREIGN_MAX_RETRANSMIT    3

/** Session key rotation interval in seconds. */
#define SOVEREIGN_KEY_ROTATION_S    300

/** Connection supervision timeout (ms). */
#define SOVEREIGN_SUPervision_TIMEOUT_MS  6000

/* ── Logging ─────────────────────────────────────────────────────────── */

/** Enable verbose Sovereign Artery debug logging. */
#define SOVEREIGN_DEBUG_LOG         1

#ifdef __cplusplus
}
#endif

#endif /* SOVEREIGN_CONFIG_H_ */
