import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

/**
 * ◈ GRUVB0X_M473R14L_7H3M3 — v3.8.7
 * 
 * High-fidelity port of sainnhe/gruvbox-material-vscode.
 * Standardized for the Sovereign Trinity OS.
 */

enum ThemeModePreset { mediumDark, softDark, hardDark, light }

class ThemePreset {
  final Color bg0;
  final Color bg1;
  final Color bg2;
  final Color bg3;
  final Color fg0;
  final Color fg1;
  final Color red;
  final Color green;
  final Color yellow;
  final Color blue;
  final Color purple;
  final Color aqua;
  final Color orange;
  final String name;

  ThemePreset({
    required this.bg0,
    required this.bg1,
    required this.bg2,
    required this.bg3,
    required this.fg0,
    required this.fg1,
    required this.red,
    required this.green,
    required this.yellow,
    required this.blue,
    required this.purple,
    required this.aqua,
    required this.orange,
    required this.name,
  });

  ThemeData get themeData {
    const double baseFontSize = 18.0;
    const double headerFontSize = 28.0;

    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: bg0,
      primaryColor: orange,
      canvasColor: bg1,
      hintColor: yellow,
      dividerColor: bg3,
      
      textTheme: GoogleFonts.vt323TextTheme().copyWith(
        bodyMedium: GoogleFonts.vt323(fontSize: baseFontSize, color: fg0),
        bodyLarge: GoogleFonts.vt323(fontSize: baseFontSize + 2, color: fg1),
        bodySmall: GoogleFonts.vt323(fontSize: baseFontSize - 4, color: fg1.withOpacity(0.7)),
        headlineMedium: GoogleFonts.vt323(fontSize: headerFontSize, color: red, fontWeight: FontWeight.bold),
        titleLarge: GoogleFonts.vt323(fontSize: baseFontSize + 4, color: aqua, fontWeight: FontWeight.bold),
      ),
      
      appBarTheme: AppBarTheme(
        backgroundColor: bg1,
        elevation: 0,
        titleTextStyle: GoogleFonts.vt323(color: fg0, fontSize: headerFontSize),
        iconTheme: IconThemeData(color: orange, size: 28),
      ),
      
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: bg1,
        selectedItemColor: orange,
        unselectedItemColor: fg1.withOpacity(0.5),
        selectedLabelStyle: GoogleFonts.vt323(fontSize: 10, fontWeight: FontWeight.bold),
        unselectedLabelStyle: GoogleFonts.vt323(fontSize: 10),
        type: BottomNavigationBarType.fixed,
        elevation: 10,
      ),

      iconTheme: IconThemeData(color: orange, size: 28),
      
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: bg2,
          foregroundColor: fg0,
          textStyle: GoogleFonts.vt323(fontSize: baseFontSize, fontWeight: FontWeight.bold),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: const BeveledRectangleBorder(),
          side: BorderSide(color: bg3, width: 1),
        ),
      ),
      
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: bg1,
        labelStyle: TextStyle(color: yellow, fontSize: baseFontSize),
        hintStyle: TextStyle(color: fg1.withOpacity(0.3), fontSize: baseFontSize),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: bg3)),
        focusedBorder: OutlineInputBorder(borderSide: BorderSide(color: orange, width: 2.0)),
      ),
      
      checkboxTheme: CheckboxThemeData(
        fillColor: WidgetStateProperty.all(orange),
        checkColor: WidgetStateProperty.all(bg0),
      ),
    );
  }
}

class ThemeService extends ChangeNotifier {
  ThemeModePreset _currentMode = ThemeModePreset.mediumDark;

  static final Map<ThemeModePreset, ThemePreset> presets = {
    ThemeModePreset.mediumDark: ThemePreset(
      bg0: const Color(0xFF282828),
      bg1: const Color(0xFF32302f),
      bg2: const Color(0xFF3c3836),
      bg3: const Color(0xFF504945),
      fg0: const Color(0xFFfbf1c7),
      fg1: const Color(0xFFebdbb2),
      red: const Color(0xFFfb4934),
      green: const Color(0xFFb8bb26),
      yellow: const Color(0xFFfabd2f),
      blue: const Color(0xFF83a598),
      purple: const Color(0xFFd3869b),
      aqua: const Color(0xFF8ec07c),
      orange: const Color(0xFFfe8019),
      name: 'GRUVB0X_MEDIUM',
    ),
    ThemeModePreset.softDark: ThemePreset(
      bg0: const Color(0xFF32302f),
      bg1: const Color(0xFF3c3836),
      bg2: const Color(0xFF504945),
      bg3: const Color(0xFF665c54),
      fg0: const Color(0xFFfbf1c7),
      fg1: const Color(0xFFddc7a1),
      red: const Color(0xFFfb4934),
      green: const Color(0xFFb8bb26),
      yellow: const Color(0xFFfabd2f),
      blue: const Color(0xFF83a598),
      purple: const Color(0xFFd3869b),
      aqua: const Color(0xFF8ec07c),
      orange: const Color(0xFFfe8019),
      name: 'GRUVB0X_SOFT',
    ),
    ThemeModePreset.hardDark: ThemePreset(
      bg0: const Color(0xFF1d2021),
      bg1: const Color(0xFF282828),
      bg2: const Color(0xFF32302f),
      bg3: const Color(0xFF3c3836),
      fg0: const Color(0xFFfbf1c7),
      fg1: const Color(0xFFebdbb2),
      red: const Color(0xFFfb4934),
      green: const Color(0xFFb8bb26),
      yellow: const Color(0xFFfabd2f),
      blue: const Color(0xFF83a598),
      purple: const Color(0xFFd3869b),
      aqua: const Color(0xFF8ec07c),
      orange: const Color(0xFFfe8019),
      name: 'GRUVB0X_HARD',
    ),
  };

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
      final url = '${secure ? "https" : "http"}://$ip:3011/api/system/theme';

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
