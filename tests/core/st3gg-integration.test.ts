/**
 * tests/core/st3gg-integration.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HybridRoutingController } from '../../src/core/hybrid-routing-controller.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { PNG } from 'pngjs';

// Mocks
const mockNitroLogic = { resolveAttack: vi.fn(), calculateDv: vi.fn(), oracleRoll: vi.fn(), isHealthy: vi.fn().mockResolvedValue(true) };
const mockSovereignNarrative = { generateNarrative: vi.fn().mockResolvedValue("SECRET_KEY") };
const mockFoundry = { 
  sendChatMessage: vi.fn(), 
  show3dDice: vi.fn(), 
  readActor: vi.fn(), 
  updateActor: vi.fn(), 
  activateScene: vi.fn(),
  openNightMarket: vi.fn(),
  pushDashboardUpdate: vi.fn(),
  triggerFxGlitch: vi.fn(),
  runSequence: vi.fn(),
  triggerPretextOverlay: vi.fn(),
};
const mockOracle = { query: vi.fn().mockReturnValue([]), executeTransaction: vi.fn(), isConnected: vi.fn().mockReturnValue(true), onAuthorize: undefined };
const mockStory = { evaluateEvent: vi.fn().mockReturnValue({ transitioned: false }), generateOverlayParams: vi.fn() };
const mockNightMarket = { getVendorInventory: vi.fn() };
const mockRedTrade = { rollFriction: vi.fn() };

describe('HybridRoutingController - ST3GG Integration', () => {
  let controller: any;
  const templatesDir = path.join(process.cwd(), 'data/assets/st3gg_templates');
  const templatePath = path.join(templatesDir, 'test.png');

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup template for test
    if (!fs.existsSync(templatesDir)) fs.mkdirSync(templatesDir, { recursive: true });
    const png = new PNG({ width: 10, height: 10 });
    fs.writeFileSync(templatePath, PNG.sync.write(png));

    controller = new HybridRoutingController({
      nitroLogicClient: mockNitroLogic as any,
      sovereignNarrativeClient: mockSovereignNarrative as any,
      foundryAdapter: mockFoundry as any,
      storyEngine: mockStory as any,
      gmApprovalQueue: {} as any,
      nightMarketService: mockNightMarket as any,
      unifiedOracle: mockOracle as any,
      redTradeService: mockRedTrade as any,
    });
  });

  it('handles file_extraction by generating an encoded image drop', async () => {
    const event = {
      type: 'file_extraction' as const,
      payload: { targetActorId: 'actor1', context: 'top secret' }
    };

    await controller.handleFoundryEvent(event);

    expect(mockSovereignNarrative.generateNarrative).toHaveBeenCalled();
    expect(mockFoundry.sendChatMessage).toHaveBeenCalledWith(
      expect.stringContaining('assets/st3gg_drops/'),
      expect.any(Object)
    );
  });

  it('handles decrypt_st3gg by decoding an image', async () => {
    // We'll decode the file we just created if we want to be thorough, 
    // but here we just test the RPC routing.
    // First, trigger an extraction to create a file
    await controller.handleFileExtraction({ targetActorId: 'actor1', context: 'test' });
    const chatCall = mockFoundry.sendChatMessage.mock.calls[0][0];
    const match = chatCall.match(/src="([^"]+)"/);
    const publicUrl = match[1];
    const localPath = path.join(process.cwd(), 'data', publicUrl);

    const result = await controller.handleFoundryEvent({
      type: 'decrypt_st3gg',
      payload: { imagePath: publicUrl }
    });

    expect(result).toEqual({ secret: "SECRET_KEY" });
  });
});
