import 'dart:typed_data';

/**
 * VSB_PROTOCOL : DART_PORT — v3.7.0
 * 
 * Bit-identical mirror of sovereign-sdk/src/protocol.rs.
 * Handles binary packet extraction for the Flutter HUD.
 */

class VsbProtocol {
  // ─── Offsets (Sync with protocol.rs) ───────────────────────────────────────
  static const int vsbMagicOffset         = 0;
  static const int vsbSovereignModeOffset = 2048;
  static const int vsbRadarOffset         = 3072;
  static const int vsbHoveredUnitOffset   = 3205;
  static const int vsbIdentitySwitchOffset = 3338;

  // ─── Sizes ────────────────────────────────────────────────────────────────
  static const int vsbIdentitySwitchSize  = 65; // active(1)|profile_name(64)

  // ─── Extraction ────────────────────────────────────────────────────────────

  /// Extracts the identity switch profile name if the bit is active.
  static String? parseIdentitySwitch(Uint8List data) {
    if (data.length < vsbIdentitySwitchOffset + vsbIdentitySwitchSize) return null;

    final isActive = data[vsbIdentitySwitchOffset] == 1;
    if (!isActive) return null;

    final nameBytes = data.sublist(
      vsbIdentitySwitchOffset + 1, 
      vsbIdentitySwitchOffset + vsbIdentitySwitchSize
    );
    
    // Convert null-terminated or space-padded string
    final name = String.fromCharCodes(nameBytes).trim().split('\x00').first;
    return name.isNotEmpty ? name : null;
  }

  /// Verifies the VSB Magic (0xC0DE) in Little Endian.
  static bool verifyMagic(Uint8List data) {
    if (data.length < 2) return false;
    // 0xDE 0xC0 (Little Endian)
    return data[0] == 0xDE && data[1] == 0xC0;
  }
}
