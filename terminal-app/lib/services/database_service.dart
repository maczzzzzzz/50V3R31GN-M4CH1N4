import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'package:path_provider/path_provider.dart';

/**
 * DATABASE_SERVICE : v3.7.0
 * 
 * Implements the Triple-Helix Sync data layer for the Flutter HUD.
 * Handles Conversations, Synapse Shards, and extracted Triplets.
 */

class DatabaseService {
  static final DatabaseService _instance = DatabaseService._internal();
  static Database? _database;

  factory DatabaseService() => _instance;

  DatabaseService._internal();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    final docsDir = await getApplicationDocumentsDirectory();
    final path = join(docsDir.path, 'sovereign_hud.db');

    return await openDatabase(
      path,
      version: 1,
      onCreate: (db, version) async {
        // Conversations Table
        await db.execute('''
          CREATE TABLE conversations (
            id TEXT PRIMARY KEY,
            title TEXT,
            active_profile TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        ''');

        // Messages Table
        await db.execute('''
          CREATE TABLE messages (
            id TEXT PRIMARY KEY,
            conversation_id TEXT,
            role TEXT,
            content TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE
          )
        ''');

        // Synapse Triplets Table
        await db.execute('''
          CREATE TABLE os_triplets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subject_id TEXT,
            predicate TEXT,
            object_literal TEXT,
            source_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(subject_id, predicate, object_literal)
          )
        ''');
      },
    );
  }

  /// Engraves a new triplet into the local mesh.
  Future<void> engraveTriplet(String sub, String pred, String obj, String source) async {
    final db = await database;
    await db.insert(
      'os_triplets',
      {
        'subject_id': sub,
        'predicate': pred,
        'object_literal': obj,
        'source_id': source,
      },
      conflictAlgorithm: ConflictAlgorithm.ignore,
    );
  }
}
