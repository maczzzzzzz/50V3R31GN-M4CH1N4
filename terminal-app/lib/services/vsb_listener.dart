import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'vsb_protocol.dart';

class VsbListener extends ChangeNotifier {
  RawDatagramSocket? _socket;
  final List<String> _packets = [];
  bool _isListening = false;
  String? _activeProfile;

  List<String> get packets => List.unmodifiable(_packets);
  bool get isListening => _isListening;
  String? get activeProfile => _activeProfile;

  Future<void> start(int port) async {
    try {
      _socket = await RawDatagramSocket.bind(InternetAddress.anyIPv4, port);
      _isListening = true;
      notifyListeners();

      _socket!.listen((RawSocketEvent event) {
        if (event == RawSocketEvent.read) {
          Datagram? dg = _socket!.receive();
          if (dg != null) {
            _handlePacket(dg.data);
          }
        }
      });
    } catch (e) {
      _addPacket("::/VSB_ERROR : $e");
    }
  }

  void _handlePacket(Uint8List data) {
    if (VsbProtocol.verifyMagic(data)) {
      final profile = VsbProtocol.parseIdentitySwitch(data);
      if (profile != null && profile != _activeProfile) {
        _activeProfile = profile;
        _addPacket("::/IDENTITY_SWITCH : $profile");
        notifyListeners();
      } else {
        _addPacket("::/VSB_PULSE : [HEALTHY]");
      }
    } else {
      // Fallback for text-based packets
      String msg = String.fromCharCodes(data);
      _addPacket("::/VSB_RAW : $msg");
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
