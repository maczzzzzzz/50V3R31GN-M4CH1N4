FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install relay dependencies
RUN pip install --no-cache-dir aiohttp pyyaml segno

COPY relay/ ./relay/

EXPOSE 8767

ENV HERMES_RELAY_PORT=8767
ENV HERMES_RELAY_HOST=0.0.0.0

CMD ["python", "-m", "relay"]
