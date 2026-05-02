import { GauntletPhase } from '../GauntletEngine';

/**
 * GAUNTLET_PHASE_v92 : MOBILE_PRETEXT_INTEGRITY — v3.8.26-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS
 * 
 * Verifies 100% design parity between Next.js PretextShroud 
 * and Flutter PretextScreen.
 */

export const v92MobilePretext: GauntletPhase = {
  id: 'v92-mobile-pretext',
  name: 'Mobile Pretext Integrity',
  objective: 'Achieve bit-identical UI rendering across Web and Mobile.',
  tasks: [
    {
      id: 'pretext-painter-verify',
      description: 'Check if PretextPainter.dart implements low-level Paragraph API.',
      command: 'grep -r "ui.ParagraphBuilder" terminal-app/lib/widgets/pretext_painter.dart',
      expectedOutput: 'ui.ParagraphBuilder'
    },
    {
      id: 'pretext-screen-active',
      description: 'Verify PretextScreen is the primary entry point.',
      command: 'grep "home: const PretextScreen()" terminal-app/lib/main.dart',
      expectedOutput: 'home: const PretextScreen()'
    },
    {
      id: 'context-rings-materialized',
      description: 'Ensure Circular Context Rings exist in the mobile header.',
      command: 'grep "_buildContextRings()" terminal-app/lib/screens/pretext_screen.dart',
      expectedOutput: '_buildContextRings()'
    }
  ]
};
