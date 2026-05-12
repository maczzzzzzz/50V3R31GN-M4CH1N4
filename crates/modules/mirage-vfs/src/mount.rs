//! Mirage VFS FUSE mount management.
//!
//! Handles mounting and unmounting of the Mirage virtualized filesystem.
//! The Mirage FUSE daemon presents Redis (Node A) and S3 backends as
//! local files under the configured mount point.

use crate::config::MirageConfig;
use crate::{MirageVfsError, Result};
use std::path::Path;
use std::process::Command;

/// Mount the Mirage VFS filesystem.
///
/// Creates the mount point directory if needed, then spawns the
/// Mirage FUSE daemon with the configured backends.
pub fn mount(config: &MirageConfig) -> Result<()> {
    let mount_point = Path::new(&config.mount_point);

    // Ensure mount point exists
    if !mount_point.exists() {
        std::fs::create_dir_all(mount_point).map_err(|e| {
            MirageVfsError::MountPoint(format!(
                "Failed to create mount point {}: {}",
                mount_point.display(),
                e
            ))
        })?;
        log::info!(
            "[MirageVFS] Created mount point: {}",
            mount_point.display()
        );
    }

    // Check if already mounted
    if is_mounted(mount_point) {
        log::info!(
            "[MirageVFS] Already mounted at {}",
            mount_point.display()
        );
        return Ok(());
    }

    // Build Mirage mount command
    let config_path = &config.mirage_config_path;
    let output = Command::new("mirage")
        .arg("mount")
        .arg(config_path)
        .output()
        .map_err(|e| {
            MirageVfsError::MountFailed(format!(
                "Failed to execute mirage binary: {}. Is Mirage installed?",
                e
            ))
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(MirageVfsError::MountFailed(format!(
            "Mirage mount failed (exit {}): {}",
            output.status.code().unwrap_or(-1),
            stderr
        )));
    }

    log::info!(
        "[MirageVFS] Mounted successfully at {}",
        mount_point.display()
    );
    Ok(())
}

/// Unmount the Mirage VFS filesystem.
///
/// Uses `fusermount -u` for user-space FUSE unmount.
pub fn unmount(config: &MirageConfig) -> Result<()> {
    let mount_point = Path::new(&config.mount_point);

    if !is_mounted(mount_point) {
        log::info!(
            "[MirageVFS] Not mounted at {}, nothing to unmount",
            mount_point.display()
        );
        return Ok(());
    }

    // Try fusermount first (user-space, no root required)
    let output = Command::new("fusermount")
        .arg("-u")
        .arg(mount_point)
        .output();

    match output {
        Ok(out) if out.status.success() => {
            log::info!(
                "[MirageVFS] Unmounted {} via fusermount",
                mount_point.display()
            );
            Ok(())
        }
        _ => {
            // Fallback to lazy unmount
            let lazy = Command::new("fusermount")
                .arg("-uz")
                .arg(mount_point)
                .output();

            match lazy {
                Ok(out) if out.status.success() => {
                    log::info!(
                        "[MirageVFS] Lazy unmounted {}",
                        mount_point.display()
                    );
                    Ok(())
                }
                Ok(out) => {
                    let stderr = String::from_utf8_lossy(&out.stderr);
                    Err(MirageVfsError::UnmountFailed(format!(
                        "fusermount failed (exit {}): {}",
                        out.status.code().unwrap_or(-1),
                        stderr
                    )))
                }
                Err(e) => Err(MirageVfsError::UnmountFailed(format!(
                    "fusermount not found: {}",
                    e
                ))),
            }
        }
    }
}

/// Check if a path is an active FUSE mount point.
///
/// Reads `/proc/mounts` to check if the given path is a mount point.
pub fn is_mounted(path: &Path) -> bool {
    // Quick check: try mountpoint command
    if let Ok(output) = Command::new("mountpoint")
        .arg("-q")
        .arg(path)
        .output()
    {
        return output.status.success();
    }

    // Fallback: read /proc/mounts
    if let Ok(mounts) = std::fs::read_to_string("/proc/mounts") {
        let path_str = path.to_string_lossy();
        return mounts
            .lines()
            .any(|line| line.split_whitespace().nth(1) == Some(&*path_str));
    }

    false
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    fn test_config(tmp: &TempDir) -> MirageConfig {
        MirageConfig {
            mount_point: tmp.path().to_str().unwrap().to_string(),
            ..MirageConfig::default()
        }
    }

    #[test]
    fn test_is_mounted_nonexistent() {
        assert!(!is_mounted(Path::new("/tmp/definitely-not-a-mount-xyz")));
    }

    #[test]
    fn test_is_mounted_regular_dir() {
        let tmp = TempDir::new().unwrap();
        assert!(!is_mounted(tmp.path()));
    }

    #[test]
    fn test_mount_creates_mount_point() {
        let tmp = TempDir::new().unwrap();
        let new_dir = tmp.path().join("new-mount");
        let config = MirageConfig {
            mount_point: new_dir.to_str().unwrap().to_string(),
            ..MirageConfig::default()
        };

        // This will try to run `mirage mount` which likely won't exist,
        // but the mount point directory should be created
        assert!(!new_dir.exists());
        // mount() will fail because mirage binary isn't installed,
        // but the directory creation happens first
        let _result = mount(&config);
        // The mount point was created before the binary was called
        assert!(new_dir.exists());
    }

    #[test]
    fn test_unmount_not_mounted() {
        let tmp = TempDir::new().unwrap();
        let config = test_config(&tmp);
        // Should succeed silently when not mounted
        assert!(unmount(&config).is_ok());
    }
}
