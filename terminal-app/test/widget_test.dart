import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:terminal_app/services/theme_service.dart';
import 'package:terminal_app/services/database_service.dart';
import 'package:terminal_app/services/memory_provider.dart';
import 'package:terminal_app/services/artery_client.dart';
import 'package:terminal_app/services/vsb_listener.dart';
import 'package:terminal_app/services/openclaw_bridge.dart';
import 'package:terminal_app/services/screen_capture_service.dart';
import 'package:terminal_app/services/postcard_service.dart';
import 'package:terminal_app/services/chat_service.dart';
import 'package:terminal_app/services/task_service.dart';
import 'package:terminal_app/services/notification_service.dart';
import 'package:terminal_app/screens/pretext_dashboard.dart';

void main() {
  testWidgets('Pretext Dashboard Integrity Test', (WidgetTester tester) async {
    final themeService = ThemeService();
    
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider.value(value: themeService),
          Provider(create: (_) => DatabaseService()),
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
        child: MaterialApp(
          theme: themeService.currentPreset.themeData,
          home: const PretextDashboard(),
        ),
      ),
    );

    // Verify Header Materialization
    expect(find.text('50V3R31GN_M4CH1N4'), findsOneWidget);
    expect(find.textContaining('INTELLIGENCE_OS'), findsOneWidget);

    // Verify Navigation Bar
    expect(find.text('HOME'), findsOneWidget);
    expect(find.text('TASKS'), findsOneWidget);
    expect(find.text('TERM'), findsOneWidget);

    // Verify Artery Input
    expect(find.byType(TextField), findsOneWidget);
    expect(find.byIcon(Icons.mic), findsOneWidget);
  });
}
