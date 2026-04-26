import abc
import json
import asyncio
from typing import Any, AsyncGenerator

/**
 * HERMES_TRANSPORT_ABC — PHASE 93, TASK 3
 * 
 * Base class for high-fidelity agentic streaming.
 * Enables direct SSE communication between Hermes and the Pretext HUD.
 */

class HermesTransport(abc.ABC):
    @abc.abstractmethod
    async def stream(self, payload: Any) -> AsyncGenerator[str, None]:
        """Streams agentic output to the target sink."""
        pass

class PretextHudTransport(HermesTransport):
    def __init__(self, port: int = 3015):
        self.port = port
        self.clients = set()

    async def stream(self, payload: Any) -> AsyncGenerator[str, None]:
        # Implementation for SSE streaming to Next.js
        formatted = f"data: {json.dumps(payload)}\n\n"
        for client in self.clients:
            await client.put(formatted)
        yield formatted

    async def start_server(self):
        # Placeholder for actual SSE server logic (e.g., using FastAPI or aiohttp)
        print(f"::/TRANSPORT_IGNITED : Listening on port {self.port}")

if __name__ == "__main__":
    transport = PretextHudTransport()
    asyncio.run(transport.start_server())
