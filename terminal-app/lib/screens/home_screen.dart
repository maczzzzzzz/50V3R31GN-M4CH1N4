import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/artery_client.dart';
import '../services/vsb_listener.dart';
import 'chat_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ArteryClient>().connectFromPrefs();
      context.read<VsbListener>().start(9090);
    });
  }

  @override
  Widget build(BuildContext context) {
    final artery = context.watch<ArteryClient>();
    final vsb = context.watch<VsbListener>();

    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        title: const Text('MACHINA_TERMINAL // HOME'),
        backgroundColor: Colors.black,
        actions: [
          _StatusDot(connected: artery.isConnected),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16.0),
              itemCount: artery.logs.length + vsb.packets.length,
              itemBuilder: (context, index) {
                final combined = [...artery.logs, ...vsb.packets];
                if (index < combined.length) {
                  return Text(
                    combined[index],
                    style: const TextStyle(fontSize: 16),
                  );
                }
                return const SizedBox.shrink();
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                FloatingActionButton.large(
                  heroTag: 'mic_btn',
                  onPressed: () {
                    // Simulate push to talk
                    artery.addLog("::/USER : [AUDIO_STREAM_STARTED]");
                  },
                  backgroundColor: const Color(0xFF00FF88).withValues(alpha: 0.2),
                  foregroundColor: const Color(0xFF00FF88),
                  child: const Icon(Icons.mic),
                ),
                ElevatedButton.icon(
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const ChatScreen()),
                    );
                  },
                  icon: const Icon(Icons.chat),
                  label: const Text("ASK HERMES"),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.black,
                    foregroundColor: const Color(0xFF00FF88),
                    side: const BorderSide(color: Color(0xFF00FF88)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusDot extends StatelessWidget {
  final bool connected;
  const _StatusDot({required this.connected});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 12,
      height: 12,
      margin: const EdgeInsets.only(right: 16),
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: connected ? const Color(0xFF00FF88) : Colors.red,
        boxShadow: [
          if (connected)
            BoxShadow(
              color: const Color(0xFF00FF88).withValues(alpha: 0.5),
              blurRadius: 8,
              spreadRadius: 2,
            ),
        ],
      ),
    );
  }
}
