import 'dart:async';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:flutter/foundation.dart';

class ArteryClient extends ChangeNotifier {
  WebSocketChannel? _channel;
  final List<String> _logs = [];
  bool _isConnected = false;

  List<String> get logs => List.unmodifiable(_logs);
  bool get isConnected => _isConnected;

  void connect(String url) {
    try {
      _channel = WebSocketChannel.connect(Uri.parse(url));
      _isConnected = true;
      notifyListeners();

      _channel!.stream.listen(
        (message) {
          _addLog("::/WS_RECEIVE : $message");
        },
        onDone: () {
          _isConnected = false;
          _addLog("::/WS_DISCONNECT");
          notifyListeners();
        },
        onError: (error) {
          _addLog("::/WS_ERROR : $error");
          _isConnected = false;
          notifyListeners();
        },
      );
    } catch (e) {
      _addLog("::/WS_FATAL : $e");
    }
  }

  void _addLog(String msg) {
    _logs.insert(0, msg);
    if (_logs.length > 50) _logs.removeLast();
    notifyListeners();
  }

  void sendAudioChunk(Uint8List data) {
    if (_isConnected && _channel != null) {
      _channel!.sink.add(data);
    }
  }

  @override
  void dispose() {
    _channel?.sink.close();
    super.dispose();
  }
}
