import { Stagehand } from "@browserbase/stagehand";
import { z } from "zod";

/**
 * Observe a webpage and extract structured data using Stagehand
 *
 * @param url - The URL to observe
 * @param instructions - Natural language instructions for what to extract
 * @param schema - Zod schema for validation
 * @returns Extracted and validated data
 */
export async function observe<T extends z.ZodType>(
  url: string,
  instructions: string,
  schema: T
): Promise<z.infer<T>> {
  console.log(`:: Observing ${url}...`);
  console.log(`:: Instructions: ${instructions}`);

  const stagehand = new Stagehand({
    env: "LOCAL",
    modelName: "gpt-4o-mini",
  });

  try {
    await stagehand.init();
    console.log(`:: Stagehand initialized`);

    await stagehand.goto(url);
    console.log(`:: Navigated to ${url}`);

    const observations = await stagehand.observe({
      instruction: instructions,
    });

    console.log(`:: Raw observations:`, JSON.stringify(observations, null, 2));

    // Validate against schema
    const validated = schema.parse(observations);

    console.log(`:: Validation successful`);
    return validated;
  } catch (error) {
    console.error(`:: Observation failed:`, error);
    throw error;
  } finally {
    await stagehand.close();
    console.log(`:: Stagehand closed`);
  }
}

/**
 * Extract specific elements from a webpage using Stagehand
 *
 * @param url - The URL to extract from
 * @param selector - CSS selector or natural language description
 * @param schema - Zod schema for validation
 * @returns Extracted and validated data
 */
export async function extract<T extends z.ZodType>(
  url: string,
  selector: string,
  schema: T
): Promise<z.infer<T>> {
  console.log(`:: Extracting from ${url}...`);
  console.log(`:: Selector: ${selector}`);

  const stagehand = new Stagehand({
    env: "LOCAL",
    modelName: "gpt-4o-mini",
  });

  try {
    await stagehand.init();
    console.log(`:: Stagehand initialized`);

    await stagehand.goto(url);
    console.log(`:: Navigated to ${url}`);

    const extracted = await stagehand.extract({
      instruction: `Extract elements matching: ${selector}`,
      schema: schema.shape,
    });

    console.log(`:: Raw extraction:`, JSON.stringify(extracted, null, 2));

    // Validate against schema
    const validated = schema.parse(extracted);

    console.log(`:: Validation successful`);
    return validated;
  } catch (error) {
    console.error(`:: Extraction failed:`, error);
    throw error;
  } finally {
    await stagehand.close();
    console.log(`:: Stagehand closed`);
  }
}
