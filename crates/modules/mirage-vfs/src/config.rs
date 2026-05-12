//! Mirage VFS configuration.
//!
//! Loads configuration from:
//! 1. Environment variables (MIRAGE_* prefix)
//! 2. YAML configuration file
//! 3. Defaults for Node D deployment in Sovereign Mesh
//!
//! Node topology:
//! - Node A (100.90.196.70): Redis, S3-compatible storage (MinIO)
//! - Node D (100.120.225.12): Mirage mount point (/mnt/mirage)

use serde::{Deserialize, Serialize};
use std::env;

/// Default mount point on Node D.
pub const DEFAULT_MOUNT_POINT: &str = "/mnt/mirage";

/// Default Redis host (Node A - Synapse/Mooncake).
pub const DEFAULT_REDIS_HOST: &str = "100.90.196.70";

/// Default Redis port.
pub const DEFAULT_REDIS_PORT: u16 = 6379;

/// Default S3 endpoint (Node A - MinIO-compatible).
pub const DEFAULT_S3_ENDPOINT: &str = "http://100.90.196.70:9000";

/// Default S3 bucket.
pub const DEFAULT_S3_BUCKET: &str = "sovereign-mirage";

/// Default Mirage config file path.
pub const DEFAULT_MIRAGE_CONFIG_PATH: &str = "/etc/mirage/mirage.yaml";

/// Mirage VFS configuration.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MirageConfig {
    /// FUSE mount point path.
    pub mount_point: String,

    /// Path to the Mirage YAML config file.
    pub mirage_config_path: String,

    // ── Redis Backend ──────────────────────────────────────────────
    /// Redis server hostname (Node A).
    pub redis_host: String,
    /// Redis server port.
    pub redis_port: u16,
    /// Key prefix for Mirage entries in Redis.
    pub redis_key_prefix: String,
    /// Redis database index.
    pub redis_db: u8,
    /// Connection pool size for Redis.
    pub redis_pool_size: u32,

    // ── S3 Backend ─────────────────────────────────────────────────
    /// S3-compatible endpoint URL (Node A MinIO).
    pub s3_endpoint: String,
    /// S3 bucket name.
    pub s3_bucket: String,
    /// S3 region.
    pub s3_region: String,
    /// S3 access key (optional, can use env var S3_ACCESS_KEY).
    pub s3_access_key: String,
    /// S3 secret key (optional, can use env var S3_SECRET_KEY).
    pub s3_secret_key: String,
    /// Use path-style S3 access (required for MinIO).
    pub s3_path_style: bool,

    // ── FUSE Options ───────────────────────────────────────────────
    /// Allow other users to access the mount.
    pub fuse_allow_other: bool,
    /// Attribute cache timeout in seconds.
    pub fuse_attr_timeout: u64,
    /// Entry cache timeout in seconds.
    pub fuse_entry_timeout: u64,
    /// Negative entry cache timeout in seconds.
    pub fuse_negative_timeout: u64,
    /// Read-ahead size in KB.
    pub fuse_read_ahead: u64,

    // ── Logging ────────────────────────────────────────────────────
    /// Log level (trace, debug, info, warn, error).
    pub log_level: String,
}

impl Default for MirageConfig {
    fn default() -> Self {
        Self {
            mount_point: DEFAULT_MOUNT_POINT.to_string(),
            mirage_config_path: DEFAULT_MIRAGE_CONFIG_PATH.to_string(),
            redis_host: DEFAULT_REDIS_HOST.to_string(),
            redis_port: DEFAULT_REDIS_PORT,
            redis_key_prefix: "mirage:vfs:".to_string(),
            redis_db: 0,
            redis_pool_size: 4,
            s3_endpoint: DEFAULT_S3_ENDPOINT.to_string(),
            s3_bucket: DEFAULT_S3_BUCKET.to_string(),
            s3_region: "us-east-1".to_string(),
            s3_access_key: String::new(),
            s3_secret_key: String::new(),
            s3_path_style: true,
            fuse_allow_other: false,
            fuse_attr_timeout: 60,
            fuse_entry_timeout: 60,
            fuse_negative_timeout: 60,
            fuse_read_ahead: 128,
            log_level: "info".to_string(),
        }
    }
}

impl MirageConfig {
    /// Load configuration from environment variables.
    ///
    /// Environment variables (all optional, defaults provided):
    /// - `MIRAGE_MOUNT_POINT`
    /// - `MIRAGE_REDIS_HOST`
    /// - `MIRAGE_REDIS_PORT`
    /// - `MIRAGE_REDIS_KEY_PREFIX`
    /// - `MIRAGE_REDIS_DB`
    /// - `MIRAGE_REDIS_POOL_SIZE`
    /// - `MIRAGE_S3_ENDPOINT`
    /// - `MIRAGE_S3_BUCKET`
    /// - `MIRAGE_S3_REGION`
    /// - `MIRAGE_S3_ACCESS_KEY`
    /// - `MIRAGE_S3_SECRET_KEY`
    /// - `MIRAGE_FUSE_ALLOW_OTHER`
    /// - `MIRAGE_FUSE_ATTR_TIMEOUT`
    /// - `MIRAGE_FUSE_ENTRY_TIMEOUT`
    /// - `MIRAGE_LOG_LEVEL`
    pub fn from_env() -> Self {
        let mut config = Self::default();

        if let Ok(v) = env::var("MIRAGE_MOUNT_POINT") {
            config.mount_point = v;
        }
        if let Ok(v) = env::var("MIRAGE_CONFIG_PATH") {
            config.mirage_config_path = v;
        }
        if let Ok(v) = env::var("MIRAGE_REDIS_HOST") {
            config.redis_host = v;
        }
        if let Ok(v) = env::var("MIRAGE_REDIS_PORT") {
            config.redis_port = v.parse().unwrap_or(DEFAULT_REDIS_PORT);
        }
        if let Ok(v) = env::var("MIRAGE_REDIS_KEY_PREFIX") {
            config.redis_key_prefix = v;
        }
        if let Ok(v) = env::var("MIRAGE_REDIS_DB") {
            config.redis_db = v.parse().unwrap_or(0);
        }
        if let Ok(v) = env::var("MIRAGE_REDIS_POOL_SIZE") {
            config.redis_pool_size = v.parse().unwrap_or(4);
        }
        if let Ok(v) = env::var("MIRAGE_S3_ENDPOINT") {
            config.s3_endpoint = v;
        }
        if let Ok(v) = env::var("MIRAGE_S3_BUCKET") {
            config.s3_bucket = v;
        }
        if let Ok(v) = env::var("MIRAGE_S3_REGION") {
            config.s3_region = v;
        }
        if let Ok(v) = env::var("MIRAGE_S3_ACCESS_KEY") {
            config.s3_access_key = v;
        }
        if let Ok(v) = env::var("MIRAGE_S3_SECRET_KEY") {
            config.s3_secret_key = v;
        }
        if let Ok(v) = env::var("MIRAGE_FUSE_ALLOW_OTHER") {
            config.fuse_allow_other = v == "true" || v == "1";
        }
        if let Ok(v) = env::var("MIRAGE_FUSE_ATTR_TIMEOUT") {
            config.fuse_attr_timeout = v.parse().unwrap_or(60);
        }
        if let Ok(v) = env::var("MIRAGE_FUSE_ENTRY_TIMEOUT") {
            config.fuse_entry_timeout = v.parse().unwrap_or(60);
        }
        if let Ok(v) = env::var("MIRAGE_LOG_LEVEL") {
            config.log_level = v;
        }

        config
    }

    /// Load configuration from a YAML string.
    pub fn from_yaml(yaml: &str) -> Result<Self, serde_yaml::Error> {
        serde_yaml::from_str(yaml)
    }

    /// Get the Redis connection URL.
    pub fn redis_url(&self) -> String {
        format!("redis://{}:{}/{}", self.redis_host, self.redis_port, self.redis_db)
    }

    /// Get the full S3 bucket URL.
    pub fn s3_bucket_url(&self) -> String {
        format!("{}/{}", self.s3_endpoint.trim_end_matches('/'), self.s3_bucket)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = MirageConfig::default();
        assert_eq!(config.mount_point, "/mnt/mirage");
        assert_eq!(config.redis_host, "100.90.196.70");
        assert_eq!(config.redis_port, 6379);
        assert_eq!(config.s3_bucket, "sovereign-mirage");
        assert!(config.s3_path_style);
    }

    #[test]
    fn test_redis_url() {
        let config = MirageConfig::default();
        assert_eq!(config.redis_url(), "redis://100.90.196.70:6379/0");
    }

    #[test]
    fn test_s3_bucket_url() {
        let config = MirageConfig::default();
        assert_eq!(config.s3_bucket_url(), "http://100.90.196.70:9000/sovereign-mirage");
    }

    #[test]
    fn test_from_yaml() {
        let yaml = r#"
mount_point: "/mnt/test-mirage"
mirage_config_path: "/etc/mirage/test.yaml"
redis_host: "10.0.0.1"
redis_port: 6380
redis_key_prefix: "test:"
redis_db: 1
redis_pool_size: 8
s3_endpoint: "http://10.0.0.1:9000"
s3_bucket: "test-bucket"
s3_region: "eu-west-1"
s3_access_key: ""
s3_secret_key: ""
s3_path_style: true
fuse_allow_other: true
fuse_attr_timeout: 30
fuse_entry_timeout: 30
fuse_negative_timeout: 30
fuse_read_ahead: 64
log_level: "debug"
"#;
        let config = MirageConfig::from_yaml(yaml).unwrap();
        assert_eq!(config.mount_point, "/mnt/test-mirage");
        assert_eq!(config.redis_host, "10.0.0.1");
        assert_eq!(config.redis_port, 6380);
        assert_eq!(config.redis_pool_size, 8);
        assert!(config.fuse_allow_other);
        assert_eq!(config.log_level, "debug");
    }
}
