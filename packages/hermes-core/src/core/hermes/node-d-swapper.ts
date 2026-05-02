import { spawn, ChildProcess } from 'node:child_process';
import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { logger } from '../../shared/logger.js';

/**
 * node-d-swapper.ts — The Sovereign Model Swapper (v3.8.26-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS)
 * 
 * Maximizes Node D intelligence by ensuring only one HEAVY model is loaded at a time,
 * providing the full 48GB RAM buffer for 128k context.
 */

const PORT = 8080;
const MODELS_DIR = '/home/maczz/llama.cpp/models';
const SERVER_BIN = '/home/maczz/llama.cpp/build/bin/llama-server';

type ModelKey = 'gemma' | 'qwen' | 'glm';

interface ModelProfile {
  path: string;
  ctx: number;
  ngl: number;
}

const PROFILES: Record<ModelKey, ModelProfile> = {
  gemma: {
    path: `${MODELS_DIR}/google_gemma-4-26B-A4B-it-Q6_K.gguf`,
    ctx: 131072,
    ngl: 0 // Intel CPU/NPU focused
  },
  qwen: {
    path: `${MODELS_DIR}/qwen2.5-coder-14b-instruct-q6_k.gguf`,
    ctx: 131072,
    ngl: 0
  },
  glm: {
    path: `${MODELS_DIR}/GLM-4.7-Flash-UD-Q4_K_XL.gguf`,
    ctx: 131072,
    ngl: 0
  }
};

let currentModel: ModelKey | null = null;
let serverProcess: ChildProcess | null = null;
let isSwitching = false;

async function igniteModel(key: ModelKey): Promise<void> {
  if (isSwitching) return;
  isSwitching = true;
  
  if (serverProcess) {
    logger.info('Swapper', 'spool', `Spooling down ${currentModel}...`);
    serverProcess.kill('SIGTERM');
    await new Promise(r => setTimeout(r, 2000));
  }

  const profile = PROFILES[key];
  logger.info('Swapper', 'ignite', `Igniting ${key} (Context: ${profile.ctx})...`);
  
  serverProcess = spawn(SERVER_BIN, [
    '-m', profile.path,
    '--host', '127.0.0.1',
    '--port', '8081', // Actual llama-server runs on 8081
    '-c', profile.ctx.toString(),
    '--flash-attn', 'on',
    '--mlock',
    '--cont-batching',
    '--log-disable'
  ], { stdio: 'inherit' });

  // Wait for health check
  let attempts = 0;
  while (attempts < 30) {
    try {
      const res = await fetch('http://127.0.0.1:8081/health');
      if (res.ok) {
        currentModel = key;
        logger.info('Swapper', 'ready', `◈ ${key} is LIVE.`);
        break;
      }
    } catch { /* wait */ }
    await new Promise(r => setTimeout(r, 1000));
    attempts++;
  }
  
  isSwitching = false;
}

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  // 1. Parse requested model from body
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', async () => {
    try {
      const payload = JSON.parse(body || '{}');
      const requestedModel = (payload.model || 'gemma').toLowerCase();
      
      let target: ModelKey = 'gemma';
      if (requestedModel.includes('qwen') || requestedModel.includes('coder')) target = 'qwen';
      if (requestedModel.includes('glm') || requestedModel.includes('flash')) target = 'glm';

      // 2. Switch if needed
      if (currentModel !== target) {
        await igniteModel(target);
      }

      // 3. Proxy to actual llama-server
      const proxyReq = await fetch(`http://127.0.0.1:8081${req.url}`, {
        method: req.method || 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const proxyData = await proxyReq.text();
      res.writeHead(proxyReq.status, { 'Content-Type': 'application/json' });
      res.end(proxyData);

    } catch (err) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: (err as Error).message }));
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  logger.info('Swapper', 'init', `◈ Sovereign Swapper active on Port ${PORT}`);
});
