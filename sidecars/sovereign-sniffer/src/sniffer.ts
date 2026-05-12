import { Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";

/**
 * Sovereign Sniffer - Browser-based discovery and extraction engine
 * Built on Stagehand SDK for automated web observation
 */

/**
 * Observe a webpage and extract structured data
 *
 * @param url - The URL to observe
 * @param zodSchema - Zod schema for validation and structure
 * @returns Extracted and validated data matching the schema
 *
 * @example
 * ```typescript
 * const schema = z.object({
 *   title: z.string(),
 *   description: z.string(),
 *   links: z.array(z.object({ text: z.string(), href: z.string() }))
 * });
 *
 * const data = await observe("https://example.com", schema);
 * console.log(data.title);
 * ```
 */
export async function observe<T extends z.ZodType>(
  url: string,
  zodSchema: T
): Promise<z.infer<T>> {
  console.log(`:: Sovereign Sniffer :: Observing ${url}...`);

  const stagehand = new Stagehand({
    env: "LOCAL",
    modelName: "qwen2.5-coder-14b",
    modelClientOptions: { baseURL: "http://100.120.225.12:8000/v1" },
  });

  try {
    await stagehand.init();
    console.log(`:: Stagehand initialized`);

    await stagehand.goto(url);
    console.log(`:: Navigated to ${url}`);

    // Generate natural language instructions from schema
    const schemaShape = (zodSchema as z.ZodObject<any>).shape;
    const instructions = generateInstructionsFromSchema(schemaShape);

    console.log(`:: Extraction instructions: ${instructions}`);

    const observations = await stagehand.observe({
      instruction: instructions,
    });

    console.log(`:: Raw observations extracted`);

    // Validate against schema
    const validated = zodSchema.parse(observations);

    console.log(`:: Validation successful`);
    return validated;
  } catch (error) {
    console.error(`:: Observation failed:`, error);
    throw new Error(`Failed to observe ${url}: ${error}`);
  } finally {
    await stagehand.close();
    console.log(`:: Stagehand closed`);
  }
}

/**
 * Extract specific data from a webpage based on a schema
 *
 * @param url - The URL to extract from
 * @param schema - Zod schema defining what to extract
 * @returns Extracted and validated data matching the schema
 *
 * @example
 * ```typescript
 * const schema = z.object({
 *   apiEndpoints: z.array(z.object({
 *     path: z.string(),
 *     method: z.string(),
 *     description: z.string()
 *   }))
 * });
 *
 * const data = await extract("https://api.example.com/docs", schema);
 * console.log(data.apiEndpoints);
 * ```
 */
export async function extract<T extends z.ZodType>(
  url: string,
  schema: T
): Promise<z.infer<T>> {
  console.log(`:: Sovereign Sniffer :: Extracting from ${url}...`);

  const stagehand = new Stagehand({
    env: "LOCAL",
    modelName: "qwen2.5-coder-14b",
    modelClientOptions: { baseURL: "http://100.120.225.12:8000/v1" },
  });

  try {
    await stagehand.init();
    console.log(`:: Stagehand initialized`);

    await stagehand.goto(url);
    console.log(`:: Navigated to ${url}`);

    // Generate extraction instructions from schema
    const schemaShape = (schema as z.ZodObject<any>).shape;
    const instructions = generateInstructionsFromSchema(schemaShape);

    console.log(`:: Extraction instructions: ${instructions}`);

    const extracted = await stagehand.extract({
      instruction: instructions,
      schema: schemaShape,
    });

    console.log(`:: Raw extraction completed`);

    // Validate against schema
    const validated = schema.parse(extracted);

    console.log(`:: Validation successful`);
    return validated;
  } catch (error) {
    console.error(`:: Extraction failed:`, error);
    throw new Error(`Failed to extract from ${url}: ${error}`);
  } finally {
    await stagehand.close();
    console.log(`:: Stagehand closed`);
  }
}

/**
 * Generate natural language instructions from Zod schema shape
 * This helps Stagehand understand what to extract
 */
function generateInstructionsFromSchema(schemaShape: any): string {
  const fields: string[] = [];

  for (const [key, value] of Object.entries(schemaShape)) {
    const type = (value as any)._def?.typeName || typeof value;
    const description = (value as any).description || "";

    if (type === "ZodArray") {
      const itemType = (value as any)._def?.type?._def?.typeName || "items";
      fields.push(`list of ${key} (${itemType})${description ? `: ${description}` : ""}`);
    } else if (type === "ZodObject") {
      fields.push(`${key} as structured object${description ? `: ${description}` : ""}`);
    } else if (type === "ZodString") {
      fields.push(`${key} as text${description ? `: ${description}` : ""}`);
    } else if (type === "ZodNumber") {
      fields.push(`${key} as number${description ? `: ${description}` : ""}`);
    } else if (type === "ZodBoolean") {
      fields.push(`${key} as yes/no${description ? `: ${description}` : ""}`);
    } else {
      fields.push(`${key}${description ? `: ${description}` : ""}`);
    }
  }

  return `Extract the following structured data: ${fields.join(", ")}`;
}

/**
 * Sniffer error class for consistent error handling
 */
export class SnifferError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = "SnifferError";
  }
}
