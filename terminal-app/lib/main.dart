import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'services/theme_service.dart';
import 'services/chat_service.dart';
import 'services/artery_client.dart';
import 'services/database_service.dart';
import 'services/memory_provider.dart';
import 'services/openclaw_bridge.dart';
import 'services/screen_capture_service.dart';
import 'services/postcard_service.dart';
import 'screens/chat_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  final themeService = ThemeService();
  final dbService = DatabaseService();
  // Database initialization is lazy-loaded via the getter, 
  // but we trigger it here to ensure the physical file is materialized.
  await dbService.database;

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: themeService),
        Provider.value(value: dbService),
        ChangeNotifierProvider(create: (_) => MemoryProvider()),
        ChangeNotifierProvider(create: (_) => ArteryClient()),
        ChangeNotifierProvider(create: (_) => OpenClawBridge()),
        ChangeNotifierProvider(create: (_) => ScreenCaptureService()),
        ProxyProvider<OpenClawBridge, PostcardService>(
          update: (_, bridge, __) => PostcardService(bridge),
          dispose: (_, postcardService) => postcardService.dispose(),
        ),
        Provider(create: (_) => ChatService()),
      ],
      child: const SovereignApp(),
    ),
  );
}

class SovereignApp extends StatelessWidget {
  const SovereignApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<ThemeService>(
      builder: (context, themeService, child) {
        return MaterialApp(
          title: '50V3R31GN HUD',
          debugShowCheckedModeBanner: false,
          theme: themeService.currentPreset.themeData,
          home: const ChatScreen(),
        );
      },
    );
  }
}
