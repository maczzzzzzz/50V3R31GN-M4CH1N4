#!/usr/bin/env node
import { Command } from "commander";
import { observe, extract } from "./sniffer.js";
import { z } from "zod";
import chalk from "chalk";
import * as fs from "fs";

const program = new Command();

program
  .name("sniffer")
  .description("Sovereign Sniffer - Browser-based discovery via Stagehand")
  .version("1.0.0");

program
  .command("observe")
  .description("Observe a webpage and extract structured data")
  .requiredOption("-u, --url <url>", "URL to observe")
  .requiredOption("-s, --schema <schema>", "Zod schema as JSON file path")
  .option("-o, --output <file>", "Output file for JSON results")
  .action(async (options) => {
    try {
      console.log(chalk.cyan(`:: Sovereign Sniffer ::`));
      console.log(chalk.yellow(`:: Mode: OBSERVE ::`));

      // Load schema from file
      let schema;
      try {
        const schemaContent = fs.readFileSync(options.schema, "utf-8");
        const schemaObj = JSON.parse(schemaContent);
        schema = z.object(schemaObj);
        console.log(chalk.green(`:: Schema loaded: ${options.schema}`));
      } catch (error) {
        console.error(chalk.red(`:: Invalid schema file: ${error}`));
        process.exit(1);
      }

      // Perform observation
      const result = await observe(options.url, schema);

      // Output results
      const jsonResult = JSON.stringify(result, null, 2);

      if (options.output) {
        fs.writeFileSync(options.output, jsonResult);
        console.log(chalk.green(`:: Results saved to ${options.output}`));
      } else {
        console.log(chalk.green(`:: Results:`));
        console.log(jsonResult);
      }
    } catch (error) {
      console.error(chalk.red(`:: Error: ${error}`));
      process.exit(1);
    }
  });

program
  .command("extract")
  .description("Extract specific data from a webpage based on schema")
  .requiredOption("-u, --url <url>", "URL to extract from")
  .requiredOption("-s, --schema <schema>", "Zod schema as JSON file path")
  .option("-o, --output <file>", "Output file for JSON results")
  .action(async (options) => {
    try {
      console.log(chalk.cyan(`:: Sovereign Sniffer ::`));
      console.log(chalk.yellow(`:: Mode: EXTRACT ::`));

      // Load schema from file
      let schema;
      try {
        const schemaContent = fs.readFileSync(options.schema, "utf-8");
        const schemaObj = JSON.parse(schemaContent);
        schema = z.object(schemaObj);
        console.log(chalk.green(`:: Schema loaded: ${options.schema}`));
      } catch (error) {
        console.error(chalk.red(`:: Invalid schema file: ${error}`));
        process.exit(1);
      }

      // Perform extraction
      const result = await extract(options.url, schema);

      // Output results
      const jsonResult = JSON.stringify(result, null, 2);

      if (options.output) {
        fs.writeFileSync(options.output, jsonResult);
        console.log(chalk.green(`:: Results saved to ${options.output}`));
      } else {
        console.log(chalk.green(`:: Results:`));
        console.log(jsonResult);
      }
    } catch (error) {
      console.error(chalk.red(`:: Error: ${error}`));
      process.exit(1);
    }
  });

program.parse();
