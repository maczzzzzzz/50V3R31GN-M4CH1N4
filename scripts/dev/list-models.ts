import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

async function list() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_API_KEY}`);
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

list();
