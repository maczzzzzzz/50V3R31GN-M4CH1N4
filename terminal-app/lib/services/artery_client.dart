import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'package:record/record.dart';
import 'notification_service.dart';

class ArteryClient extends ChangeNotifier {
  WebSocketChannel? _channel;
  final List<String> _logs = [];
  bool _isConnected = false;
  final NotificationService _notificationService = NotificationService();
  
  final _audioRecorder = AudioRecorder();
  bool _isRecording = false;
  String _currentTranscription = "";
  StreamSubscription<Uint8List>? _audioSubscription;

  List<String> get logs => List.unmodifiable(_logs);
  bool get isConnected => _isConnected;
  bool get isRecording => _isRecording;
  String get currentTranscription => _currentTranscription;

  Future<void> connectFromPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    final ip = prefs.getString('node_c_ip') ?? '10.0.0.30';
    final port = prefs.getString('node_c_port') ?? '7340';
    final secure = prefs.getBool('secure_tunnel') ?? false;
    
    // ◈ Handshake protocol: ws (standard) or wss (encrypted)
    final protocol = secure ? 'wss' : 'ws';
    final url = '$protocol://$ip:$port/ws/audio';
    
    connect(url);
  }

  void connect(String url) {
    if (_isConnected) return;
    
    try {
      _channel = WebSocketChannel.connect(Uri.parse(url));
      _isConnected = true;
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
    // Command Parsing
    if (message is String) {
      if (message.startsWith("::/REMINDER|")) {
        try {
          final parts = message.split('|');
          if (parts.length >= 3) {
            final timeStr = parts[1];
            final note = parts[2];
            final time = DateTime.parse(timeStr);
            
            _notificationService.scheduleNotification(
              message.hashCode,
              'HERMES_REMINDER',
              note,
              time,
            );
            addLog("::/REMINDER_SCHEDULED : $note at $timeStr");
          }
        } catch (e) {
          addLog("::/REMINDER_ERROR : Failed to parse reminder command");
        }
      } else if (message.startsWith("{")) {
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
          addLog("::/WS_RECEIVE : $message");
        }
      } else {
        addLog("::/WS_RECEIVE : $message");
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
      addLog("::/ERROR : NOT_CONNECTED");
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
        addLog("::/USER : [AUDIO_STREAM_STARTED]");
        
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
    addLog("::/USER : [AUDIO_STREAM_STOPPED]");
    _notificationService.showPersistentEye(status: 'MONITORING_ACTIVE');
  }

  void sendAudioChunk(Uint8List data) {
    if (_isConnected && _channel != null) {
      _channel!.sink.add(data);
    }
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

  Future<void> shiftQuantization(String quant) async {
    final prefs = await SharedPreferences.getInstance();
    final ip = prefs.getString('node_c_ip') ?? '10.0.0.30';
    final port = prefs.getString('node_c_port') ?? '7340';
    const protocol = 'http';
    
    try {
      final response = await http.post(
        Uri.parse('$protocol://$ip:$port/shift'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({"quantization": quant}),
      ).timeout(const Duration(seconds: 10));
      
      if (response.statusCode == 200) {
        addLog("::/SHIFT_SUCCESS : $quant");
      } else {
        addLog("::/SHIFT_FAILED : ${response.statusCode}");
      }
    } catch (e) {
      addLog("::/SHIFT_ERROR : $e");
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
