import 'dart:convert';
import 'chat_message.dart';

class Conversation {
  final String id;
  final String title;
  final List<ChatMessage> messages;
  final DateTime lastUpdated;

  Conversation({
    required this.id,
    required this.title,
    required this.messages,
    required this.lastUpdated,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'messages': messages.map((m) => m.toJson()).toList(),
      'lastUpdated': lastUpdated.toIso8601String(),
    };
  }

  factory Conversation.fromJson(Map<String, dynamic> json) {
    return Conversation(
      id: json['id'],
      title: json['title'],
      messages: (json['messages'] as List)
          .map((m) => ChatMessage.fromJson(m))
          .toList(),
      lastUpdated: DateTime.parse(json['lastUpdated']),
    );
  }

  Conversation copyWith({
    String? title,
    List<ChatMessage>? messages,
    DateTime? lastUpdated,
  }) {
    return Conversation(
      id: id,
      title: title ?? this.title,
      messages: messages ?? this.messages,
      lastUpdated: lastUpdated ?? this.lastUpdated,
    );
  }
}
