#!/usr/bin/env bash
# scripts/ops/ignite-test-browser.sh
# Ignites a headless chromium instance with CDP enabled for Gauntlet testing.

echo "::/5Y573M-N071C3 : IGNITING_TEST_BROWSER..."

# Kill any existing chromium instances
pkill -f chromium || true

# Locate the playwright-installed chromium binary
CHROMIUM_BIN=$(find /home/nixos/.cache/ms-playwright/chromium-* -name chrome -type f | head -n 1)

if [ -z "$CHROMIUM_BIN" ]; then
  echo "❌ [BROWSER_FAILURE] : Playwright chromium not found."
  exit 1
fi

echo "● [EXECUTING] : $CHROMIUM_BIN"

# Start chromium with remote debugging via steam-run
steam-run $CHROMIUM_BIN --headless --remote-debugging-port=9222 --no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage &

# Wait for it to be ready
for i in {1..10}; do
  if curl -s http://127.0.0.1:9222/json/version > /dev/null; then
    echo "● [BROWSER_READY] : CDP listening on port 9222."
    exit 0
  fi
  sleep 1
done

echo "❌ [BROWSER_FAILURE] : Could not ignite chromium."
exit 1
