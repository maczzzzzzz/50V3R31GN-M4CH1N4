import 'dart:io';
import 'package:flutter/foundation.dart';

class VsbListener extends ChangeNotifier {
  RawDatagramSocket? _socket;
  final List<String> _packets = [];
  bool _isListening = false;

  List<String> get packets => List.unmodifiable(_packets);
  bool get isListening => _isListening;

  Future<void> start(int port) async {
    try {
      _socket = await RawDatagramSocket.bind(InternetAddress.anyIPv4, port);
      _isListening = true;
      notifyListeners();

      _socket!.listen((RawSocketEvent event) {
        if (event == RawSocketEvent.read) {
          Datagram? dg = _socket!.receive();
          if (dg != null) {
            String msg = String.fromCharCodes(dg.data);
            _addPacket("::/VSB_PACKET : $msg");
          }
        }
      });
    } catch (e) {
      _addPacket("::/VSB_ERROR : $e");
    }
  }

  void _addPacket(String msg) {
    _packets.insert(0, msg);
    if (_packets.length > 50) _packets.removeLast();
    notifyListeners();
  }

  @override
  void dispose() {
    _socket?.close();
    super.dispose();
  }
}
