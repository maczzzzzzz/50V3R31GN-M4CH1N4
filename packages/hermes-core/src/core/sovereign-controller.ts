import { randomUUID } from 'node:crypto';
import type { 
  INitroLogicClient, 
  ISovereignNarrativeClient, 
  SovereignProfile,
  ILogger
} from './interfaces.js';
import type { UnifiedOracleClient } from '../db/unified-oracle-client.js';

export interface SovereignControllerOptions {
  nitroLogicClient: INitroLogicClient;
  sovereignNarrativeClient: ISovereignNarrativeClient;
  unifiedOracle: UnifiedOracleClient;
  logger?: ILogger;
}

/**
 * ◈ SOVEREIGN_CONTROLLER : Clean BASE
 *
 * Core system orchestration for the Sovereign OS.
 * Handles system intents, profile management, and zero-trust verification.
 */
export class SovereignController {
  private readonly nitroLogic: INitroLogicClient;
  private readonly sovereignNarrative: ISovereignNarrativeClient;
  private readonly unifiedOracle: UnifiedOracleClient;
  private readonly logger?: ILogger | undefined;

  private activeProfile: SovereignProfile = 'SOVEREIGN_OS';

  constructor(options: SovereignControllerOptions) {
    this.nitroLogic = options.nitroLogicClient;
    this.sovereignNarrative = options.sovereignNarrativeClient;
    this.unifiedOracle = options.unifiedOracle;
    this.logger = options.logger;

    this.setProfile('SOVEREIGN_OS');
  }

  public setProfile(profile: SovereignProfile): void {
    this.activeProfile = profile;
    this.sovereignNarrative.setProfile(profile);
    this.logger?.info('SovereignController', 'profile', `Profile switched to: ${profile}`);
  }

  async handleProxyIntent(intent: any): Promise<void> {
    const traceId = randomUUID();
    const { method, params } = intent;
    
    this.logger?.info('SovereignController', traceId, `Handling Intent: ${method}`, { params });

    switch (method) {
      case 'shut-down':
        this.logger?.info('SovereignController', traceId, '🔴 EMERGENCY SHUTDOWN RECEIVED');
        process.emit('SIGTERM');
        break;
      case 'switch-profile':
        this.setProfile(params.profile as SovereignProfile);
        break;
      default:
        this.logger?.warn('SovereignController', traceId, `Unknown intent method: ${method}`);
    }
  }
}
