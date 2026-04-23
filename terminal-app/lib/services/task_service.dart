import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';
import '../models/task.dart';
import 'notification_service.dart';

class TaskService extends ChangeNotifier {
  List<Task> _tasks = [];
  final NotificationService _notificationService = NotificationService();
  final _uuid = const Uuid();

  List<Task> get tasks => _tasks;

  TaskService() {
    _loadTasks();
  }

  Future<void> _loadTasks() async {
    final prefs = await SharedPreferences.getInstance();
    final tasksJson = prefs.getStringList('tasks') ?? [];
    _tasks = tasksJson.map((t) => Task.fromJson(jsonDecode(t))).toList();
    notifyListeners();
  }

  Future<void> _saveTasks() async {
    final prefs = await SharedPreferences.getInstance();
    final tasksJson = _tasks.map((t) => jsonEncode(t.toJson())).toList();
    await prefs.setStringList('tasks', tasksJson);
  }

  Future<void> addTask(String title, {DateTime? reminderTime}) async {
    final task = Task(
      id: _uuid.v4(),
      title: title,
      reminderTime: reminderTime,
    );
    _tasks.add(task);
    await _saveTasks();
    
    if (reminderTime != null) {
      await _notificationService.scheduleNotification(
        task.id.hashCode,
        'SOVEREIGN_REMINDER',
        title,
        reminderTime,
      );
    }
    
    notifyListeners();
  }

  Future<void> deleteTask(String id) async {
    _tasks.removeWhere((t) => t.id == id);
    await _saveTasks();
    await _notificationService.cancelNotification(id.hashCode);
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
}
