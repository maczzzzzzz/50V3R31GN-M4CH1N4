import 'package:flutter/material.dart';

class TasksScreen extends StatelessWidget {
  const TasksScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final mockTasks = [
      "Review IMPLEMENTATION_PLAN.md",
      "Sync Node A and Node B",
      "Deploy 50V3R31GN-M4CH1N4 Bridge"
    ];

    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        title: const Text('MACHINA_TERMINAL // TASKS'),
        backgroundColor: Colors.black,
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16.0),
        itemCount: mockTasks.length,
        itemBuilder: (context, index) {
          return Card(
            color: Colors.black54,
            shape: RoundedRectangleBorder(
              side: const BorderSide(color: Color(0xFF00FF88)),
              borderRadius: BorderRadius.circular(4.0),
            ),
            child: ListTile(
              leading: const Icon(Icons.check_box_outline_blank, color: Color(0xFF00FF88)),
              title: Text(mockTasks[index], style: const TextStyle(fontSize: 18)),
            ),
          );
        },
      ),
    );
  }
}
