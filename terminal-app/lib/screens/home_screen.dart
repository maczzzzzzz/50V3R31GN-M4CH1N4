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
    final primaryColor = Theme.of(context).primaryColor;

    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        title: const Text('MACHINA_TERMINAL // HOME'),
        actions: [
          _StatusDot(connected: artery.isConnected),
        ],
      ),
      body: Column(
        children: [
          if (artery.isRecording)
            Container(
              padding: const EdgeInsets.all(12),
              color: Colors.red.withValues(alpha: 0.1),
              width: double.infinity,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('⟨ TRANSCRIPTION_STREAM ⟩', style: TextStyle(color: Colors.red, fontSize: 10)),
                  Text(
                    artery.currentTranscription.isEmpty ? 'LISTENING...' : artery.currentTranscription,
                    style: const TextStyle(fontSize: 18, fontStyle: FontStyle.italic),
                  ),
                ],
              ),
            ),
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
                    if (artery.isRecording) {
                      artery.stopVoiceStream();
                    } else {
                      artery.startVoiceStream();
                    }
                  },
                  backgroundColor: artery.isRecording ? Colors.red.withValues(alpha: 0.6) : primaryColor.withValues(alpha: 0.2),
                  foregroundColor: artery.isRecording ? Colors.white : primaryColor,
                  child: Icon(artery.isRecording ? Icons.stop : Icons.mic),
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
                    foregroundColor: primaryColor,
                    side: BorderSide(color: primaryColor),
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
    final primaryColor = Theme.of(context).primaryColor;
    return Container(
      width: 12,
      height: 12,
      margin: const EdgeInsets.only(right: 16),
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: connected ? primaryColor : Colors.red,
        boxShadow: [
          if (connected)
            BoxShadow(
              color: primaryColor.withValues(alpha: 0.5),
              blurRadius: 8,
              spreadRadius: 2,
            ),
        ],
      ),
    );
  }
}
