import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../services/task_service.dart';
import '../models/task.dart';
import '../widgets/geometric_shard.dart';

/**
 * ◈ TASKS_SCREEN : CLINICAL_IMPLEMENTATION — v3.8.25
 */

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
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.dark(
              primary: Color(0xFF376374),
              onPrimary: Colors.black,
              surface: Color(0xFF161616),
              onSurface: Color(0xFFE5E5E5),
            ),
          ),
          child: child!,
        );
      },
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

    context.read<TaskService>().addTask(title, reminder: reminder);
    _taskController.clear();
    setState(() {
      _selectedDate = null;
      _selectedTime = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final taskService = context.watch<TaskService>();
    final accentColor = const Color(0xFF376374);

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      appBar: AppBar(
        title: const Text('TASKS_MESH'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              children: [
                TextField(
                  controller: _taskController,
                  decoration: InputDecoration(
                    hintText: 'ADD_IMPLEMENTATION_SHARD',
                    suffixIcon: IconButton(
                      icon: Icon(Icons.calendar_today, color: _selectedDate != null ? accentColor : const Color(0xFF404040)),
                      onPressed: _pickDateTime,
                    ),
                  ),
                  onSubmitted: (_) => _addTask(),
                ),
                if (_selectedDate != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 12.0),
                    child: Row(
                      children: [
                        Icon(Icons.alarm, size: 14, color: accentColor),
                        const SizedBox(width: 12),
                        Text(
                          'SYNCHRONIZED_ALARM: ${DateFormat('yyyy-MM-dd HH:mm').format(DateTime(_selectedDate!.year, _selectedDate!.month, _selectedDate!.day, _selectedTime!.hour, _selectedTime!.minute))}',
                          style: TextStyle(color: accentColor, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1),
                        ),
                        const Spacer(),
                        IconButton(
                          icon: const Icon(Icons.close, size: 14, color: Color(0xFFA3A3A3)),
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
              padding: const EdgeInsets.symmetric(horizontal: 24.0),
              itemCount: taskService.tasks.length,
              itemBuilder: (context, index) {
                final task = taskService.tasks[index];
                return Dismissible(
                  key: Key(task.id),
                  onDismissed: (_) => taskService.deleteTask(task.id),
                  background: Container(
                    color: Colors.red.withOpacity(0.1),
                    alignment: Alignment.centerRight,
                    padding: const EdgeInsets.only(right: 30.0),
                    child: const Icon(Icons.delete_forever, color: Colors.red),
                  ),
                  child: GeometricShard(
                    borderColor: task.isCompleted ? const Color(0xFF262626) : const Color(0xFFC7A87A),
                    onTap: () => taskService.toggleTask(task.id),
                    title: Text(
                      task.title,
                      style: TextStyle(
                        fontSize: 16,
                        color: task.isCompleted ? const Color(0xFF404040) : Colors.white,
                        decoration: task.isCompleted ? TextDecoration.lineThrough : null,
                      ),
                    ),
                    subtitle: task.reminderTime != null
                        ? Text(
                            'ARTERY_PULSE: ${DateFormat('HH:mm').format(task.reminderTime!)}',
                            style: TextStyle(color: accentColor.withOpacity(0.6), fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1),
                          )
                        : null,
                    trailing: Icon(task.isCompleted ? Icons.check_box : Icons.check_box_outline_blank, color: task.isCompleted ? accentColor : const Color(0xFF262626), size: 20),
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
