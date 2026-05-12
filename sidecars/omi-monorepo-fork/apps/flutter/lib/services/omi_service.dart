import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

/// Omi Service - Sovereign Voice Layer Client
///
/// Connects to Node B (100.66.173.31) via Zero-Trust Artery (Tailscale)
/// Redirects STT to Node D, Storage to Node A
class OmiService extends ChangeNotifier {
  // Node B Tailscale IP (Director)
  static const String _omiHost = "100.66.173.31";
  static const int _omiPort = 8000;
  static const String _baseUrl = "http://$_omiHost:$_omiPort";

  bool _isConnected = false;
  String _statusMessage = "Connecting to Artery...";
  Map<String, dynamic>? _healthStatus;

  bool get isConnected => _isConnected;
  String get statusMessage => _statusMessage;
  Map<String, dynamic>? get healthStatus => _healthStatus;

  OmiService() {
    _checkConnection();
  }

  /// Check connection to Omi backend on Node B
  Future<void> _checkConnection() async {
    try {
      final response = await http
          .get(Uri.parse('$_baseUrl/health'))
          .timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        _healthStatus = jsonDecode(response.body);
        _isConnected = true;
        _statusMessage = "Connected to Artery: $_omiHost";
        debugPrint(":: Omi Service Connected to Artery: $_healthStatus");
      } else {
        _isConnected = false;
        _statusMessage = "Connection failed: ${response.statusCode}";
      }
    } catch (e) {
      _isConnected = false;
      _statusMessage = "Connection error: $e";
      debugPrint(":: Omi Service Error: $e");
    }

    notifyListeners();
  }

  /// Speech-to-Text (redirects to Node D)
  Future<String?> speechToText(String audioDataBase64) async {
    if (!_isConnected) {
      throw Exception("Not connected to Omi backend");
    }

    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/stt'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'audio_data': audioDataBase64,
          'language': 'en',
        }),
      ).timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['text'] as String?;
      } else {
        throw Exception("STT failed: ${response.statusCode}");
      }
    } catch (e) {
      debugPrint(":: STT Error: $e");
      rethrow;
    }
  }

  /// Text-to-Speech (redirects to Node D/VoxCPM2)
  Future<String?> textToSpeech(String text, {String voice = "default", double speed = 1.0}) async {
    if (!_isConnected) {
      throw Exception("Not connected to Omi backend");
    }

    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/tts'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'text': text,
          'voice': voice,
          'speed': speed,
        }),
      ).timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['audio_data'] as String?;
      } else {
        throw Exception("TTS failed: ${response.statusCode}");
      }
    } catch (e) {
      debugPrint(":: TTS Error: $e");
      rethrow;
    }
  }

  /// Storage (redirects to Node A/Synapse)
  Future<bool> storeData(String key, String value, {int? ttl}) async {
    if (!_isConnected) {
      throw Exception("Not connected to Omi backend");
    }

    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/storage'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'key': key,
          'value': value,
          'ttl': ttl,
        }),
      ).timeout(const Duration(seconds: 10));

      return response.statusCode == 200;
    } catch (e) {
      debugPrint(":: Storage Error: $e");
      rethrow;
    }
  }

  /// Refresh connection status
  Future<void> refreshConnection() async {
    await _checkConnection();
  }
}
