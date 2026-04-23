import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'screens/main_layout.dart';
import 'services/artery_client.dart';
import 'services/vsb_listener.dart';
import 'services/theme_service.dart';
import 'services/task_service.dart';
import 'services/chat_service.dart';
import 'services/notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ArteryClient()),
        ChangeNotifierProvider(create: (_) => VsbListener()),
        ChangeNotifierProvider(create: (_) => ThemeService()..setTheme(ThemeModePreset.sovereignRed)),
        ChangeNotifierProvider(create: (_) => TaskService()),
        ChangeNotifierProvider(create: (_) => ChatService()),
      ],
      child: const MachinaTerminalApp(),
    ),
  );
}

class MachinaTerminalApp extends StatefulWidget {
  const MachinaTerminalApp({super.key});

  @override
  State<MachinaTerminalApp> createState() => _MachinaTerminalAppState();
}

class _MachinaTerminalAppState extends State<MachinaTerminalApp> {
  @override
  void initState() {
    super.initState();
    _initServices();
  }

  Future<void> _initServices() async {
    try {
      final notifications = NotificationService();
      await notifications.init();
      await notifications.showPersistentEye();
    } catch (e) {
      debugPrint('◈ Service initialization failed: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<ThemeService>(
      builder: (context, themeService, child) {
        return MaterialApp(
          title: 'Machina Terminal',
          debugShowCheckedModeBanner: false,
          theme: themeService.currentPreset.themeData,
          home: const MainLayout(),
        );
      },
    );
  }
}
