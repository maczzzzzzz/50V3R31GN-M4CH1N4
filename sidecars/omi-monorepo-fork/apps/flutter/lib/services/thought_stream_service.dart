import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

/// Thought Stream Service - Real-time Agent Thought Streaming
///
/// Connects to Node D (100.120.225.12) via WebSocket for live thought streams
/// Provides bit-identical typographic flows matching Desktop client
class ThoughtStreamService extends ChangeNotifier {
  // Node D Tailscale IP (Quaternary - Hermes Core)
  static const String _nodeDHost = "100.120.225.12";
  static const int _thoughtStreamPort = 8080;
  static const String _wsUrl = "ws://$_nodeDHost:$_thoughtStreamPort/thoughts";

  WebSocketChannel? _channel;
  final StreamController<AgentThought> _thoughtController = StreamController<AgentThought>.broadcast();
  bool _isConnected = false;
  String _connectionStatus = "Disconnected";

  final List<AgentThought> _thoughtBuffer = [];
  static const int _maxBufferSize = 100;

  bool get isConnected => _isConnected;
  String get connectionStatus => _connectionStatus;
  List<AgentThought> get thoughtBuffer => List.unmodifiable(_thoughtBuffer);
  Stream<AgentThought> get thoughtStream => _thoughtController.stream;

  ThoughtStreamService() {
    _connectionStatus = "Ready to connect to Node D: $_nodeDHost";
  }

  /// Connect to Node D thought stream via WebSocket
  Future<void> connect() async {
    if (_isConnected) {
      debugPrint(":: Thought Stream already connected");
      return;
    }

    try {
      _connectionStatus = "Connecting to Node D...";
      notifyListeners();

      _channel = WebSocketChannel.connect(Uri.parse(_wsUrl));

      _channel!.stream.listen(
        _handleMessage,
        onError: _handleError,
        onDone: _handleDone,
        cancelOnError: false,
      );

      await Future.delayed(const Duration(milliseconds: 500));
      _isConnected = true;
      _connectionStatus = "Connected to Node D: $_nodeDHost";
      debugPrint(":: Thought Stream Connected to Node D");
      notifyListeners();
    } catch (e) {
      _connectionStatus = "Connection failed: $e";
      _isConnected = false;
      debugPrint(":: Thought Stream Error: $e");
      notifyListeners();

      // Fallback to mock mode for development
      _startMockStream();
    }
  }

  /// Disconnect from thought stream
  void disconnect() {
    _channel?.sink.close();
    _channel = null;
    _isConnected = false;
    _connectionStatus = "Disconnected";
    notifyListeners();
  }

  /// Handle incoming WebSocket messages
  void _handleMessage(dynamic message) {
    try {
      final Map<String, dynamic> data = jsonDecode(message);
      final thought = AgentThought.fromJson(data);

      // Add to buffer
      _thoughtBuffer.add(thought);
      if (_thoughtBuffer.length > _maxBufferSize) {
        _thoughtBuffer.removeAt(0);
      }

      // Emit to stream
      _thoughtController.add(thought);

      debugPrint(":: Received thought: ${thought.text.substring(0, 50)}...");
    } catch (e) {
      debugPrint(":: Error parsing thought: $e");
    }
  }

  /// Handle WebSocket errors
  void _handleError(error) {
    _connectionStatus = "Stream error: $error";
    _isConnected = false;
    debugPrint(":: Thought Stream Error: $error");
    notifyListeners();

    // Fallback to mock mode
    _startMockStream();
  }

  /// Handle WebSocket close
  void _handleDone() {
    _connectionStatus = "Stream closed";
    _isConnected = false;
    debugPrint(":: Thought Stream Closed");
    notifyListeners();

    // Auto-reconnect after delay
    Future.delayed(const Duration(seconds: 5), () {
      if (!_isConnected) {
        connect();
      }
    });
  }

  /// Start mock thought stream for development/testing
  void _startMockStream() {
    debugPrint(":: Starting mock thought stream");

    _connectionStatus = "Mock Mode (Node D unavailable)";
    notifyListeners();

    final mockThoughts = [
      "Analyzing Phase 3 memory architecture...",
      "Connecting to Node A Synapse Cache via Tailscale...",
      "Lossless context management active on Hermes-LCM...",
      "Sovereign Hall 3D visualization initializing...",
      "Thought-artery flow detected: Node D → Node B...",
      "MemPalace entities mapping to LCM IdeaBlocks...",
      "Zero-Trust Artery encryption verified...",
      "Hermes v0.13.0 plugin system active...",
      "VSB Router model dispatching to Carnice-V2-27B...",
      "Consensus alignment checking mesh state...",
    ];

    int index = 0;
    Timer.periodic(const Duration(seconds: 3), (timer) {
      if (!_isConnected) {
        final thought = AgentThought(
          id: 'mock-${DateTime.now().millisecondsSinceEpoch}',
          text: mockThoughts[index % mockThoughts.length],
          timestamp: DateTime.now(),
          urgency: (index % 3) + 1, // 1-3 urgency
          agent: 'hermes-core',
          nodeId: '100.120.225.12',
        );

        _thoughtBuffer.add(thought);
        if (_thoughtBuffer.length > _maxBufferSize) {
          _thoughtBuffer.removeAt(0);
        }

        _thoughtController.add(thought);
        index++;
      } else {
        timer.cancel();
      }
    });
  }

  @override
  void dispose() {
    disconnect();
    _thoughtController.close();
    super.dispose();
  }
}

/// Agent Thought Data Model
class AgentThought {
  final String id;
  final String text;
  final DateTime timestamp;
  final int urgency; // 1-3, where 3 is highest urgency
  final String agent; // Source agent (hermes-core, vsb-router, etc.)
  final String nodeId; // Source node IP

  AgentThought({
    required this.id,
    required this.text,
    required this.timestamp,
    required this.urgency,
    required this.agent,
    required this.nodeId,
  });

  factory AgentThought.fromJson(Map<String, dynamic> json) {
    return AgentThought(
      id: json['id'] as String,
      text: json['text'] as String,
      timestamp: DateTime.parse(json['timestamp'] as String),
      urgency: json['urgency'] as int,
      agent: json['agent'] as String,
      nodeId: json['nodeId'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'text': text,
      'timestamp': timestamp.toIso8601String(),
      'urgency': urgency,
      'agent': agent,
      'nodeId': nodeId,
    };
  }

  /// Get display color based on urgency
  String get urgencyColor {
    switch (urgency) {
      case 3:
        return 'red'; // High urgency
      case 2:
        return 'yellow'; // Medium urgency
      default:
        return 'green'; // Normal urgency
    }
  }
}
