import 'dart:convert';

class ChatMessage {
  final String id;
  final String sender; // 'USER' or 'HERMES'
  final String text;
  final DateTime timestamp;
  final bool isSynced;

  ChatMessage({
    required this.id,
    required this.sender,
    required this.text,
    required this.timestamp,
    this.isSynced = false,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'sender': sender,
      'text': text,
      'timestamp': timestamp.toIso8601String(),
      'isSynced': isSynced,
    };
  }

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'],
      sender: json['sender'],
      text: json['text'],
      timestamp: DateTime.parse(json['timestamp']),
      isSynced: json['isSynced'] ?? false,
    );
  }

  ChatMessage copyWith({bool? isSynced}) {
    return ChatMessage(
      id: id,
      sender: sender,
      text: text,
      timestamp: timestamp,
      isSynced: isSynced ?? this.isSynced,
    );
  }
}
