import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/theme_service.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _ipController = TextEditingController();
  final _arteryPortController = TextEditingController();
  final _llmPortController = TextEditingController();
  final _directorIpController = TextEditingController();
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
      _arteryPortController.text = prefs.getString('node_c_port') ?? '7340';
      _llmPortController.text = prefs.getString('node_c_llm_port') ?? '7339';
      _directorIpController.text = prefs.getString('node_b_ip') ?? '10.0.0.10';
      _secureTunnel = prefs.getBool('secure_tunnel') ?? false;
    });
  }

  Future<void> _saveSettings() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('node_c_ip', _ipController.text.trim());
    await prefs.setString('node_c_port', _arteryPortController.text.trim());
    await prefs.setString('node_c_llm_port', _llmPortController.text.trim());
    await prefs.setString('node_b_ip', _directorIpController.text.trim());
    await prefs.setBool('secure_tunnel', _secureTunnel);
    
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('SETTINGS_SAVED'),
          backgroundColor: Theme.of(context).primaryColor,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final themeService = context.watch<ThemeService>();
    final primaryColor = Theme.of(context).primaryColor;

    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        title: const Text('MACHINA_TERMINAL // SETTINGS'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          TextField(
            controller: _ipController,
            decoration: const InputDecoration(
              labelText: 'NODE C IP ADDRESS',
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _directorIpController,
            decoration: const InputDecoration(
              labelText: 'NODE B (DIRECTOR) IP ADDRESS',
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _arteryPortController,
                  decoration: const InputDecoration(
                    labelText: 'ARTERY PORT',
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: TextField(
                  controller: _llmPortController,
                  decoration: const InputDecoration(
                    labelText: 'LLM PORT',
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SwitchListTile(
            title: Text('REMOTE_ENCRYPTION (SSL)', style: TextStyle(color: primaryColor)),
            subtitle: const Text('ENABLE ONLY IF NODES HAVE SSL CERTS. TAILSCALE IS SECURE BY DEFAULT.', style: TextStyle(fontSize: 10, color: Colors.white54)),
            value: _secureTunnel,
            onChanged: (value) {
              setState(() {
                _secureTunnel = value;
              });
            },
            activeThumbColor: Colors.black,
            activeTrackColor: primaryColor,
            inactiveThumbColor: Colors.grey,
            inactiveTrackColor: Colors.black54,
          ),
          const Divider(color: Colors.white24, height: 32),
          Text('SYSTEM_THEME', style: TextStyle(color: primaryColor, fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          DropdownButtonFormField<ThemeModePreset>(
            value: themeService.currentMode,
            dropdownColor: Colors.black,
            style: TextStyle(color: primaryColor, fontSize: 18),
            decoration: const InputDecoration(
              contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
            items: ThemeService.presets.entries.map((entry) {
              return DropdownMenuItem(
                value: entry.key,
                child: Text(entry.value.name),
              );
            }).toList(),
            onChanged: (mode) {
              if (mode != null) {
                themeService.setTheme(mode);
              }
            },
          ),
          const SizedBox(height: 32),
          ElevatedButton(
            onPressed: _saveSettings,
            style: ElevatedButton.styleFrom(
              backgroundColor: primaryColor.withValues(alpha: 0.2),
              foregroundColor: primaryColor,
              side: BorderSide(color: primaryColor),
              padding: const EdgeInsets.all(16.0),
            ),
            child: const Text('SAVE SETTINGS'),
          ),
        ],
      ),
    );
  }
}
