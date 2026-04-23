import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'notification_service.dart';

class ArteryClient extends ChangeNotifier {
  WebSocketChannel? _channel;
  final List<String> _logs = [];
  bool _isConnected = false;
  final NotificationService _notificationService = NotificationService();

  List<String> get logs => List.unmodifiable(_logs);
  bool get isConnected => _isConnected;

  Future<void> connectFromPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    final ip = prefs.getString('node_c_ip') ?? '10.0.0.30';
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
    addLog("::/WS_RECEIVE : $message");
    
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
      }
    }
  }

  void addLog(String msg) {
    _logs.insert(0, msg);
    if (_logs.length > 50) _logs.removeLast();
    notifyListeners();
  }

  void sendAudioChunk(Uint8List data) {
    if (_isConnected && _channel != null) {
      _channel!.sink.add(data);
    }
  }

  Future<void> shiftQuantization(String quant) async {
    final prefs = await SharedPreferences.getInstance();
    final ip = prefs.getString('node_c_ip') ?? '10.0.0.30';
    final port = prefs.getString('node_c_port') ?? '7340';
    final secure = prefs.getBool('secure_tunnel') ?? false;
    final protocol = secure ? 'https' : 'http';
    
    try {
      final response = await http.post(
        Uri.parse('$protocol://$ip:$port/shift'),
        body: {"quantization": quant},
      );
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
    _channel?.sink.close();
    super.dispose();
  }
}
