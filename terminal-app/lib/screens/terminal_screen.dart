import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:xterm/xterm.dart';
import '../services/artery_client.dart';

/**
 * ◈ TERMINAL_SCREEN : INTERACTIVE_ARTERY — v3.8.26
 * 
 * High-fidelity interactive bash shell via Go-native PTY proxy.
 * Connects the mobile HUD to the Ubuntu/NixOS spine.
 */

class TerminalScreen extends StatefulWidget {
  const TerminalScreen({super.key});

  @override
  State<TerminalScreen> createState() => _TerminalScreenState();
}

class _TerminalScreenState extends State<TerminalScreen> {
  late Terminal _terminal;
  WebSocketChannel? _channel;
  bool _isConnected = false;

  @override
  void initState() {
    super.initState();
    _terminal = Terminal(maxLines: 10000);
    _connectTerminal();
  }

  Future<void> _connectTerminal() async {
    final prefs = await SharedPreferences.getInstance();
    final ip = prefs.getString('node_b_ip') ?? '100.101.177.76';
    final port = '3030'; // Nucleus Artery
    
    try {
      final url = 'ws://$ip:$port/terminal/ws';
      _channel = WebSocketChannel.connect(Uri.parse(url));
      
      _channel!.stream.listen(
        (data) {
          if (data is List<int>) {
            _terminal.write(utf8.decode(data, allowMalformed: true));
          } else if (data is String) {
            _terminal.write(data);
          }
          if (!_isConnected) {
            setState(() => _isConnected = true);
          }
        },
        onDone: () => setState(() => _isConnected = false),
        onError: (e) => _terminal.write('\r\n::/ARTERY_FAULT : $e\r\n'),
      );

      _terminal.onOutput = (data) {
        _channel?.sink.add(data);
      };
      
    } catch (e) {
      _terminal.write('::/WS_FATAL : $e\n');
    }
  }

  @override
  void dispose() {
    _channel?.sink.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final accentColor = const Color(0xFFE07A5F);

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      appBar: AppBar(
        title: Row(
          children: [
            const Text('ARTERY_SHELL'),
            const SizedBox(width: 12),
            Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _isConnected ? const Color(0xFF00FF88) : Colors.red,
                boxShadow: _isConnected ? [
                  BoxShadow(color: const Color(0xFF00FF88).withOpacity(0.5), blurRadius: 4, spreadRadius: 2)
                ] : [],
              ),
            ),
          ],
        ),
        backgroundColor: const Color(0xFF0F0F0F),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              _channel?.sink.close();
              _connectTerminal();
            },
          ),
        ],
      ),
      body: Container(
        padding: const EdgeInsets.all(8),
        child: TerminalView(
          _terminal,
          padding: const EdgeInsets.all(8),
        ),
      ),
    );
  }
}
