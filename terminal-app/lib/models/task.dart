import 'dart:convert';

class Task {
  final String id;
  final String title;
  final bool isCompleted;
  final DateTime? reminderTime;

  Task({
    required this.id,
    required this.title,
    this.isCompleted = false,
    this.reminderTime,
  });

  Task copyWith({
    String? title,
    bool? isCompleted,
    DateTime? reminderTime,
  }) {
    return Task(
      id: id,
      title: title ?? this.title,
      isCompleted: isCompleted ?? this.isCompleted,
      reminderTime: reminderTime ?? this.reminderTime,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'isCompleted': isCompleted,
      'reminderTime': reminderTime?.toIso8601String(),
    };
  }

  factory Task.fromJson(Map<String, dynamic> json) {
    return Task(
      id: json['id'],
      title: json['title'],
      isCompleted: json['isCompleted'] ?? false,
      reminderTime: json['reminderTime'] != null 
          ? DateTime.parse(json['reminderTime']) 
          : null,
    );
  }
}
