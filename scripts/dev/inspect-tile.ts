import fs from 'node:fs/promises';
import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

async function inspect(imagePath: string) {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  
  const buffer = await fs.readFile(imagePath);
  const base64 = buffer.toString('base64');
  
  const result = await model.generateContent([
    "Analyze the interior of this battlemap tile. Is it populated with objects like crates, cables, or furniture? Is the floor textured and grimy, or is it blank white? Provide a detailed list of identified objects and textures.",
    {
      inlineData: {
        data: base64,
        mimeType: 'image/webp'
      }
    }
  ]);
  
  console.log(`\n◈ ◈ ◈ SOVEREIGN AUDIT: ${imagePath} ◈ ◈ ◈`);
  console.log(result.response.text());
}

inspect(process.argv[2]);
