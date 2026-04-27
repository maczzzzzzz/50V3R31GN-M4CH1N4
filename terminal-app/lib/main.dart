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
import 'services/permission_service.dart';
import 'services/task_service.dart';
import 'services/vsb_listener.dart';
import 'services/notification_service.dart';
import 'screens/pretext_dashboard.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // ◈ Permission Ingress
  await PermissionService.requestStartupPermissions();

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
        Provider(create: (_) => NotificationService()),
        ChangeNotifierProvider(create: (_) => TaskService()),
        ChangeNotifierProvider(create: (_) => MemoryProvider()),
        ChangeNotifierProvider(create: (_) => ArteryClient()),
        ChangeNotifierProvider(create: (_) => VsbListener()),
        ChangeNotifierProvider(create: (_) => OpenClawBridge()),
        ChangeNotifierProvider(create: (_) => ScreenCaptureService()),
        ProxyProvider<OpenClawBridge, PostcardService>(
          update: (_, bridge, __) => PostcardService(bridge),
          dispose: (_, postcardService) => postcardService.dispose(),
        ),
        ChangeNotifierProvider(create: (_) => ChatService()),
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
          home: const PretextDashboard(),
        );
      },
    );
  }
}
