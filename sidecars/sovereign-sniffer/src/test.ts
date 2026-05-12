#!/usr/bin/env node
/**
 * Test script for Sovereign Sniffer
 *
 * Usage: npm test
 */

import { observe, extract } from "./observer.js";
import { z } from "zod";

// Simple schema for testing
const TestSchema = z.object({
  title: z.string(),
  url: z.string().url(),
});

async function testObserve() {
  console.log(":: Test 1: observe() function ::");

  try {
    const result = await observe(
      "https://example.com",
      "Extract the page title and URL",
      TestSchema
    );

    console.log(":: Test 1 PASSED ::");
    console.log("Result:", JSON.stringify(result, null, 2));
    return true;
  } catch (error) {
    console.error(":: Test 1 FAILED ::", error);
    return false;
  }
}

async function testExtract() {
  console.log("\n:: Test 2: extract() function ::");

  try {
    const result = await extract(
      "https://example.com",
      "page title",
      TestSchema
    );

    console.log(":: Test 2 PASSED ::");
    console.log("Result:", JSON.stringify(result, null, 2));
    return true;
  } catch (error) {
    console.error(":: Test 2 FAILED ::", error);
    return false;
  }
}

async function runTests() {
  console.log(":: Running Sovereign Sniffer Tests ::\n");

  const test1 = await testObserve();
  const test2 = await testExtract();

  console.log("\n:: Test Summary ::");
  console.log(`Test 1 (observe): ${test1 ? "PASS" : "FAIL"}`);
  console.log(`Test 2 (extract): ${test2 ? "PASS" : "FAIL"}`);

  if (test1 && test2) {
    console.log("\n:: All tests PASSED ::");
    process.exit(0);
  } else {
    console.log("\n:: Some tests FAILED ::");
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error(":: Test runner error ::", error);
  process.exit(1);
});
