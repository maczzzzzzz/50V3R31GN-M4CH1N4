import 'package:omi_sovereign_flutter/services/thought_stream_service.dart';

/// Example usage of ThoughtStreamService
///
/// This file demonstrates how to use the thought stream service
/// for integration testing and development.
class ThoughtStreamExample {
  static void main() {
    // Create the service
    final thoughtService = ThoughtStreamService();

    // Subscribe to thought stream
    thoughtService.thoughtStream.listen((thought) {
      print(':: Received thought from ${thought.agent}:');
      print('   Text: ${thought.text}');
      print('   Urgency: ${thought.urgency}');
      print('   Node: ${thought.nodeId}');
      print('   Timestamp: ${thought.timestamp}');
      print('---');
    });

    // Connect to Node D
    thoughtService.connect();

    // Example: Create a manual thought for testing
    final exampleThought = AgentThought(
      id: 'example-${DateTime.now().millisecondsSinceEpoch}',
      text: 'This is a test thought for integration verification',
      timestamp: DateTime.now(),
      urgency: 2,
      agent: 'test-agent',
      nodeId: '100.120.225.12',
    );

    // Note: In production, thoughts come from WebSocket stream
    // This is just for manual testing

    // Check connection status
    print(':: Connection Status: ${thoughtService.connectionStatus}');
    print(':: Is Connected: ${thoughtService.isConnected}');
    print(':: Buffered Thoughts: ${thoughtService.thoughtBuffer.length}');

    // Disconnect when done
    // thoughtService.disconnect();
  }
}

/// Example thought data for testing WebSocket endpoint
///
/// Use this data to test the Node D WebSocket server
class ExampleThoughtData {
  static const List<Map<String, dynamic>> sampleThoughts = [
    {
      "id": "thought-001",
      "text": "Analyzing Phase 3 memory architecture...",
      "timestamp": "2024-05-10T12:00:00.000Z",
      "urgency": 1,
      "agent": "hermes-core",
      "nodeId": "100.120.225.12"
    },
    {
      "id": "thought-002",
      "text": "Connecting to Node A Synapse Cache via Tailscale...",
      "timestamp": "2024-05-10T12:00:03.000Z",
      "urgency": 2,
      "agent": "hermes-lcm",
      "nodeId": "100.120.225.12"
    },
    {
      "id": "thought-003",
      "text": "WARNING: Memory cache approaching capacity",
      "timestamp": "2024-05-10T12:00:06.000Z",
      "urgency": 3,
      "agent": "synapse-cache",
      "nodeId": "100.90.196.70"
    },
    {
      "id": "thought-004",
      "text": "Sovereign Hall 3D visualization initializing...",
      "timestamp": "2024-05-10T12:00:09.000Z",
      "urgency": 1,
      "agent": "claw3d",
      "nodeId": "100.66.173.31"
    },
    {
      "id": "thought-005",
      "text": "Thought-artery flow detected: Node D → Node B",
      "timestamp": "2024-05-10T12:00:12.000Z",
      "urgency": 2,
      "agent": "vsb-router",
      "nodeId": "100.120.225.12"
    },
  ];
}

/// WebSocket Server Test Guide
///
/// To test the Flutter client with a real WebSocket server:
///
/// 1. Create a simple WebSocket server on Node D (100.120.225.12:8080)
/// 2. Use the example thought data above
/// 3. Send thoughts every 3 seconds to simulate real agent activity
///
/// Example Python server (test only):
/// ```python
/// import asyncio
/// import websockets
/// import json
///
/// async def thought_stream(websocket, path):
///     thoughts = ExampleThoughtData.sampleThoughts
///     while True:
///         for thought in thoughts:
///             await websocket.send(json.dumps(thought))
///             await asyncio.sleep(3)
///
/// async def main():
///     async with websockets.serve(thought_stream, "0.0.0.0", 8080):
///         await asyncio.Future()  # run forever
///
/// if __name__ == "__main__":
///     asyncio.run(main())
/// ```
///
/// 4. Run the Flutter app and verify:
///    - Connection status shows "Connected to Node D"
///    - HUD displays thoughts with kinetic typography
///    - Agent badges appear with correct colors
///    - Thought buffer increments
