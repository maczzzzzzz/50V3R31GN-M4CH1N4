import http from 'node:http';
import type { IFoundryAdapter } from './foundry-adapter.js';
import type { ILogger } from '../core/interfaces.js';

export class DirectorApi {
    private server: http.Server | null = null;

    constructor(
        private readonly foundry: IFoundryAdapter,
        private readonly logger: ILogger
    ) {}

    start(port: number) {
        this.server = http.createServer((req, res) => {
            // Enable CORS
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            if (req.method === 'OPTIONS') {
                res.writeHead(204);
                res.end();
                return;
            }

            if (req.url === '/api/system/theme' && req.method === 'POST') {
                let body = '';
                req.on('data', chunk => { body += chunk; });
                req.on('end', async () => {
                    try {
                        const data = JSON.parse(body);
                        const theme = data.theme;
                        this.logger.info('DirectorApi', 'theme', `Received theme update: ${theme}`);
                        
                        // Push to Foundry
                        await this.foundry.updateTheme(theme);
                        
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ status: 'ok' }));
                    } catch (e) {
                        res.writeHead(400);
                        res.end('Invalid JSON');
                    }
                });
            } else {
                res.writeHead(404);
                res.end('Not Found');
            }
        });

        this.server.listen(port, '0.0.0.0', () => {
            this.logger.info('DirectorApi', 'boot', `Director REST API listening on port ${port}`);
        });
    }

    stop() {
        this.server?.close();
    }
}
