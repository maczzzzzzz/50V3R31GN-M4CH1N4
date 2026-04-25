import 'package:flutter/foundation.dart';
import 'database_service.dart';

/**
 * MEMORY_PROVIDER : v3.7.0
 * 
 * Manages the persistent memory graph for the Flutter HUD.
 * Handles Titled Memories and extracted Triplets via DatabaseService.
 */

class MemoryProvider extends ChangeNotifier {
  final DatabaseService _db = DatabaseService();
  
  List<Map<String, dynamic>> _triplets = [];
  List<Map<String, dynamic>> _archivedConversations = [];
  bool _isLoading = false;

  List<Map<String, dynamic>> get triplets => _triplets;
  List<Map<String, dynamic>> get archivedConversations => _archivedConversations;
  bool get isLoading => _isLoading;

  MemoryProvider() {
    refresh();
  }

  Future<void> refresh() async {
    _isLoading = true;
    notifyListeners();

    try {
      final db = await _db.database;
      
      // Load Triplets
      _triplets = await db.query('os_triplets', orderBy: 'created_at DESC');
      
      // Load Archived Conversations
      _archivedConversations = await db.query('conversations', orderBy: 'updated_at DESC');
      
    } catch (e) {
      debugPrint('◈ Memory refresh failed: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Engraves a new triplet and refreshes the state.
  Future<void> engrave(String sub, String pred, String obj, String source) async {
    await _db.engraveTriplet(sub, pred, obj, source);
    await refresh();
  }
}
