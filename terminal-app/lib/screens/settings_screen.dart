import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/theme_service.dart';

/**
 * TACTICAL_SETTINGS — v3.8.7
 * 
 * High-readability configuration mesh for the Sovereign HUD.
 * Handles Node B/C IP orchestration and Theme selection.
 */

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _nodeBIpController = TextEditingController();
  final _nodeCIpController = TextEditingController();
  final _rpcPortController = TextEditingController();
  final _visionPortController = TextEditingController();
  bool _secureTunnel = false;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _nodeBIpController.text = prefs.getString('node_b_ip') ?? '100.x.y.z';
      _nodeCIpController.text = prefs.getString('node_c_ip') ?? '100.x.y.z';
      _rpcPortController.text = prefs.getString('rpc_port') ?? '3011';
      _visionPortController.text = prefs.getString('vision_port') ?? '3013';
      _secureTunnel = prefs.getBool('secure_tunnel') ?? false;
    });
  }

  Future<void> _saveSettings() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('node_b_ip', _nodeBIpController.text.trim());
    await prefs.setString('node_c_ip', _nodeCIpController.text.trim());
    await prefs.setString('rpc_port', _rpcPortController.text.trim());
    await prefs.setString('vision_port', _visionPortController.text.trim());
    await prefs.setBool('secure_tunnel', _secureTunnel);
    
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('::/SETTINGS_SHORED'), backgroundColor: Color(0xFFB8BB26)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final themeService = context.watch<ThemeService>();
    final primaryColor = Theme.of(context).primaryColor;

    return Container(
      color: const Color(0xFF1D2021),
      child: ListView(
        padding: const EdgeInsets.all(24.0),
        children: [
          _buildSectionHeader("◈ NODE_TOPOLOGY", primaryColor),
          _buildTacticalField("NODE B (DIRECTOR) IP", _nodeBIpController, primaryColor),
          _buildTacticalField("NODE C (ORACLE) IP", _nodeCIpController, primaryColor),
          
          const SizedBox(height: 24),
          _buildSectionHeader("◈ ARTERY_PORTS", primaryColor),
          Row(
            children: [
              Expanded(child: _buildTacticalField("RPC_PORT", _rpcPortController, primaryColor)),
              const SizedBox(width: 16),
              Expanded(child: _buildTacticalField("VISION_PORT", _visionPortController, primaryColor)),
            ],
          ),

          const SizedBox(height: 24),
          _buildSectionHeader("◈ TACTICAL_THEME", primaryColor),
          _buildThemeDropdown(themeService, primaryColor),

          const SizedBox(height: 40),
          ElevatedButton(
            onPressed: _saveSettings,
            style: ElevatedButton.styleFrom(
              minimumSize: const Size(double.infinity, 60),
              backgroundColor: primaryColor.withOpacity(0.1),
              side: BorderSide(color: primaryColor, width: 2),
            ),
            child: const Text("EXECUTE_SYNC", style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 2)),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(title, style: TextStyle(color: color, fontSize: 14, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
    );
  }

  Widget _buildTacticalField(String label, TextEditingController controller, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: TextField(
        controller: controller,
        style: const TextStyle(color: Color(0xFFEBDBB2), fontSize: 16),
        decoration: InputDecoration(
          labelText: label,
          labelStyle: TextStyle(color: color.withOpacity(0.7), fontSize: 12),
          enabledBorder: const OutlineInputBorder(borderSide: BorderSide(color: Color(0xFF3C3836))),
          focusedBorder: OutlineInputBorder(borderSide: BorderSide(color: color)),
          filled: true,
          fillColor: const Color(0xFF282828),
        ),
      ),
    );
  }

  Widget _buildThemeDropdown(ThemeService service, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF282828),
        border: Border.all(color: const Color(0xFF3C3836)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<ThemeModePreset>(
          value: service.currentMode,
          isExpanded: true,
          dropdownColor: const Color(0xFF282828),
          style: TextStyle(color: color, fontSize: 16, fontFamily: 'monospace'),
          items: ThemeService.presets.entries.map((e) => DropdownMenuItem(value: e.key, child: Text(e.value.name))).toList(),
          onChanged: (m) => m != null ? service.setTheme(m) : null,
        ),
      ),
    );
  }
}
