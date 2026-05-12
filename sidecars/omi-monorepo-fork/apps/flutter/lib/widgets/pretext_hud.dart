import 'package:flutter/material.dart';
import 'package:omi_sovereign_flutter/services/thought_stream_service.dart';

/// Pretext HUD - Kinetic Typography Widget
///
/// Displays real-time agent thoughts with bit-identical typographic flows
/// matching the Desktop client. Integrates with Node D for live thought streams.
class PretextHUD extends StatefulWidget {
  final ThoughtStreamService thoughtStreamService;
  final bool isActive;

  const PretextHUD({
    super.key,
    required this.thoughtStreamService,
    this.isActive = true,
  });

  @override
  State<PretextHUD> createState() => _PretextHUDState();
}

class _PretextHUDState extends State<PretextHUD>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  final List<AgentThought> _displayedThoughts = [];
  AgentThought? _currentThought;
  String _currentText = '';
  int _charIndex = 0;
  StreamSubscription<AgentThought>? _thoughtSubscription;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 50),
      vsync: this,
    );

    _controller.addListener(() {
      if (widget.isActive && _currentThought != null) {
        _animateText();
      }
    });

    // Subscribe to thought stream
    _thoughtSubscription = widget.thoughtStreamService.thoughtStream.listen(
      (thought) {
        setState(() {
          _displayedThoughts.add(thought);
          // Keep only last 20 thoughts for display
          if (_displayedThoughts.length > 20) {
            _displayedThoughts.removeAt(0);
          }

          // Start animating the new thought
          if (_currentThought == null || _charIndex >= _currentThought!.text.length) {
            _currentThought = thought;
            _charIndex = 0;
            _currentText = '';
          }
        });
      },
      onError: (error) {
        debugPrint(":: Thought stream error: $error");
      },
    );

    // Start animation if active
    if (widget.isActive) {
      _controller.repeat();
    }
  }

  @override
  void didUpdateWidget(PretextHUD oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isActive != oldWidget.isActive) {
      if (widget.isActive) {
        _controller.repeat();
      } else {
        _controller.stop();
      }
    }
  }

  void _animateText() {
    if (_currentThought == null) return;

    final thoughtText = _currentThought!.text;

    if (_charIndex < thoughtText.length) {
      setState(() {
        _currentText = thoughtText.substring(0, _charIndex + 1);
        _charIndex++;
      });
    } else {
      // Move to next thought after a pause
      Future.delayed(const Duration(milliseconds: 500), () {
        if (mounted && _displayedThoughts.isNotEmpty) {
          // Find next thought after current
          final currentIndex = _displayedThoughts.indexOf(_currentThought!);
          if (currentIndex >= 0 && currentIndex < _displayedThoughts.length - 1) {
            _currentThought = _displayedThoughts[currentIndex + 1];
          } else if (currentIndex < _displayedThoughts.length - 1) {
            // If current thought not in list, use latest
            _currentThought = _displayedThoughts.last;
          }
          _charIndex = 0;
          _currentText = '';
        }
      });
    }
  }

  @override
  void dispose() {
    _thoughtSubscription?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black87,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: widget.isActive ? Colors.green : Colors.grey,
          width: 2,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(
                  color: widget.thoughtStreamService.isConnected ? Colors.green : Colors.grey,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 8),
              const Text(
                'AGENT THOUGHT STREAM',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 2,
                ),
              ),
              const Spacer(),
              if (_currentThought != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: _getUrgencyColor(_currentThought!.urgency).withOpacity(0.3),
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(
                      color: _getUrgencyColor(_currentThought!.urgency),
                      width: 1,
                    ),
                  ),
                  child: Text(
                    _currentThought!.agent.toUpperCase(),
                    style: TextStyle(
                      color: _getUrgencyColor(_currentThought!.urgency),
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                )
              else
                const Text('WAITING...', style: TextStyle(color: Colors.grey, fontSize: 10)),
            ],
          ),
          const Divider(color: Colors.grey, height: 24),

          // Kinetic Typography (simulated without external dependency)
          Expanded(
            child: SingleChildScrollView(
              child: Text(
                _currentText,
                style: const TextStyle(
                  color: Colors.green,
                  fontSize: 16,
                  fontFamily: 'monospace',
                ),
              ),
            ),
          ),

          // Thought Counter and Status
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Row(
              children: [
                Text(
                  'Buffered: ${_displayedThoughts.length} thoughts',
                  style: const TextStyle(
                    color: Colors.grey,
                    fontSize: 10,
                  ),
                ),
                const Spacer(),
                Text(
                  widget.thoughtStreamService.connectionStatus,
                  style: TextStyle(
                    color: widget.thoughtStreamService.isConnected ? Colors.green : Colors.grey,
                    fontSize: 10,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPulsingDot() {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: Colors.green.withOpacity(0.5 + 0.5 * _controller.value),
            shape: BoxShape.circle,
          ),
        );
      },
    );
  }

  Color _getUrgencyColor(int urgency) {
    switch (urgency) {
      case 3:
        return Colors.red;
      case 2:
        return Colors.yellow;
      default:
        return Colors.green;
    }
  }
}
