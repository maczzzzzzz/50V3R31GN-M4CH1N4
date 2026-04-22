import 'package:flutter_test/flutter_test.dart';
import 'package:terminal_app/main.dart';
import 'package:provider/provider.dart';
import 'package:terminal_app/services/artery_client.dart';
import 'package:terminal_app/services/vsb_listener.dart';


void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => ArteryClient()),
          ChangeNotifierProvider(create: (_) => VsbListener()),
        ],
        child: const MachinaTerminalApp(),
      ),
    );

    // Verify that the app title is present.
    expect(find.text('MACHINA_TERMINAL // HOME'), findsOneWidget);
  });
}
