import 'package:flutter/material.dart';

class TerminalScreen extends StatelessWidget {
  const TerminalScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('MACHINA_TERMINAL // NODE_B'),
        backgroundColor: Colors.black,
        elevation: 0,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1.0),
          child: Container(
            color: const Color(0xFF00FF88).withOpacity(0.6),
            height: 1.0,
          ),
        ),
      ),
      body: Stack(
        children: [
          // Simulated CRT Scanline Overlay
          Positioned.fill(
            child: IgnorePointer(
              child: CustomPaint(
                painter: ScanLinePainter(),
              ),
            ),
          ),
          // Terminal Output
          ListView.builder(
            padding: const EdgeInsets.all(16.0),
            itemCount: 10,
            itemBuilder: (context, index) {
              return Text(
                '::/VSB_RECEIVE : Pulse $index',
                style: const TextStyle(fontSize: 18),
              );
            },
          ),
        ],
      ),
    );
  }
}

class ScanLinePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF00FF88).withOpacity(0.05)
      ..strokeWidth = 1.0;

    for (double i = 0; i < size.height; i += 4) {
      canvas.drawLine(Offset(0, i), Offset(size.width, i), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
