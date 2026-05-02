import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/theme_service.dart';
import '../services/artery_client.dart';

/**
 * ◈ TACTICAL_SETTINGS : CLINICAL_CONFIG — v3.8.26
 * 
 * High-readability configuration mesh for the NODESTADT Authority.
 * Manages quaternary node orchestration and zero-trust arteries.
 */

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _nodeAIpController = TextEditingController();
  final _nodeBIpController = TextEditingController();
  final _nodeCIpController = TextEditingController();
  final _nodeDIpController = TextEditingController();
  final _vsbPortController = TextEditingController();
  final _rpcPortController = TextEditingController();
  bool _redMode = false;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _nodeAIpController.text = prefs.getString('node_a_ip') ?? '10.0.0.10';
      _nodeBIpController.text = prefs.getString('node_b_ip') ?? '10.0.0.11';
      _nodeCIpController.text = prefs.getString('node_c_ip') ?? '10.0.0.12';
      _nodeDIpController.text = prefs.getString('node_d_ip') ?? '10.0.0.13';
      _vsbPortController.text = prefs.getString('vsb_port') ?? '7878';
      _rpcPortController.text = prefs.getString('rpc_port') ?? '7341';
      _redMode = prefs.getBool('red_mode_active') ?? false;
    });
  }

  Future<void> _saveSettings() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('node_a_ip', _nodeAIpController.text.trim());
    await prefs.setString('node_b_ip', _nodeBIpController.text.trim());
    await prefs.setString('node_c_ip', _nodeCIpController.text.trim());
    await prefs.setString('node_d_ip', _nodeDIpController.text.trim());
    await prefs.setString('vsb_port', _vsbPortController.text.trim());
    await prefs.setString('rpc_port', _rpcPortController.text.trim());
    await prefs.setBool('red_mode_active', _redMode);
    
    // Sync with Artery
    if (mounted) {
      final artery = context.read<ArteryClient>();
      artery.sendJsonCommand(_redMode ? 'RED_MODE_ON' : 'RED_MODE_OFF', '');

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('::/ARTERY_SETTINGS_SHORED', style: TextStyle(color: Colors.black, fontWeight: FontWeight.w900)), 
          backgroundColor: Color(0xFFF36622)
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final themeService = context.watch<ThemeService>();
    final accentColor = const Color(0xFFF36622);

    return Container(
      color: const Color(0xFF0A0A0A),
      child: ListView(
        padding: const EdgeInsets.all(30.0),
        children: [
          _buildClinicalHeader("◈ QUATERNARY_TOPOLOGY", accentColor),
          _buildTechnicalField("NODE_A (SYNAPSE)", _nodeAIpController, accentColor),
          _buildTechnicalField("NODE_B (DIRECTOR)", _nodeBIpController, accentColor),
          _buildTechnicalField("NODE_C (ORACLE)", _nodeCIpController, accentColor),
          _buildTechnicalField("NODE_D (HEAVY)", _nodeDIpController, accentColor),
          
          const SizedBox(height: 30),
          _buildClinicalHeader("◈ ARTERY_PORTS", accentColor),
          Row(
            children: [
              Expanded(child: _buildTechnicalField("VSB_PORT", _vsbPortController, accentColor)),
              const SizedBox(width: 20),
              Expanded(child: _buildTechnicalField("RPC_PORT", _rpcPortController, accentColor)),
            ],
          ),

          const SizedBox(height: 30),
          _buildClinicalHeader("◈ SIMULATION_PROTOCOL", accentColor),
          _buildSimulationToggle(accentColor),

          const SizedBox(height: 30),
          _buildClinicalHeader("◈ AESTHETIC_PROTOCOL", accentColor),
          _buildThemeSelector(themeService, accentColor),

          const SizedBox(height: 50),
          _clinicalExecuteButton(_saveSettings, accentColor),
        ],
      ),
    );
  }

  Widget _buildClinicalHeader(String title, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Text(title, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 3, fontFamily: 'Space Grotesk')),
    );
  }

  Widget _buildTechnicalField(String label, TextEditingController controller, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: TextField(
        controller: controller,
        style: const TextStyle(color: Color(0xFFE5E5E5), fontSize: 14, fontFamily: 'Lexend'),
        decoration: InputDecoration(
          labelText: label,
          labelStyle: TextStyle(color: color.withOpacity(0.6), fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 2),
          enabledBorder: const OutlineInputBorder(borderRadius: BorderRadius.zero, borderSide: BorderSide(color: Color(0xFF262626))),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.zero, borderSide: BorderSide(color: color, width: 1.5)),
          filled: true,
          fillColor: const Color(0xFF161616),
        ),
      ),
    );
  }

  Widget _buildSimulationToggle(Color color) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF161616),
        border: Border.all(color: const Color(0xFF262626)),
      ),
      child: SwitchListTile(
        title: Text("CYBERPUNK_RED_MODE", style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 2)),
        subtitle: const Text("Unlock simulation lore and Akashik.db ingress.", style: TextStyle(color: Color(0xFF808080), fontSize: 10)),
        value: _redMode,
        activeColor: color,
        onChanged: (val) => setState(() => _redMode = val),
      ),
    );
  }

  Widget _buildThemeSelector(ThemeService service, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: const Color(0xFF161616),
        border: Border.all(color: const Color(0xFF262626)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<ThemeModePreset>(
          value: service.currentMode,
          isExpanded: true,
          dropdownColor: const Color(0xFF161616),
          style: TextStyle(color: color, fontSize: 13, fontWeight: FontWeight.w900, letterSpacing: 1),
          items: ThemeService.presets.entries.map((e) => DropdownMenuItem(value: e.key, child: Text(e.value.name.toUpperCase()))).toList(),
          onChanged: (m) => m != null ? service.setTheme(m) : null,
        ),
      ),
    );
  }

  Widget _clinicalExecuteButton(VoidCallback onPressed, Color color) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        height: 60,
        decoration: BoxDecoration(
          border: Border.all(color: color, width: 2),
          color: color.withOpacity(0.05),
        ),
        child: Center(
          child: Text("EXECUTE_ARTERY_SYNC", style: TextStyle(color: color, fontWeight: FontWeight.w900, letterSpacing: 4, fontSize: 12, fontFamily: 'Space Grotesk')),
        ),
      ),
    );
  }
}
