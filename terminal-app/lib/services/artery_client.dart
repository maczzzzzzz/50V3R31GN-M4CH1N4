import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'package:record/record.dart';
import 'package:uuid/uuid.dart';
import 'notification_service.dart';

/**
 * ◈ ARTERY_CLIENT — v3.8.7 RE-GROUNDED
 * 
 * High-fidelity voice and command artery connecting the HUD to Node C.
 * Implements OMI Handshake and PCM-16 streaming.
 */

class ArteryClient extends ChangeNotifier {
  WebSocketChannel? _channel;
  final List<String> _logs = [];
  bool _isConnected = false;
  final NotificationService _notificationService = NotificationService();
  final _uuid = const Uuid();
  
  final _audioRecorder = AudioRecorder();
  bool _isRecording = false;
  String _currentTranscription = "";
  String? _currentProposal;
  StreamSubscription<Uint8List>? _audioSubscription;

  List<String> get logs => List.unmodifiable(_logs);
  bool get isConnected => _isConnected;
  bool get isRecording => _isRecording;
  String get currentTranscription => _currentTranscription;
  String? get currentProposal => _currentProposal;

  void clearProposal() {
    _currentProposal = null;
    notifyListeners();
  }

  Future<void> connectFromPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    final ip = prefs.getString('node_c_ip') ?? '100.x.y.z'; // Use real tailscale IP
    final port = prefs.getString('node_c_port') ?? '7340';
    final secure = prefs.getBool('secure_tunnel') ?? false;
    
    final protocol = secure ? 'wss' : 'ws';
    final url = '$protocol://$ip:$port/ws/audio';
    
    connect(url);
  }

  void connect(String url) {
    if (_isConnected) return;
    
    try {
      _channel = WebSocketChannel.connect(Uri.parse(url));
      _isConnected = true;
      
      // ◈ OMI Handshake (Phase 96.1)
      final handshake = jsonEncode({
        "type": "handshake",
        "session_id": _uuid.v4(),
        "sample_rate": 16000,
        "codec": "pcm16",
        "uid": "SOVEREIGN_HUD"
      });
      _channel!.sink.add(handshake);
      addLog("::/ARTERY_ACTIVE : HANDSHAKE_SENT");

      notifyListeners();

      _channel!.stream.listen(
        (message) {
          _handleIncomingMessage(message);
        },
        onDone: () {
          _isConnected = false;
          addLog("::/WS_DISCONNECT");
          notifyListeners();
        },
        onError: (error) {
          addLog("::/WS_ERROR : $error");
          _isConnected = false;
          notifyListeners();
        },
      );
    } catch (e) {
      addLog("::/WS_FATAL : $e");
    }
  }

  void _handleIncomingMessage(dynamic message) {
    if (message is String) {
      addLog("::/RX : $message"); // Traceable logs
      if (message.startsWith("{")) {
        try {
          final data = jsonDecode(message);
          if (data['type'] == 'TRANSCRIPTION') {
            _currentTranscription = data['text'] ?? "";
            addLog("::/TRANSCRIPT : $_currentTranscription");
            notifyListeners();
          } else if (data['type'] == 'CONTEXT_PROPOSAL') {
            _currentProposal = data['content'];
            addLog("::/CONTEXT_PROPOSAL : [GLOW_ACTIVE]");
            notifyListeners();
          }
        } catch (e) {
          // Fallback
        }
      }
    }
  }

  void addLog(String msg) {
    _logs.insert(0, msg);
    if (_logs.length > 50) _logs.removeLast();
    notifyListeners();
  }

  Future<void> startVoiceStream() async {
    if (!_isConnected) {
      addLog("::/ERROR : ARTERY_OFFLINE");
      return;
    }

    try {
      if (await _audioRecorder.hasPermission()) {
        const config = RecordConfig(
          encoder: AudioEncoder.pcm16bits,
          sampleRate: 16000,
          numChannels: 1,
        );

        final stream = await _audioRecorder.startStream(config);
        _isRecording = true;
        _currentTranscription = "";
        notifyListeners();
        addLog("::/USER : [V01C3_IN6R355_ACTIVE]");
        
        _notificationService.showPersistentEye(status: 'TRANSCRIBING_ACTIVE');

        _audioSubscription = stream.listen((data) {
          _channel?.sink.add(data);
        });
      } else {
        addLog("::/ERROR : MIC_PERMISSION_DENIED");
      }
    } catch (e) {
      addLog("::/ERROR : RECORDER_FAIL : $e");
    }
  }

  Future<void> stopVoiceStream() async {
    await _audioSubscription?.cancel();
    await _audioRecorder.stop();
    _isRecording = false;
    notifyListeners();
    addLog("::/USER : [V01C3_IN6R355_OFFLINE]");
    _notificationService.showPersistentEye(status: 'MONITORING_ACTIVE');
  }

  /// Sends a structured JSON command through the Artery.
  void sendJsonCommand(String action, String payload) {
    if (_isConnected && _channel != null) {
      final cmd = jsonEncode({
        "action": action,
        "payload": payload,
        "timestamp": DateTime.now().toIso8601String(),
      });
      _channel!.sink.add(cmd);
      addLog("::/USER_CMD : $action");
    } else {
      addLog("::/ERROR : ARTERY_OFFLINE");
    }
  }

  @override
  void dispose() {
    _audioSubscription?.cancel();
    _audioRecorder.dispose();
    _channel?.sink.close();
    super.dispose();
  }
}
