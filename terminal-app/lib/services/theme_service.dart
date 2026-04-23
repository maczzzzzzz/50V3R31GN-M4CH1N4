import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

enum ThemeModePreset { neonGreen, sovereignRed }

class ThemePreset {
  final Color scaffoldBackgroundColor;
  final Color primaryColor;
  final Color accentColor;
  final Color textColor;
  final String name;

  ThemePreset({
    required this.scaffoldBackgroundColor,
    required this.primaryColor,
    required this.accentColor,
    required this.textColor,
    required this.name,
  });

  ThemeData get themeData {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: scaffoldBackgroundColor,
      primaryColor: primaryColor,
      hintColor: accentColor,
      textTheme: GoogleFonts.vt323TextTheme().apply(
        bodyColor: textColor,
        displayColor: textColor,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.black,
        titleTextStyle: GoogleFonts.vt323(color: primaryColor, fontSize: 24),
        iconTheme: IconThemeData(color: primaryColor),
      ),
      cardTheme: CardThemeData(
        color: Colors.black54,
        shape: RoundedRectangleBorder(
          side: BorderSide(color: primaryColor),
          borderRadius: BorderRadius.circular(4.0),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        labelStyle: TextStyle(color: primaryColor),
        hintStyle: TextStyle(color: primaryColor.withValues(alpha: 0.5)),
        enabledBorder: OutlineInputBorder(
          borderSide: BorderSide(color: primaryColor),
        ),
        focusedBorder: OutlineInputBorder(
          borderSide: BorderSide(color: primaryColor, width: 2.0),
        ),
      ),
    );
  }
}

class ThemeService extends ChangeNotifier {
  static final Map<ThemeModePreset, ThemePreset> presets = {
    ThemeModePreset.neonGreen: ThemePreset(
      scaffoldBackgroundColor: const Color(0xFF0D0D0D),
      primaryColor: const Color(0xFF00FF88),
      accentColor: const Color(0xFF00FF88),
      textColor: const Color(0xFF00FF88),
      name: '50V3R31GN-GR33N',
    ),
    ThemeModePreset.sovereignRed: ThemePreset(
      scaffoldBackgroundColor: const Color(0xFF0D0000),
      primaryColor: const Color(0xFFFF1A1A),
      accentColor: const Color(0xFFFF1A1A),
      textColor: Colors.white,
      name: '50V3R31GN-R3D',
    ),
  };

  ThemeModePreset _currentMode = ThemeModePreset.neonGreen;

  ThemeModePreset get currentMode => _currentMode;
  ThemePreset get currentPreset => presets[_currentMode]!;

  void setTheme(ThemeModePreset mode) {
    _currentMode = mode;
    notifyListeners();
    syncWithNodeB();
  }

  Future<void> syncWithNodeB() async {
    final prefs = await SharedPreferences.getInstance();
    final ip = prefs.getString('node_b_ip');
    if (ip == null) return;

    try {
      final secure = prefs.getBool('secure_tunnel') ?? false;
      final protocol = secure ? 'https' : 'http';
      final url = '$protocol://$ip:3011/api/system/theme';

      await http.post(
        Uri.parse(url),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'theme': _currentMode.toString().split('.').last}),
      ).timeout(const Duration(seconds: 3));
    } catch (e) {
      debugPrint('Theme sync failed: $e');
    }
  }
}
