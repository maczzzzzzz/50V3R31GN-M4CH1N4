import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';
import '../models/task.dart';
import 'notification_service.dart';

/**
 * TACTICAL_TASK_SERVICE — v3.8.7
 * 
 * Manages Sovereign mission objectives.
 * Supports manual entry, deletion, and automated Hermes extraction.
 */

class TaskService extends ChangeNotifier {
  List<Task> _tasks = [];
  final _uuid = const Uuid();
  bool _isLoading = false;

  List<Task> get tasks => List.unmodifiable(_tasks);
  bool get isLoading => _isLoading;

  TaskService() {
    _loadTasks();
  }

  Future<void> _loadTasks() async {
    _isLoading = true;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    final encoded = prefs.getString('sovereign_tasks');
    if (encoded != null) {
      final List decoded = jsonDecode(encoded);
      _tasks = decoded.map((item) => Task.fromJson(item)).toList();
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> addTask(String title) async {
    final newTask = Task(
      id: _uuid.v4(),
      title: title,
      isCompleted: false,
    );
    _tasks.insert(0, newTask);
    await _saveTasks();
    notifyListeners();
  }

  Future<void> deleteTask(String id) async {
    _tasks.removeWhere((t) => t.id == id);
    await _saveTasks();
    notifyListeners();
  }

  Future<void> toggleTask(String id) async {
    final index = _tasks.indexWhere((t) => t.id == id);
    if (index != -1) {
      _tasks[index] = _tasks[index].copyWith(isCompleted: !_tasks[index].isCompleted);
      await _saveTasks();
      notifyListeners();
    }
  }

  Future<void> _saveTasks() async {
    final prefs = await SharedPreferences.getInstance();
    final encoded = jsonEncode(_tasks.map((t) => t.toJson()).toList());
    await prefs.setString('sovereign_tasks', encoded);
  }

  /// Automated extraction from Hermes (Phase 96.2)
  void extractTaskFromTranscription(String text) {
    // Basic regex extraction for "Remind me to..." or "Task: ..."
    if (text.toLowerCase().contains("task:") || text.toLowerCase().contains("todo:")) {
      final clean = text.split(":").last.trim();
      addTask(clean.toUpperCase());
    }
  }
}
