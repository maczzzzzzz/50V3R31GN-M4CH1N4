import 'package:permission_handler/permission_handler.dart';
import 'package:flutter/foundation.dart';

/**
 * PERMISSION_SERVICE — PHASE 93.9
 * 
 * Ensures the Sovereign HUD has authorized access to native Android arteries.
 */

class PermissionService {
  static Future<void> requestStartupPermissions() async {
    final statuses = await [
      Permission.microphone,
      Permission.notification,
      // Permission.accessibility_service // This requires specialized handling via Intent on Android
    ].request();

    if (kDebugMode) {
      statuses.forEach((permission, status) {
        print('::/PERMISSION_STATUS : ${permission.toString()} -> $status');
      });
    }
  }

  static Future<bool> hasMicrophonePermission() async {
    return await Permission.microphone.isGranted;
  }
}
