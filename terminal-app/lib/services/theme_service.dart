import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

/**
 * ◈ NODESTADT_CLINICAL_THEME — v3.8.25
 * 
 * Clinical, industrial retro-futurism.
 * Replaces legacy Clinical/Space Grotesk with Space Grotesk and Lexend.
 */

enum ThemeModePreset { clinicalDark, softDark, hardDark, light }

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
    const double baseFontSize = 16.0;
    const double headerFontSize = 24.0;

    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: bg0,
      primaryColor: orange,
      canvasColor: bg1,
      hintColor: yellow,
      dividerColor: bg3,
      
      textTheme: GoogleFonts.lexendTextTheme().copyWith(
        bodyMedium: GoogleFonts.lexend(fontSize: baseFontSize, color: fg0),
        bodyLarge: GoogleFonts.lexend(fontSize: baseFontSize + 2, color: fg1),
        bodySmall: GoogleFonts.lexend(fontSize: baseFontSize - 4, color: fg1.withOpacity(0.7)),
        headlineMedium: GoogleFonts.cinzel(fontSize: headerFontSize, color: orange, fontWeight: FontWeight.bold, letterSpacing: 2),
        titleLarge: GoogleFonts.cinzel(fontSize: baseFontSize + 4, color: aqua, fontWeight: FontWeight.bold),
      ),
      
      appBarTheme: AppBarTheme(
        backgroundColor: bg1,
        elevation: 0,
        titleTextStyle: GoogleFonts.cinzel(color: fg0, fontSize: headerFontSize, fontWeight: FontWeight.bold, letterSpacing: 3),
        iconTheme: IconThemeData(color: orange, size: 28),
      ),
      
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: bg1,
        selectedItemColor: orange,
        unselectedItemColor: fg1.withOpacity(0.5),
        selectedLabelStyle: GoogleFonts.lexend(fontSize: 10, fontWeight: FontWeight.bold),
        unselectedLabelStyle: GoogleFonts.lexend(fontSize: 10),
        type: BottomNavigationBarType.fixed,
        elevation: 10,
      ),

      iconTheme: IconThemeData(color: orange, size: 28),
      
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: bg2,
          foregroundColor: fg0,
          textStyle: GoogleFonts.spaceGrotesk(fontSize: baseFontSize, fontWeight: FontWeight.bold),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
          side: BorderSide(color: bg3, width: 1),
        ),
      ),
      
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: bg1,
        labelStyle: TextStyle(color: yellow, fontSize: baseFontSize),
        hintStyle: TextStyle(color: fg1.withOpacity(0.3), fontSize: baseFontSize),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.zero, borderSide: BorderSide(color: bg3)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.zero, borderSide: BorderSide(color: orange, width: 2.0)),
      ),
      
      checkboxTheme: CheckboxThemeData(
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
        fillColor: WidgetStateProperty.all(orange),
        checkColor: WidgetStateProperty.all(bg0),
      ),
    );
  }

  // ◈ COMPATIBILITY_ARTERIES
  Color get scaffoldBackgroundColor => bg0;
  Color get primaryColor => orange;
  Color get accentColor => orange;
  Color get textColor => fg0;
  Color get cardColor => bg1;
}

class ThemeService extends ChangeNotifier {
  ThemeModePreset _currentMode = ThemeModePreset.clinicalDark;

  static final Map<ThemeModePreset, ThemePreset> presets = {
    ThemeModePreset.clinicalDark: ThemePreset(
      bg0: const Color(0xFF1A1A1A), // Authority Charcoal
      bg1: const Color(0xFF262626), 
      bg2: const Color(0xFF333333),
      bg3: const Color(0xFF404040),
      fg0: const Color(0xFFF2F2F2), // System White
      fg1: const Color(0xFFC0C0C0), // Antique Silver
      red: const Color(0xFFFB4934),
      green: const Color(0xFF8A9A5B), // Moss Green
      yellow: const Color(0xFFD4AF37), // Gold-Brass
      blue: const Color(0xFF4682B4), // Nexus Blue
      purple: const Color(0xFFD3869B),
      aqua: const Color(0xFF2F4F4F), // Deep Nodestadt Teal
      orange: const Color(0xFF376374), // Tactical Authority
      name: 'NODESTADT_RENEWAL',
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
