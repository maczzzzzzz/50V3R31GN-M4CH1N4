import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:shared_preferences/shared_preferences.dart';

/**
 * ◈ OPENCLAW_BRIDGE : MOBILE_RPC_ARTERY — v3.8.7
 * 
 * Enables agentic control of Android devices via Tailscale.
 * Maps 'device.*' intents to 'node.invoke' RPC calls.
 */

class OpenClawBridge extends ChangeNotifier {
  static const _platform = MethodChannel('openclaw/device');
  WebSocketChannel? _rpcChannel;
  bool _isConnected = false;
  final List<String> _rpcLogs = [];

  bool get isConnected => _isConnected;
  List<String> get rpcLogs => List.unmodifiable(_rpcLogs);

  Future<void> initialize() async {
    final prefs = await SharedPreferences.getInstance();
    final url = prefs.getString('gateway_url') ?? 'ws://node-b:8000/ws';
    _connect(url);
  }

  void _connect(String url) {
    if (_isConnected) return;
    
    try {
      _rpcChannel = WebSocketChannel.connect(Uri.parse(url));
      _isConnected = true;
      _addLog("::/GATEWAY_ARTERY_ACTIVE : $url");
      notifyListeners();

      _rpcChannel!.stream.listen(
        (message) => _handleRpcMessage(message),
        onDone: () {
          _isConnected = false;
          _addLog("::/RPC_DISCONNECT");
          notifyListeners();
          // Attempt reconnection after 5s
          Future.delayed(const Duration(seconds: 5), () => initialize());
        },
        onError: (error) {
          _isConnected = false;
          _addLog("::/RPC_ERROR : $error");
          notifyListeners();
        },
      );
    } catch (e) {
      _addLog("::/RPC_FATAL : $e");
    }
  }

  void _handleRpcMessage(dynamic message) {
    if (message is String) {
      try {
        final data = jsonDecode(message);
        if (data['type'] == 'NODE_INVOKE') {
          final requestId = data['id'] ?? 'untracked';
          _processNodeInvoke(requestId, data['intent'], data['params']);
        } else if (data['type'] == 'REVOKE_SESSION') {
          _handleDeportation(data['rationale']);
        }
      } catch (e) {
        _addLog("::/RPC_PARSE_ERROR : $e");
      }
    }
  }

  Future<void> _processNodeInvoke(String requestId, String intent, Map<String, dynamic>? params) async {
    _addLog("::/NODE_INVOKE : $intent");
    
    try {
      final result = await _platform.invokeMethod(intent, params);
      sendResponse(requestId, {"status": "success", "data": result});
    } on PlatformException catch (e) {
      _addLog("::/RPC_PLATFORM_ERROR : ${e.message}");
      sendResponse(requestId, {"status": "error", "message": e.message});
    } catch (e) {
      _addLog("::/RPC_UNKNOWN_ERROR : $e");
      sendResponse(requestId, {"status": "error", "message": e.toString()});
    }
  }

  void _handleDeportation(String rationale) {
    _addLog("::/DEPORTATION_HARDGATE : $rationale");
    _rpcChannel?.sink.close();
    _isConnected = false;
    notifyListeners();
    // TODO: Trigger Android KeyStore session wipe
  }

  void sendResponse(String requestId, Map<String, dynamic> result) {
    if (_isConnected && _rpcChannel != null) {
      final response = jsonEncode({
        "type": "RPC_RESPONSE",
        "id": requestId,
        "result": result,
        "timestamp": DateTime.now().toIso8601String(),
      });
      _rpcChannel!.sink.add(response);
    }
  }

  void _addLog(String msg) {
    _rpcLogs.insert(0, msg);
    if (_rpcLogs.length > 50) _rpcLogs.removeLast();
    notifyListeners();
  }

  @override
  void dispose() {
    _rpcChannel?.sink.close();
    super.dispose();
  }
}
