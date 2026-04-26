import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

enum ThemeModePreset { neonGreen, sovereignRed, gruvboxDark, gruvboxLight }

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
    // ◈ Tactical Sizing
    const double baseFontSize = 16.0;
    const double headerFontSize = 28.0;

    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: scaffoldBackgroundColor,
      primaryColor: primaryColor,
      hintColor: accentColor,
      textTheme: GoogleFonts.vt323TextTheme().apply(
        bodyColor: textColor,
        displayColor: textColor,
        fontSizeFactor: 1.2, // Global increase for readability
      ).copyWith(
        bodyMedium: GoogleFonts.vt323(fontSize: baseFontSize, color: textColor),
        bodyLarge: GoogleFonts.vt323(fontSize: baseFontSize + 2, color: textColor),
        headlineMedium: GoogleFonts.vt323(fontSize: headerFontSize, color: primaryColor, fontWeight: FontWeight.bold),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: const Color(0xFF282828),
        titleTextStyle: GoogleFonts.vt323(color: primaryColor, fontSize: headerFontSize),
        iconTheme: IconThemeData(color: primaryColor, size: 28),
      ),
      iconTheme: IconThemeData(color: primaryColor, size: 28),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF3C3836),
          foregroundColor: primaryColor,
          textStyle: GoogleFonts.vt323(fontSize: baseFontSize),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        labelStyle: TextStyle(color: primaryColor, fontSize: baseFontSize),
        hintStyle: TextStyle(color: primaryColor.withOpacity(0.5), fontSize: baseFontSize),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: primaryColor)),
        focusedBorder: OutlineInputBorder(borderSide: BorderSide(color: primaryColor, width: 2.0)),
      ),
      checkboxTheme: CheckboxThemeData(
        fillColor: WidgetStateProperty.all(primaryColor),
        checkColor: WidgetStateProperty.all(scaffoldBackgroundColor),
      ),
    );
  }
}

class ThemeService extends ChangeNotifier {
  ThemeModePreset _currentMode = ThemeModePreset.gruvboxDark;

  static final Map<ThemeModePreset, ThemePreset> presets = {
    ThemeModePreset.neonGreen: ThemePreset(
      scaffoldBackgroundColor: const Color(0xFF1D2021),
      primaryColor: const Color(0xFFB8BB26),
      accentColor: const Color(0xFF8EC07C),
      textColor: const Color(0xFFEBDBB2),
      name: 'GRUVB0X-GR33N',
    ),
    ThemeModePreset.sovereignRed: ThemePreset(
      scaffoldBackgroundColor: const Color(0xFF1D2021),
      primaryColor: const Color(0xFFFB4934),
      accentColor: const Color(0xFFFE8019),
      textColor: const Color(0xFFEBDBB2),
      name: 'GRUVB0X-R3D',
    ),
    ThemeModePreset.gruvboxDark: ThemePreset(
      scaffoldBackgroundColor: const Color(0xFF282828),
      primaryColor: const Color(0xFFFABD2F),
      accentColor: const Color(0xFFFE8019),
      textColor: const Color(0xFFEBDBB2),
      name: 'GRUVB0X-D4RK',
    ),
    ThemeModePreset.gruvboxLight: ThemePreset(
      scaffoldBackgroundColor: const Color(0xFFFBF1C7),
      primaryColor: const Color(0xFFAF3A03),
      accentColor: const Color(0xFFD65D0E),
      textColor: const Color(0xFF3C3836),
      name: 'GRUVB0X-L16H7',
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
