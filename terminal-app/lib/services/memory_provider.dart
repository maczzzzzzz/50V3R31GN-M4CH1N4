import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

/**
 * SOVEREIGN_MEMORY_ARTERY — v3.8.7
 * 
 * High-fidelity retrieval of historical transcriptions and RKG triplets.
 * Adopts OMI backend memory sync patterns.
 */

class MemoryProvider extends ChangeNotifier {
  List<Map<String, dynamic>> _memories = [];
  bool _isLoading = false;

  List<Map<String, dynamic>> get memories => List.unmodifiable(_memories);
  bool get isLoading => _isLoading;

  Future<void> fetchMemories() async {
    _isLoading = true;
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    final ip = prefs.getString('node_b_ip') ?? '100.x.y.z';
    
    try {
      final res = await http.get(Uri.parse('http://$ip:3011/api/memories'))
          .timeout(const Duration(seconds: 5));
          
      if (res.statusCode == 200) {
        final List decoded = jsonDecode(res.body);
        _memories = List<Map<String, dynamic>>.from(decoded);
      }
    } catch (e) {
      debugPrint("::/MEMORY_SYNC_ERROR : $e");
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Injects a new memory shard materialized by Hermes
  void addMemory(Map<String, dynamic> memory) {
    _memories.insert(0, memory);
    notifyListeners();
  }
}
