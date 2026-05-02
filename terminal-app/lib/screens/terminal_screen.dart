import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/vsb_listener.dart';
import '../services/artery_client.dart';

/**
 * ◈ TERMINAL_SCREEN : CLINICAL_CLI — v3.8.25
 * 
 * Passive connection to the VSB and Artery logs.
 * Clinical industrial terminal interface.
 */

class TerminalScreen extends StatelessWidget {
  const TerminalScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final vsb = context.watch<VsbListener>();
    final artery = context.watch<ArteryClient>();
    final accentColor = const Color(0xFFF36622);

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      appBar: AppBar(
        title: const Text('TERMINAL_ARTERY'),
        backgroundColor: const Color(0xFF0F0F0F),
      ),
      body: Container(
        padding: const EdgeInsets.all(16),
        width: double.infinity,
        height: double.infinity,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('::/PASSIVE_ARTERY_LINK: ACTIVE', 
              style: TextStyle(color: Color(0xFFC7A87A), fontSize: 10, fontWeight: FontWeight.black, letterSpacing: 2, fontFamily: 'Space Grotesk')),
            const SizedBox(height: 12),
            const Divider(color: Color(0xFF262626)),
            Expanded(
              child: ListView.builder(
                reverse: true,
                itemCount: vsb.packets.length + artery.logs.length,
                itemBuilder: (context, index) {
                  final combined = [...vsb.packets, ...artery.logs];
                  if (index < combined.length) {
                    final log = combined[index];
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Text(
                        log,
                        style: TextStyle(
                          color: log.contains('ERROR') ? Colors.red : const Color(0xFFB8BB26),
                          fontSize: 12,
                          fontFamily: 'monospace',
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    );
                  }
                  return const SizedBox.shrink();
                },
              ),
            ),
            const SizedBox(height: 16),
            Container(
              height: 50,
              decoration: BoxDecoration(
                color: const Color(0xFF161616),
                border: Border.all(color: const Color(0xFF262626)),
              ),
              child: Row(
                children: [
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 12.0),
                    child: Text('Σ:/>', style: TextStyle(color: Color(0xFFF36622), fontWeight: FontWeight.black, fontSize: 14)),
                  ),
                  Expanded(
                    child: TextField(
                      style: const TextStyle(color: Colors.white, fontSize: 14, fontFamily: 'monospace'),
                      decoration: const InputDecoration(
                        border: InputBorder.none,
                        hintText: 'RAW_DIRECTIVE',
                        hintStyle: TextStyle(color: Color(0xFF404040)),
                        contentPadding: EdgeInsets.zero,
                      ),
                      onSubmitted: (val) {
                        if (val.isNotEmpty) {
                          artery.sendJsonCommand('SYSTEM_RAW', val);
                        }
                      },
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
