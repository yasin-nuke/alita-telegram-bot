// utils/ai.js
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.LIARA_API_KEY,
  baseURL: 'https://ai.liara.ir/api/v1/689b2cb0fb0f69c968ce1cfe',
});

export async function callAI(prompt) {
  try {
    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini:online",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400,
      temperature: 0.8
    });
    
    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('AI Error:', error);
    return '⚠️ خطا در پردازش درخواست';
  }
}