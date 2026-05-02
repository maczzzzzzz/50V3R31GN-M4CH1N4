import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';
import '../models/task.dart';
import 'notification_service.dart';

/**
 * ◈ TASK_SERVICE : SHARD_MANAGER — v3.8.26
 * 
 * Manages implementation tasks and schedules reminder alarms via NotificationService.
 */

class TaskService extends ChangeNotifier {
  List<Task> _tasks = [];
  final NotificationService _notifications = NotificationService();
  final _uuid = const Uuid();

  List<Task> get tasks => _tasks;

  TaskService() {
    _loadTasks();
  }

  Future<void> _loadTasks() async {
    final prefs = await SharedPreferences.getInstance();
    final String? encoded = prefs.getString('shored_tasks');
    if (encoded != null) {
      final List<dynamic> decoded = jsonDecode(encoded);
      _tasks = decoded.map((item) => Task.fromJson(item)).toList();
      notifyListeners();
    }
  }

  Future<void> _saveTasks() async {
    final prefs = await SharedPreferences.getInstance();
    final String encoded = jsonEncode(_tasks.map((t) => t.toJson()).toList());
    await prefs.setString('shored_tasks', encoded);
  }

  void addTask(String title, {DateTime? reminder}) {
    final id = _uuid.v4();
    final newTask = Task(
      id: id,
      title: title.toUpperCase(),
      reminderTime: reminder,
    );
    _tasks.insert(0, newTask);
    _saveTasks();
    
    if (reminder != null) {
      _notifications.scheduleNotification(
        id: id.hashCode,
        title: "::/DIRECTIVE_RECALL",
        body: "Executing: $title",
        scheduledDate: reminder,
      );
    }
    
    notifyListeners();
  }

  void toggleTask(String id) {
    final index = _tasks.indexWhere((t) => t.id == id);
    if (index != -1) {
      _tasks[index] = _tasks[index].copyWith(isCompleted: !_tasks[index].isCompleted);
      if (_tasks[index].isCompleted) {
        _notifications.cancelNotification(id.hashCode);
      }
      _saveTasks();
      notifyListeners();
    }
  }

  void deleteTask(String id) {
    _tasks.removeWhere((t) => t.id == id);
    _notifications.cancelNotification(id.hashCode);
    _saveTasks();
    notifyListeners();
  }
}
