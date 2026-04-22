import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _ipController = TextEditingController();
  final _portController = TextEditingController();
  bool _secureTunnel = false;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _ipController.text = prefs.getString('node_c_ip') ?? '10.0.0.30';
      _portController.text = prefs.getString('node_c_port') ?? '7340';
      _secureTunnel = prefs.getBool('secure_tunnel') ?? false;
    });
  }

  Future<void> _saveSettings() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('node_c_ip', _ipController.text.trim());
    await prefs.setString('node_c_port', _portController.text.trim());
    await prefs.setBool('secure_tunnel', _secureTunnel);
    
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('SETTINGS_SAVED'),
          backgroundColor: Color(0xFF00FF88),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        title: const Text('MACHINA_TERMINAL // SETTINGS'),
        backgroundColor: Colors.black,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          TextField(
            controller: _ipController,
            style: const TextStyle(color: Color(0xFF00FF88)),
            decoration: const InputDecoration(
              labelText: 'NODE C IP ADDRESS',
              labelStyle: TextStyle(color: Color(0xFF00FF88)),
              enabledBorder: OutlineInputBorder(
                borderSide: BorderSide(color: Color(0xFF00FF88)),
              ),
              focusedBorder: OutlineInputBorder(
                borderSide: BorderSide(color: Color(0xFF00FF88)),
              ),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _portController,
            style: const TextStyle(color: Color(0xFF00FF88)),
            decoration: const InputDecoration(
              labelText: 'NODE C PORT',
              labelStyle: TextStyle(color: Color(0xFF00FF88)),
              enabledBorder: OutlineInputBorder(
                borderSide: BorderSide(color: Color(0xFF00FF88)),
              ),
              focusedBorder: OutlineInputBorder(
                borderSide: BorderSide(color: Color(0xFF00FF88)),
              ),
            ),
          ),
          const SizedBox(height: 16),
          SwitchListTile(
            title: const Text('SECURE TUNNEL (VPN)', style: TextStyle(color: Color(0xFF00FF88))),
            value: _secureTunnel,
            onChanged: (value) {
              setState(() {
                _secureTunnel = value;
              });
            },
            activeThumbColor: Colors.black,
            activeTrackColor: const Color(0xFF00FF88),
            inactiveThumbColor: Colors.grey,
            inactiveTrackColor: Colors.black54,
          ),
          const SizedBox(height: 32),
          ElevatedButton(
            onPressed: _saveSettings,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF00FF88).withValues(alpha: 0.2),
              foregroundColor: const Color(0xFF00FF88),
              side: const BorderSide(color: Color(0xFF00FF88)),
              padding: const EdgeInsets.all(16.0),
            ),
            child: const Text('SAVE SETTINGS'),
          ),
        ],
      ),
    );
  }
}
