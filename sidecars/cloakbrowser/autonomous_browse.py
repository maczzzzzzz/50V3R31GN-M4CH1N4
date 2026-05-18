#!/usr/bin/env python3
"""
Autonomous browser via CloakBrowser CDP + browser-use + Playwright.

Usage:
  # Ensure CloakBrowser sidecar is running first:
  #   ./start-cdp.sh start
  
  # Direct CDP browsing (no LLM, just page interaction):
  python autonomous_browse.py --url "https://example.com"
  
  # Agent-driven browsing (requires OPENAI_API_KEY or local LLM):
  python autonomous_browse.py --agent "Find the latest news about NixOS"
  
  # Screenshot a page:
  python autonomous_browse.py --url "https://github.com" --screenshot /tmp/page.png
"""

import argparse
import asyncio
import os
import sys

# NixOS: ensure nix-ld libs are available for greenlet/playwright
os.environ.setdefault(
    "LD_LIBRARY_PATH",
    "/run/current-system/sw/share/nix-ld/lib"
)

CDP_URL = os.environ.get("CLOAK_CDP_URL", "http://localhost:9222")


async def browse_direct(url: str, screenshot_path: str | None = None):
    """Direct browsing via Playwright CDP - no LLM needed."""
    from playwright.async_api import async_playwright

    async with async_playwright() as p:
        browser = await p.chromium.connect_over_cdp(CDP_URL)
        context = browser.contexts[0] if browser.contexts else await browser.new_context()
        page = context.pages[0] if context.pages else await context.new_page()

        await page.goto(url, timeout=30000)
        title = await page.title()
        print(f"Title: {title}")
        print(f"URL: {page.url}")

        # Extract page text
        text = await page.inner_text("body")
        print(f"\n--- Page content ({len(text)} chars) ---")
        print(text[:2000])

        if screenshot_path:
            await page.screenshot(path=screenshot_path, full_page=True)
            print(f"\nScreenshot saved: {screenshot_path}")

        await browser.close()


async def browse_agent(task: str, model: str = "gpt-4o"):
    """Agent-driven browsing via browser-use with an LLM."""
    from browser_use import Agent, BrowserSession, ChatOpenAI

    session = BrowserSession(cdp_url=CDP_URL)
    agent = Agent(
        task=task,
        llm=ChatOpenAI(model=model),
        browser_session=session,
    )
    result = await agent.run()
    print(result)
    await session.stop()


def main():
    parser = argparse.ArgumentParser(description="Autonomous browser via CloakBrowser CDP")
    parser.add_argument("--url", help="Direct URL to browse (no LLM needed)")
    parser.add_argument("--agent", help="Agent task description (requires LLM)")
    parser.add_argument("--screenshot", help="Save screenshot to path")
    parser.add_argument("--model", default="gpt-4o", help="LLM model for agent mode")
    parser.add_argument("--cdp-url", default=CDP_URL, help="CDP endpoint URL")

    args = parser.parse_args()

    if args.url:
        asyncio.run(browse_direct(args.url, args.screenshot))
    elif args.agent:
        asyncio.run(browse_agent(args.agent, args.model))
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
