import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'screens/terminal_screen.dart';

void main() {
  runApp(const MachinaTerminalApp());
}

class MachinaTerminalApp extends StatelessWidget {
  const MachinaTerminalApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Machina Terminal',
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0D0D0D),
        primaryColor: const Color(0xFF00FF88),
        textTheme: GoogleFonts.vt323TextTheme(Theme.of(context).textTheme).apply(
          bodyColor: const Color(0xFF00FF88),
          displayColor: const Color(0xFF00FF88),
        ),
      ),
      home: const TerminalScreen(),
    );
  }
}
