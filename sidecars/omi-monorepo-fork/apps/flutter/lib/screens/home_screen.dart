import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:omi_sovereign_flutter/services/omi_service.dart';
import 'package:omi_sovereign_flutter/services/thought_stream_service.dart';
import 'package:omi_sovereign_flutter/widgets/pretext_hud.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();

    // Connect to thought stream after a short delay
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        final thoughtService = Provider.of<ThoughtStreamService>(context, listen: false);
        thoughtService.connect();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Omi Sovereign'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        actions: [
          Consumer<OmiService>(
            builder: (context, omiService, child) {
              return IconButton(
                icon: Icon(omiService.isConnected ? Icons.cloud_done : Icons.cloud_off),
                onPressed: () => omiService.refreshConnection(),
                tooltip: omiService.isConnected ? 'Connected to Artery' : 'Disconnected',
              );
            },
          ),
          Consumer<ThoughtStreamService>(
            builder: (context, thoughtService, child) {
              return IconButton(
                icon: Icon(thoughtService.isConnected ? Icons.psychology : Icons.psychology_alt),
                onPressed: () {
                  if (thoughtService.isConnected) {
                    thoughtService.disconnect();
                  } else {
                    thoughtService.connect();
                  }
                },
                tooltip: thoughtService.isConnected ? 'Thought Stream Active' : 'Thought Stream Inactive',
              );
            },
          ),
        ],
      ),
      body: Consumer2<OmiService, ThoughtStreamService>(
        builder: (context, omiService, thoughtService, child) {
          return Column(
            children: [
              // Pretext HUD (Top Half)
              Expanded(
                flex: 1,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: PretextHUD(
                    thoughtStreamService: thoughtService,
                    isActive: omiService.isConnected,
                  ),
                ),
              ),

              // Divider
              const Divider(height: 1),

              // Connection Status (Bottom Half)
              Expanded(
                flex: 1,
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Connection Status Icon
                      Icon(
                        omiService.isConnected ? Icons.check_circle : Icons.error,
                        size: 60,
                        color: omiService.isConnected ? Colors.green : Colors.red,
                      ),
                      const SizedBox(height: 16),

                      // Status Message
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 32),
                        child: Text(
                          omiService.statusMessage,
                          style: Theme.of(context).textTheme.titleMedium,
                          textAlign: TextAlign.center,
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Health Status Details
                      if (omiService.healthStatus != null) ...[
                        Card(
                          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Artery Status',
                                  style: Theme.of(context).textTheme.titleMedium,
                                ),
                                const SizedBox(height: 10),
                                _buildStatusRow('Host', omiService.healthStatus!['host'] ?? 'Unknown'),
                                _buildStatusRow('Artery Mode', omiService.healthStatus!['artery_mode'] ?? 'Unknown'),
                                _buildStatusRow('STT Endpoint', omiService.healthStatus!['stt_endpoint'] ?? 'Unknown'),
                                _buildStatusRow('Storage Endpoint', omiService.healthStatus!['storage_endpoint'] ?? 'Unknown'),
                              ],
                            ),
                          ),
                        ),
                      ],

                      // Thought Stream Status
                      Card(
                        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(
                                    thoughtService.isConnected ? Icons.psychology : Icons.psychology_alt,
                                    color: thoughtService.isConnected ? Colors.green : Colors.grey,
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    'Thought Stream (Node D)',
                                    style: Theme.of(context).textTheme.titleMedium,
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              _buildStatusRow('Status', thoughtService.connectionStatus),
                              _buildStatusRow('Buffered Thoughts', '${thoughtService.thoughtBuffer.length}'),
                              if (thoughtService.thoughtBuffer.isNotEmpty)
                                _buildStatusRow('Latest', thoughtService.thoughtBuffer.last.text.substring(0, 50) + '...'),
                            ],
                          ),
                        ),
                      ),

                      const SizedBox(height: 16),

                      // Refresh Button
                      ElevatedButton.icon(
                        onPressed: () => omiService.refreshConnection(),
                        icon: const Icon(Icons.refresh),
                        label: const Text('Refresh Connection'),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildStatusRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              '$label:',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
          Expanded(
            child: Text(value, overflow: TextOverflow.ellipsis),
          ),
        ],
      ),
    );
  }
}
