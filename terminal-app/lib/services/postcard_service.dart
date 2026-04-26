import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';
import 'openclaw_bridge.dart';

/**
 * ◈ POSTCARD_SERVICE : FIELD_REPUTATION_ARTERY — v3.8.7
 * 
 * Implements the POSTCARD-v1 telemetry structure for mobile social presence.
 */

class PostcardService extends ChangeNotifier {
  final OpenClawBridge _bridge;
  Timer? _postcardTimer;
  final _uuid = const Uuid();

  PostcardService(this._bridge);

  void startPostcards() {
    _postcardTimer = Timer.periodic(const Duration(minutes: 15), (timer) {
      _broadcastPostcard();
    });
    // Immediate broadcast on start
    _broadcastPostcard();
  }

  void stopPostcards() {
    _postcardTimer?.cancel();
  }

  Future<void> _broadcastPostcard() async {
    if (!_bridge.isConnected) return;

    final postcardId = _uuid.v4();
    final timestamp = DateTime.now().toIso8601String();
    
    // ◈ POSTCARD-v1 Schema
    final postcard = {
      "type": "POSTCARD_v1",
      "id": postcardId,
      "node_id": "mobile_node_01", // TODO: Get from unique device ID
      "timestamp": timestamp,
      "vitals": {
        "battery": 85, // TODO: Get native battery level
        "network": "Tailscale",
        "thermal": "normal"
      },
      "reputation_delta": 0.05, // Incremental field rep
      "location_mask": "HIDDEN" // Physical sovereignty first
    };

    _bridge.sendResponse("postcard_broadcast", postcard);
    debugPrint("::/POSTCARD_BROADCAST : $postcardId");
  }

  @override
  void dispose() {
    _postcardTimer?.cancel();
    super.dispose();
  }
}
