const http = require('http');
const port = 8080;

const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', chunk => { body += chunk.toString(); });
  req.on('end', () => {
    console.log(`[MOCK LLM] ${req.method} ${req.url}`);
    if (req.method === 'POST' && req.url === '/v1/chat/completions') {
      try {
        const data = JSON.parse(body || '{}');
        const model = data.model || 'unknown';
        let tier = "Unknown";
        let node = "Unknown";
        
        if (model.toLowerCase().includes("carnice")) { 
          tier = "Tier 1 (Instant)"; 
          node = "Node B (Director)"; 
        } else if (model.toLowerCase().includes("qwen")) { 
          tier = "Tier 2 (Strategic)"; 
          node = "Node D (Core)"; 
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          id: "chatcmpl-mock123",
          object: "chat.completion",
          created: Math.floor(Date.now() / 1000),
          model: model,
          choices: [{
            index: 0,
            message: { 
              role: "assistant", 
              content: `<think>\nProcessing route via ${node}...\n</think>\nMesh Dry Run Acknowledged. I am ${node} operating at ${tier}.` 
            },
            finish_reason: "stop"
          }],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
        }));
      } catch (e) {
        res.writeHead(400);
        res.end("Bad Request");
      }
    } else if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' }); 
      res.end(JSON.stringify({ status: "ok" }));
    } else {
      res.writeHead(404); 
      res.end("Not Found");
    }
  });
});

server.listen(port, '0.0.0.0', () => console.log(`Mock LLM listening on 0.0.0.0:${port}`));
