import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:omi_sovereign_flutter/services/omi_service.dart';
import 'package:omi_sovereign_flutter/services/thought_stream_service.dart';
import 'package:omi_sovereign_flutter/screens/home_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  // Set preferred orientations
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
  ]);

  runApp(const OmiSovereignApp());
}

class OmiSovereignApp extends StatelessWidget {
  const OmiSovereignApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => OmiService()),
        ChangeNotifierProvider(create: (_) => ThoughtStreamService()),
      ],
      child: MaterialApp(
        title: 'Omi Sovereign',
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
          useMaterial3: true,
        ),
        home: const HomeScreen(),
      ),
    );
  }
}
