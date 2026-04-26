import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';

/**
 * OBSIDIAN_SYNC_SERVICE : v3.8.3 (Logseq Intelligence Mesh)
 * 
 * Bidirectional synchronization between the mobile Flutter HUD and the 
 * Sovereign Shared Shard vault via Tailscale.
 */

class ObsidianSyncService {
  static final ObsidianSyncService _instance = ObsidianSyncService._internal();
  factory ObsidianSyncService() => _instance;
  ObsidianSyncService._internal();

  final String serverUrl = "http://100.x.y.z:3010/api/sync"; // Tailscale Node B IP

  /**
   * Pushes local mobile edits to the Shared Shard.
   */
  Future<void> pushLocalChanges(String fileName, String content) async {
    print(">> [SYNC] Pushing $fileName to Sovereign Artery...");
    try {
      final response = await http.post(
        Uri.parse("$serverUrl/push"),
        body: {'file': fileName, 'content': content},
      );
      if (response.statusCode == 200) {
        print("✅ [SYNC] $fileName shored in cloud vault.");
      }
    } catch (e) {
      print("❌ [SYNC] Push failed: $e");
    }
  }

  /**
   * Pulls the latest documentation from the Shared Shard.
   */
  Future<void> pullLatestDocs() async {
    print(">> [SYNC] Pulling latest shards from Shared Artery...");
    try {
      final response = await http.get(Uri.parse("$serverUrl/pull"));
      if (response.statusCode == 200) {
        final directory = await getApplicationDocumentsDirectory();
        final file = File('${directory.path}/Sovereign_OS/LATEST_MANIFEST.json');
        await file.writeAsString(response.body);
        print("✅ [SYNC] Local vault synchronized.");
      }
    } catch (e) {
      print("❌ [SYNC] Pull failed: $e");
    }
  }
}
