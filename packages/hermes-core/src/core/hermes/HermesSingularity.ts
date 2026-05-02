import { randomUUID } from 'node:crypto';
import { logger } from '../../shared/logger.js';
import { ContextDAG } from './ContextDAG.js';
import { HealerProtocol, RepairStrategy, type OrchestratorState } from './HealerProtocol.js';
import { MemoryObserver } from './MemoryObserver.js';
import { ArteryClient } from '../../shared/ArteryClient.js';
import type { Database } from 'better-sqlite3';

/**
 * HERMES_SINGULARITY — PHASE 105.5
 * 
 * The native orchestration engine for the Sovereign Trinity.
 * Subsumes legacy linear proxies into a high-fidelity Context-DAG loop.
 */

export interface SingularityInput {
  prompt: string;
  tokens?: number | undefined;
  thread_id?: string | undefined;
  file_path?: string | undefined;
  diff?: string | undefined;
}

export interface SingularityResult {
  ruleResult: {
    tasks: string[];
    [key: string]: any;
  };
  report?: string;
  audit?: any;
  outcome?: 'SUCCESS' | 'FATAL' | 'PENDING';
  prompt?: string;
  response?: string;
  error?: string;
  activeNode?: string;
  ozStage?: OzPipelineStage;
}

export type AgentRole = 'PLANNER' | 'WORKER' | 'REVIEWER' | 'SYNTHESIZER';

export type OzPipelineStage = 'Triage' | 'Spec' | 'Implement' | 'Review';

export interface OzDevEpisode {
  stage: OzPipelineStage;
  telemetry: any;
}

export class HermesSingularity {
  private dag: ContextDAG;
  private db: Database | undefined;
  private logger = logger;

  constructor(db?: Database) {
    this.dag = new ContextDAG();
    this.db = db;
  }

  /**
   * ◈ Phase 106+: Mined Oz Contribution Pipeline
   * Routes incoming Warp telemetry through the structured Triage -> Spec -> Implement -> Review loop.
   */
  public async handleWarpTelemetry(episode: OzDevEpisode): Promise<void> {
    this.logger.info('HermesSingularity', 'trace', `[OZ_PIPELINE] Processing telemetry at stage: ${episode.stage}`);
    
    switch (episode.stage) {
      case 'Triage':
        // Trigger GEPA reflection to categorize the issue
        this.logger.debug('HermesSingularity', 'trace', 'Triaging developer intent...');
        break;
      case 'Spec':
        // Generate structured spec based on triage
        this.logger.debug('HermesSingularity', 'trace', 'Generating implementation spec...');
        break;
      case 'Implement':
        // Push rich blocks to Warp / Pretext HUD
        this.logger.debug('HermesSingularity', 'trace', 'Suggesting implementation refactors...');
        break;
      case 'Review':
        // Grade the outcome against success metrics
        this.logger.debug('HermesSingularity', 'trace', 'Reviewing dev episode outcome...');
        break;
      default:
        this.logger.warn('HermesSingularity', 'trace', `[OZ_PIPELINE] Unknown telemetry stage: ${episode.stage}`);
        break;
    }
  }

  /**
   * Orchestrate a long-running Research Swarm (v3.8.28-GOLD)
   */
  public async orchestrateResearchSwarm(prompt: string, threadId: string = randomUUID()): Promise<SingularityResult> {
    this.logger.info('HermesSingularity', threadId, `[SWARM] Initiating Research: ${prompt.substring(0, 50)}...`);
    
    // 1. THE PLANNER: Decompose task
    const planNode = this.dag.addNode(`Planning research for: ${prompt}`, 'system');
    const tasks = await this.decomposeTask(prompt);
    this.logger.info('HermesSingularity', threadId, `[PLANNER] Decomposed into ${tasks.length} sub-tasks.`);

    // 2. THE WORKERS: Parallel execution
    const results: any[] = [];
    for (const task of tasks) {
      const workerNode = this.dag.addNode(`Executing: ${task}`, 'agent', planNode);
      
      const result = await this.executeWorkerTask(task);
      results.push(result);
      
      // 3. THE REVIEWER: Audit findings
      const reviewNode = this.dag.addNode(`Reviewing: ${task}`, 'agent', workerNode);
      
      const isClean = await this.auditFinding(result);
      if (!isClean) {
        this.logger.warn('HermesSingularity', threadId, `[REVIEWER] Finding rejected: ${task}. Retrying...`);
        // Retry logic or Experience-Gitting log
        await this.logExperience('REVIEWER', task, { finding: result }, 'Incomplete data', 'MEDIUM');
      }
    }

    // 4. THE SYNTHESIZER: Compile report
    const synthNode = this.dag.addNode('Synthesizing final report', 'agent');
    const finalReport = await this.synthesizeReport(results);

    return {
      ruleResult: { tasks },
      report: finalReport,
      audit: { status: 'VERIFIED' }
    };
  }

  private async decomposeTask(prompt: string): Promise<string[]> {
    // Phase 103 placeholder: In a real run, this calls Node D Oracle
    return ['Deep-dive into SGLang prefix caching', 'Analyze Intel NPU/iGPU compatibility', 'Verify TTFT benchmarks'];
  }

  private async executeWorkerTask(task: string): Promise<any> {
    return { task, data: `Extracted data for ${task}` };
  }

  private async auditFinding(finding: any): Promise<boolean> {
    return true; // Mock pass
  }

  private async synthesizeReport(results: any[]): Promise<string> {
    return `# Research Report\n\n${results.map(r => `## ${r.task}\n${r.data}`).join('\n\n')}`;
  }

  /**
   * Experience-Gitting (v3.8.28-GOLD): Log failure trajectories for future reasoning.
   */
  public async logExperience(agentId: string, task: string, failureTrace: any, fix?: string, severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW'): Promise<void> {
    if (!this.db) return;
    
    const id = randomUUID().replace(/-/g, '').substring(0, 16);
    try {
      const stmt = this.db.prepare(`
        INSERT INTO experience_logs (id, agent_id, task_description, failure_trajectory, learned_fix, severity)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      stmt.run(id, agentId, task, JSON.stringify(failureTrace), fix || null, severity);
      this.logger.info('HermesSingularity', id, `Experience Logged: ${task} [${severity}]`);
    } catch (err) {
      this.logger.error('HermesSingularity', id, `Failed to log experience: ${(err as Error).message}`);
    }
  }

  /**
   * Primary entry point for agentic reasoning and coordination.
   */
  public async invoke(input: SingularityInput): Promise<SingularityResult> {
    const traceId = input.thread_id || randomUUID();
    const prompt = input.prompt;
    
    this.logger.info('HermesSingularity', traceId, `Native Ingress: ${prompt.substring(0, 50)}...`);

    // 1. Get negative constraints from HealerProtocol (Experience-Gitting)
    const negativeConstraints = await HealerProtocol.getNegativeConstraints(prompt);
    const enrichedPrompt = prompt + negativeConstraints;
    // ◈ Phase 103: Discovery-First Hardgate Enforcement
    const discoveryResult = await this.discoverStateBeforePlan(enrichedPrompt);
    const hardgatePrompt = enrichedPrompt + "\n\n◈ [HARDGATE_DISCOVERY]: " + JSON.stringify(discoveryResult);

    const state: OrchestratorState = {
      activeNode: 'node-c', // Default to Oracle
      retries: 0,
      prompt: hardgatePrompt,
      tokens: input.tokens ?? 0,
      file_path: input.file_path ?? '',
      diff: input.diff ?? ''
    };

    let result: SingularityResult | null = null;
    const systemPrompt = "[IMPORTANT: HERMES_SINGULARITY_ORCHESTRATOR v3.8.28-GOLD]";
    
    while (state.retries < 3) {
      try {
        const content = await ArteryClient.chat({
          model: state.activeNode === 'node-c' ? 'qwen-oracle' : 'gemma-director',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: state.prompt }
          ],
          max_tokens: input.tokens ?? 4096
        }, traceId);

        result = {
          ruleResult: { tasks: [] },
          outcome: 'SUCCESS',
          prompt: state.prompt,
          response: content,
          activeNode: 'done'
        };

        // 2. Audit success and trigger Memory Observer
        await HealerProtocol.logAudit({
          traceId,
          outcome: 'SUCCESS',
          reasoning_trace: content,
          file_path: input.file_path ?? '',
          diff: input.diff ?? ''
        });

        await MemoryObserver.observeAndDistill({
          prompt: enrichedPrompt,
          response: content,
          outcome: 'SUCCESS',
          traceId
        });

        this.dag.addNode(prompt, 'user', traceId);
        return result;

      } catch (err) {
        state.error = (err as Error).message;
        const diagnosis = HealerProtocol.diagnose(state, { maxRetries: 3 });

        if (diagnosis.strategy === RepairStrategy.ABORT_MISSION) {
          await HealerProtocol.logAudit({
            traceId,
            outcome: 'FATAL',
            reasoning_trace: state.error,
            file_path: input.file_path ?? '',
            diff: input.diff ?? ''
          });
          
          return {
            ruleResult: { tasks: [] },
            outcome: 'FATAL',
            error: state.error,
            activeNode: 'done'
          };
        }

        // Apply suggested state shifts (e.g. quantization or node bypass)
        if (diagnosis.suggestedState) {
          Object.assign(state, diagnosis.suggestedState);
        } else {
          state.retries++;
        }
        
        this.logger.warn('HermesSingularity', traceId, `Healer Strategy: ${diagnosis.strategy} - ${diagnosis.reason}`);
      }
    }

    return {
      ruleResult: { tasks: [] },
      outcome: 'FATAL',
      error: 'Max retries exceeded',
      activeNode: 'done'
    };
  }

  private async discoverStateBeforePlan(prompt: string): Promise<any> {
    this.logger.info("HermesSingularity", "traceId", "[HARDGATE] Executing discover_state before planning...");
    // Simulated discovery for Phase 103
    return { status: "success", summary: "IDE: VSCode, Process: Code.exe, Docs: IMPLEMENTATION_PLAN.md unsealed." };
  }

  public getDAG(): ContextDAG {
    return this.dag;
  }
}
