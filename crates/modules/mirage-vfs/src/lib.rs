//! Mirage VFS — Virtualized Filesystem Client for Sovereign Mesh.
//!
//! Core design: Present external data sources (Redis, S3) as local files
//! via FUSE mount on Node D (100.120.225.12).
//!
//! Components:
//! - Mount/unmount operations for Mirage FUSE filesystem
//! - Health check (verify mount is active)
//! - Transparent file read/write through FUSE
//! - Configuration for Redis (Node A) and S3 backends
//!
//! Phase 5: Mirage VFS Integration

pub mod config;
pub mod mount;

use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use thiserror::Error;

/// Mirage VFS error types.
#[derive(Debug, Error)]
pub enum MirageVfsError {
    /// Mount point does not exist or is not accessible.
    #[error("mount point error: {0}")]
    MountPoint(String),

    /// FUSE mount operation failed.
    #[error("FUSE mount failed: {0}")]
    MountFailed(String),

    /// FUSE unmount operation failed.
    #[error("FUSE unmount failed: {0}")]
    UnmountFailed(String),

    /// Health check failed — mount is not active.
    #[error("health check failed: {0}")]
    HealthCheckFailed(String),

    /// File I/O error on virtual filesystem.
    #[error("VFS I/O error: {0}")]
    IoError(#[from] std::io::Error),

    /// Configuration error.
    #[error("configuration error: {0}")]
    ConfigError(String),
}

/// Result type alias for Mirage VFS operations.
pub type Result<T> = std::result::Result<T, MirageVfsError>;

/// Status of a Mirage VFS mount.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum MountStatus {
    /// Mount is active and healthy.
    Mounted,
    /// Mount point exists but filesystem is not mounted.
    Unmounted,
    /// Mount point does not exist.
    NotFound,
}

/// Health check result for Mirage VFS.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthReport {
    /// Current mount status.
    pub status: MountStatus,
    /// Mount point path.
    pub mount_point: PathBuf,
    /// Whether Redis backend is reachable.
    pub redis_reachable: bool,
    /// Whether S3 backend is reachable.
    pub s3_reachable: bool,
    /// List of top-level entries in the virtual filesystem.
    pub entries: Vec<String>,
    /// Timestamp of the health check (epoch seconds).
    pub timestamp: u64,
}

/// Mirage VFS client — manages the virtualized filesystem lifecycle.
pub struct MirageVfs {
    /// Configuration for the VFS client.
    config: config::MirageConfig,
}

impl MirageVfs {
    /// Create a new Mirage VFS client with the given configuration.
    pub fn new(config: config::MirageConfig) -> Self {
        Self { config }
    }

    /// Create a Mirage VFS client from environment variables.
    ///
    /// Reads:
    /// - `MIRAGE_MOUNT_POINT`: FUSE mount point (default: `/mnt/mirage`)
    /// - `MIRAGE_REDIS_HOST`: Redis host (default: `100.90.196.70`)
    /// - `MIRAGE_REDIS_PORT`: Redis port (default: `6379`)
    /// - `MIRAGE_S3_ENDPOINT`: S3 endpoint (default: `http://100.90.196.70:9000`)
    /// - `MIRAGE_S3_BUCKET`: S3 bucket (default: `sovereign-mirage`)
    pub fn from_env() -> Result<Self> {
        let config = config::MirageConfig::from_env();
        Ok(Self { config })
    }

    /// Get a reference to the current configuration.
    pub fn config(&self) -> &config::MirageConfig {
        &self.config
    }

    /// Mount the Mirage VFS filesystem.
    ///
    /// Creates the mount point directory if it does not exist, then
    /// spawns the Mirage FUSE daemon to mount the configured backends.
    pub fn mount(&self) -> Result<()> {
        mount::mount(&self.config)
    }

    /// Unmount the Mirage VFS filesystem.
    pub fn unmount(&self) -> Result<()> {
        mount::unmount(&self.config)
    }

    /// Check mount status without full health check.
    pub fn mount_status(&self) -> MountStatus {
        let mount_point = Path::new(&self.config.mount_point);
        if !mount_point.exists() {
            return MountStatus::NotFound;
        }

        // Check if the path is an active FUSE mount point
        match mount::is_mounted(mount_point) {
            true => MountStatus::Mounted,
            false => MountStatus::Unmounted,
        }
    }

    /// Perform a full health check on the Mirage VFS.
    ///
    /// Verifies:
    /// 1. Mount point exists
    /// 2. FUSE mount is active
    /// 3. Directory listing works
    pub fn health_check(&self) -> Result<HealthReport> {
        let mount_point = PathBuf::from(&self.config.mount_point);
        let status = self.mount_status();

        let entries = if status == MountStatus::Mounted {
            std::fs::read_dir(&mount_point)
                .map(|dir| {
                    dir.filter_map(|e| e.ok())
                        .filter_map(|e| e.file_name().to_str().map(|s| s.to_string()))
                        .collect()
                })
                .unwrap_or_default()
        } else {
            vec![]
        };

        Ok(HealthReport {
            status,
            mount_point,
            redis_reachable: false, // Would require async Redis ping
            s3_reachable: false,    // Would require async S3 head-bucket
            entries,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs(),
        })
    }

    /// Validate that a resolved path stays within the mount point.
    /// Blocks path traversal via `..` components.
    fn validate_path<P: AsRef<Path>>(&self, path: P) -> Result<PathBuf> {
        let mount = PathBuf::from(&self.config.mount_point);
        let mount_canonical = mount.canonicalize().unwrap_or_else(|_| mount.clone());
        let full_path = mount.join(path.as_ref());

        // Resolve the path — handle both existing and new-file paths
        let resolved = if full_path.exists() {
            match full_path.canonicalize() {
                Ok(r) => r,
                Err(_) => full_path,
            }
        } else {
            full_path
        };

        // Normalize and check for traversal: reject if any `..` component
        // escapes the mount point after resolution
        let resolved_str = resolved.to_string_lossy();
        let mount_str = mount_canonical.to_string_lossy();

        // Check that the resolved path starts with the mount point
        if !resolved_str.starts_with(mount_str.as_ref()) {
            return Err(MirageVfsError::ConfigError(
                format!("Path traversal blocked: {:?} escapes mount {:?}", resolved, mount_canonical)
            ));
        }

        // Also reject paths containing `..` that would escape
        let rel = path.as_ref();
        let mut depth = 0i32;
        for component in rel.components() {
            match component {
                std::path::Component::ParentDir => {
                    depth -= 1;
                    if depth < 0 {
                        return Err(MirageVfsError::ConfigError(
                            "Path traversal: too many '..' components".to_string()
                        ));
                    }
                }
                std::path::Component::Normal(_) => { depth += 1; }
                std::path::Component::CurDir => {} // '.' is fine
                _ => {} // Prefix or RootDir — ignore
            }
        }

        Ok(resolved)
    }

    /// Read a virtual file from the Mirage VFS.
    ///
    /// The file path is relative to the mount point. Since Mirage
    /// presents backends as local files via FUSE, this is a standard
    /// file read that transparently accesses Redis or S3.
    pub fn read_file<P: AsRef<Path>>(&self, path: P) -> Result<Vec<u8>> {
        let full_path = self.validate_path(path)?;
        let data = std::fs::read(&full_path)?;
        log::info!(
            "[MirageVFS] Read {} bytes from {:?}",
            data.len(),
            full_path
        );
        Ok(data)
    }

    /// Read a virtual file as a UTF-8 string.
    pub fn read_file_string<P: AsRef<Path>>(&self, path: P) -> Result<String> {
        let data = self.read_file(path)?;
        String::from_utf8(data).map_err(|e| MirageVfsError::IoError(std::io::Error::new(
            std::io::ErrorKind::InvalidData,
            e,
        )))
    }

    /// Write data to a virtual file in the Mirage VFS.
    ///
    /// Data is persisted to the backend (Redis/S3) transparently
    /// through the FUSE filesystem.
    pub fn write_file<P: AsRef<Path>>(&self, path: P, data: &[u8]) -> Result<()> {
        let full_path = self.validate_path(path)?;

        // Ensure parent directory exists
        if let Some(parent) = full_path.parent() {
            std::fs::create_dir_all(parent)?;
        }

        std::fs::write(&full_path, data)?;
        log::info!(
            "[MirageVFS] Wrote {} bytes to {:?}",
            data.len(),
            full_path
        );
        Ok(())
    }

    /// List directory contents in the Mirage VFS.
    pub fn list_dir<P: AsRef<Path>>(&self, path: P) -> Result<Vec<String>> {
        let full_path = self.validate_path(path)?;
        let entries: Vec<String> = std::fs::read_dir(&full_path)?
            .filter_map(|e| e.ok())
            .filter_map(|e| e.file_name().to_str().map(|s| s.to_string()))
            .collect();
        Ok(entries)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    fn test_config(tmp: &TempDir) -> config::MirageConfig {
        config::MirageConfig {
            mount_point: tmp.path().to_str().unwrap().to_string(),
            mirage_config_path: "/etc/mirage/mirage.yaml".to_string(),
            redis_host: "127.0.0.1".to_string(),
            redis_port: 6379,
            redis_key_prefix: "mirage:vfs:".to_string(),
            redis_db: 0,
            redis_pool_size: 4,
            s3_endpoint: "http://127.0.0.1:9000".to_string(),
            s3_bucket: "test-bucket".to_string(),
            s3_region: "us-east-1".to_string(),
            s3_access_key: String::new(),
            s3_secret_key: String::new(),
            s3_path_style: true,
            fuse_allow_other: false,
            fuse_attr_timeout: 60,
            fuse_entry_timeout: 60,
            fuse_negative_timeout: 60,
            fuse_read_ahead: 128,
            log_level: "debug".to_string(),
        }
    }

    #[test]
    fn test_vfs_new_from_config() {
        let tmp = TempDir::new().unwrap();
        let config = test_config(&tmp);
        let vfs = MirageVfs::new(config);
        assert_eq!(vfs.config().redis_host, "127.0.0.1");
        assert_eq!(vfs.config().s3_bucket, "test-bucket");
    }

    #[test]
    fn test_mount_status_unmounted() {
        let tmp = TempDir::new().unwrap();
        let config = test_config(&tmp);
        let vfs = MirageVfs::new(config);
        // The temp dir exists but is not a FUSE mount
        assert_eq!(vfs.mount_status(), MountStatus::Unmounted);
    }

    #[test]
    fn test_mount_status_not_found() {
        let tmp = TempDir::new().unwrap();
        let config = config::MirageConfig {
            mount_point: "/tmp/mirage-vfs-nonexistent-xyz".to_string(),
            ..test_config(&tmp)
        };
        let vfs = MirageVfs::new(config);
        assert_eq!(vfs.mount_status(), MountStatus::NotFound);
    }

    #[test]
    fn test_health_check_unmounted() {
        let tmp = TempDir::new().unwrap();
        let config = test_config(&tmp);
        let vfs = MirageVfs::new(config);
        let report = vfs.health_check().unwrap();
        assert_eq!(report.status, MountStatus::Unmounted);
        assert!(report.entries.is_empty());
        assert!(report.timestamp > 0);
    }

    #[test]
    fn test_read_write_file_simulated() {
        // Simulates FUSE-backed read/write using real filesystem
        let tmp = TempDir::new().unwrap();
        let config = test_config(&tmp);
        let vfs = MirageVfs::new(config);

        // Write a file to the "mount point"
        vfs.write_file("test-key.txt", b"hello sovereign mesh").unwrap();

        // Read it back
        let data = vfs.read_file("test-key.txt").unwrap();
        assert_eq!(data, b"hello sovereign mesh");

        // Read as string
        let text = vfs.read_file_string("test-key.txt").unwrap();
        assert_eq!(text, "hello sovereign mesh");
    }

    #[test]
    fn test_list_dir_simulated() {
        let tmp = TempDir::new().unwrap();
        let config = test_config(&tmp);
        let vfs = MirageVfs::new(config);

        vfs.write_file("dir/a.txt", b"a").unwrap();
        vfs.write_file("dir/b.txt", b"b").unwrap();

        let entries = vfs.list_dir("dir").unwrap();
        assert!(entries.contains(&"a.txt".to_string()));
        assert!(entries.contains(&"b.txt".to_string()));
    }

    #[test]
    fn test_config_from_env() {
        std::env::set_var("MIRAGE_MOUNT_POINT", "/tmp/test-mirage");
        std::env::set_var("MIRAGE_REDIS_HOST", "10.0.0.10");
        std::env::set_var("MIRAGE_S3_BUCKET", "test-env-bucket");

        let config = config::MirageConfig::from_env();
        assert_eq!(config.mount_point, "/tmp/test-mirage");
        assert_eq!(config.redis_host, "10.0.0.10");
        assert_eq!(config.s3_bucket, "test-env-bucket");

        // Clean up
        std::env::remove_var("MIRAGE_MOUNT_POINT");
        std::env::remove_var("MIRAGE_REDIS_HOST");
        std::env::remove_var("MIRAGE_S3_BUCKET");
    }

    #[test]
    fn test_health_report_serialization() {
        let report = HealthReport {
            status: MountStatus::Mounted,
            mount_point: PathBuf::from("/mnt/mirage"),
            redis_reachable: true,
            s3_reachable: false,
            entries: vec!["redis".to_string(), "s3".to_string()],
            timestamp: 1700000000,
        };
        let json = serde_json::to_string(&report).unwrap();
        let deserialized: HealthReport = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.status, MountStatus::Mounted);
        assert_eq!(deserialized.entries.len(), 2);
    }
}
