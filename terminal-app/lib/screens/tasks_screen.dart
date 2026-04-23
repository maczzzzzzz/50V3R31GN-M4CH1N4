import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../services/task_service.dart';
import '../models/task.dart';

class TasksScreen extends StatefulWidget {
  const TasksScreen({super.key});

  @override
  State<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends State<TasksScreen> {
  final _taskController = TextEditingController();
  DateTime? _selectedDate;
  TimeOfDay? _selectedTime;

  Future<void> _pickDateTime() async {
    final date = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (date == null) return;

    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
    );
    if (time == null) return;

    setState(() {
      _selectedDate = date;
      _selectedTime = time;
    });
  }

  void _addTask() {
    final title = _taskController.text.trim();
    if (title.isEmpty) return;

    DateTime? reminder;
    if (_selectedDate != null && _selectedTime != null) {
      reminder = DateTime(
        _selectedDate!.year,
        _selectedDate!.month,
        _selectedDate!.day,
        _selectedTime!.hour,
        _selectedTime!.minute,
      );
    }

    context.read<TaskService>().addTask(title, reminderTime: reminder);
    _taskController.clear();
    setState(() {
      _selectedDate = null;
      _selectedTime = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final taskService = context.watch<TaskService>();
    final primaryColor = Theme.of(context).primaryColor;

    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        title: const Text('MACHINA_TERMINAL // TASKS'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              children: [
                TextField(
                  controller: _taskController,
                  decoration: InputDecoration(
                    hintText: 'ADD_NEW_TASK...',
                    suffixIcon: IconButton(
                      icon: Icon(Icons.calendar_today, color: _selectedDate != null ? primaryColor : Colors.white54),
                      onPressed: _pickDateTime,
                    ),
                  ),
                  onSubmitted: (_) => _addTask(),
                ),
                if (_selectedDate != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 8.0),
                    child: Row(
                      children: [
                        Icon(Icons.alarm, size: 16, color: primaryColor),
                        const SizedBox(width: 8),
                        Text(
                          'REMINDER: ${DateFormat('yyyy-MM-dd HH:mm').format(DateTime(_selectedDate!.year, _selectedDate!.month, _selectedDate!.day, _selectedTime!.hour, _selectedTime!.minute))}',
                          style: TextStyle(color: primaryColor, fontSize: 14),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close, size: 16, color: Colors.white54),
                          onPressed: () => setState(() { _selectedDate = null; _selectedTime = null; }),
                        )
                      ],
                    ),
                  ),
              ],
            ),
          ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              itemCount: taskService.tasks.length,
              itemBuilder: (context, index) {
                final task = taskService.tasks[index];
                return Dismissible(
                  key: Key(task.id),
                  onDismissed: (_) => taskService.deleteTask(task.id),
                  background: Container(
                    color: Colors.red.withValues(alpha: 0.2),
                    alignment: Alignment.centerRight,
                    padding: const EdgeInsets.only(right: 20.0),
                    child: const Icon(Icons.delete, color: Colors.red),
                  ),
                  child: Card(
                    child: ListTile(
                      leading: Checkbox(
                        value: task.isCompleted,
                        onChanged: (_) => taskService.toggleTask(task.id),
                        activeColor: primaryColor,
                        checkColor: Colors.black,
                      ),
                      title: Text(
                        task.title,
                        style: TextStyle(
                          fontSize: 18,
                          decoration: task.isCompleted ? TextDecoration.lineThrough : null,
                        ),
                      ),
                      subtitle: task.reminderTime != null
                          ? Text(
                              'ALARM: ${DateFormat('HH:mm').format(task.reminderTime!)}',
                              style: TextStyle(color: primaryColor.withValues(alpha: 0.7)),
                            )
                          : null,
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
