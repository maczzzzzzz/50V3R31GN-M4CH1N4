import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

/**
 * SOVEREIGN_MEMORY_ARTERY — v3.8.26
 * 
 * Deeply integrated memory provider connecting the HUD to Akashik.db (FTS5)
 * and SovereignIntelligence.db (Triplets).
 */

class MemoryProvider extends ChangeNotifier {
  List<Map<String, dynamic>> _memories = [];
  bool _isLoading = false;
  String _searchQuery = "";

  List<Map<String, dynamic>> get memories => _memories;
  bool get isLoading => _isLoading;

  Future<void> fetchMemories() async {
    final prefs = await SharedPreferences.getInstance();
    final ip = prefs.getString('node_b_ip') ?? '100.101.177.76';
    final port = '3030'; // Nucleus Artery

    _isLoading = true;
    notifyListeners();

    try {
      final endpoint = _searchQuery.isEmpty 
          ? 'http://$ip:$port/api/memories'
          : 'http://$ip:$port/api/memories/search?q=${Uri.encodeComponent(_searchQuery)}';
      
      final res = await http.get(Uri.parse(endpoint));
      if (res.statusCode == 200) {
        final List<dynamic> data = jsonDecode(res.body);
        _memories = data.map((m) => Map<String, dynamic>.from(m)).toList();
      }
    } catch (e) {
      print("::/MEMORY_FAULT : $e");
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    fetchMemories();
  }

  /// Injects a new memory shard materialized by Hermes
  void addMemory(Map<String, dynamic> memory) {
    _memories.insert(0, memory);
    notifyListeners();
  }

  Future<void> deleteMemory(String id) async {
    // Phase 114.5: Placeholder for manual memory pruning
    _memories.removeWhere((m) => m['id'] == id);
    notifyListeners();
  }
}
