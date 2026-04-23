import 'package:flutter/material.dart';

class MemoryScreen extends StatefulWidget {
  const MemoryScreen({super.key});

  @override
  State<MemoryScreen> createState() => _MemoryScreenState();
}

class _MemoryScreenState extends State<MemoryScreen> {
  final List<String> _memories = [
    "User prefers Cyberpunk RED aesthetic.",
    "Node C is primary intelligence engine.",
    "Always assume zero-trust verification."
  ];

  final TextEditingController _controller = TextEditingController();

  void _addMemory() {
    final text = _controller.text.trim();
    if (text.isNotEmpty) {
      setState(() {
        _memories.insert(0, text);
      });
      _controller.clear();
    }
  }

  @override
  Widget build(BuildContext context) {
    final primaryColor = Theme.of(context).primaryColor;

    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        title: const Text('MACHINA_TERMINAL // MEMORY'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    decoration: const InputDecoration(
                      hintText: 'ADD NEW FACT...',
                    ),
                    onSubmitted: (_) => _addMemory(),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.add),
                  color: primaryColor,
                  onPressed: _addMemory,
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16.0),
              itemCount: _memories.length,
              itemBuilder: (context, index) {
                return Card(
                  child: ListTile(
                    leading: Icon(Icons.memory, color: primaryColor),
                    title: Text(_memories[index], style: const TextStyle(fontSize: 16)),
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
