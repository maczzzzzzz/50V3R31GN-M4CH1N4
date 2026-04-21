import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/artery_client.dart';
import '../services/vsb_listener.dart';

class TerminalScreen extends StatefulWidget {
  const TerminalScreen({super.key});

  @override
  State<TerminalScreen> createState() => _TerminalScreenState();
}

class _TerminalScreenState extends State<TerminalScreen> {
  @override
  void initState() {
    super.initState();
    // Auto-connect to Node C (default address)
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ArteryClient>().connect('ws://10.0.0.30:7340/ws/audio');
      context.read<VsbListener>().start(9090);
    });
  }

  @override
  Widget build(BuildContext context) {
    final artery = context.watch<ArteryClient>();
    final vsb = context.watch<VsbListener>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('MACHINA_TERMINAL // NODE_C'),
        backgroundColor: Colors.black,
        actions: [
          _StatusDot(connected: artery.isConnected),
        ],
      ),
      body: Stack(
        children: [
          Positioned.fill(child: IgnorePointer(child: CustomPaint(painter: ScanLinePainter()))),
          Column(
            children: [
              // Telemetry Header
              Container(
                padding: const EdgeInsets.all(8.0),
                color: Colors.black.withOpacity(0.5),
                child: Row(
                  mainAxisAlignment: Row(children: [
                    const Text('QUANT_STATE: '),
                    _QuantButton(label: 'Q5', active: true),
                    _QuantButton(label: 'Q4', active: false),
                    _QuantButton(label: 'Q3', active: false),
                  ], mainAxisAlignment: MainAxisAlignment.spaceEvenly),
                ),
              ),
              // Unified Log Feed
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.all(16.0),
                  itemCount: artery.logs.length + vsb.packets.length,
                  itemBuilder: (context, index) {
                    final combined = [...artery.logs, ...vsb.packets];
                    return Text(
                      combined[index],
                      style: const TextStyle(fontSize: 16),
                    );
                  },
                ),
              ),
            ],
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
              color: const Color(0xFF00FF88).withOpacity(0.5),
              blurRadius: 8,
              spreadRadius: 2,
            ),
        ],
      ),
    );
  }
}

class _QuantButton extends StatelessWidget {
  final String label;
  final bool active;
  const _QuantButton({required this.label, required this.active});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        border: Border.all(color: active ? const Color(0xFF00FF88) : Colors.grey),
        borderRadius: BorderRadius.circular(4),
        color: active ? const Color(0xFF00FF88).withOpacity(0.1) : Colors.transparent,
      ),
      child: Text(
        label,
        style: TextStyle(
          color: active ? const Color(0xFF00FF88) : Colors.grey,
          fontWeight: active ? FontWeight.bold : FontWeight.normal,
        ),
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
