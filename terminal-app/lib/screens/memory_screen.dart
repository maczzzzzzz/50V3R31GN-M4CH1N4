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
    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        title: const Text('MACHINA_TERMINAL // MEMORY'),
        backgroundColor: Colors.black,
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
                    style: const TextStyle(color: Color(0xFF00FF88)),
                    decoration: InputDecoration(
                      hintText: 'ADD NEW FACT...',
                      hintStyle: TextStyle(color: const Color(0xFF00FF88).withValues(alpha: 0.5)),
                      enabledBorder: const OutlineInputBorder(
                        borderSide: BorderSide(color: Color(0xFF00FF88)),
                      ),
                      focusedBorder: const OutlineInputBorder(
                        borderSide: BorderSide(color: Color(0xFF00FF88)),
                      ),
                    ),
                    onSubmitted: (_) => _addMemory(),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.add),
                  color: const Color(0xFF00FF88),
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
                  color: Colors.black54,
                  shape: RoundedRectangleBorder(
                    side: const BorderSide(color: Color(0xFF00FF88)),
                    borderRadius: BorderRadius.circular(4.0),
                  ),
                  child: ListTile(
                    leading: const Icon(Icons.memory, color: Color(0xFF00FF88)),
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
