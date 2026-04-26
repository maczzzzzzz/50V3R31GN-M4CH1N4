import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../services/vsb_listener.dart';
import '../services/artery_client.dart';

/**
 * TERMINAL_SCREEN : v3.7.0
 * 
 * High-fidelity tactical CLI. 
 * Provides a passive connection to the VSB and Artery logs.
 */

class TerminalScreen extends StatelessWidget {
  const TerminalScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final vsb = context.watch<VsbListener>();
    final artery = context.watch<ArteryClient>();
    final primaryColor = Theme.of(context).primaryColor;

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: Text('MACHINA_HUD // TERMINAL', style: GoogleFonts.vt323()),
        backgroundColor: Colors.black,
      ),
      body: Container(
        padding: const EdgeInsets.all(12),
        width: double.infinity,
        height: double.infinity,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('::/PASSIVE_CONNECTION_ACTIVE', 
              style: GoogleFonts.vt323(color: primaryColor, fontSize: 14)),
            const Divider(color: Colors.white10),
            Expanded(
              child: ListView.builder(
                reverse: true,
                itemCount: vsb.packets.length + artery.logs.length,
                itemBuilder: (context, index) {
                  final combined = [...vsb.packets, ...artery.logs];
                  if (index < combined.length) {
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 2),
                      child: Text(
                        combined[index],
                        style: GoogleFonts.vt323(
                          color: combined[index].contains('ERROR') ? Colors.red : primaryColor,
                          fontSize: 16,
                        ),
                      ),
                    );
                  }
                  return const SizedBox.shrink();
                },
              ),
            ),
            const SizedBox(height: 8),
            Container(
              height: 40,
              decoration: BoxDecoration(
                border: Border.all(color: primaryColor.withValues(alpha: 0.3)),
              ),
              child: Row(
                children: [
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 8.0),
                    child: Text('>', style: TextStyle(color: Colors.white)),
                  ),
                  Expanded(
                    child: TextField(
                      style: GoogleFonts.vt323(color: Colors.white),
                      decoration: const InputDecoration(
                        border: InputBorder.none,
                        hintText: 'ENTER_COMMAND...',
                        hintStyle: TextStyle(color: Colors.white24),
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
