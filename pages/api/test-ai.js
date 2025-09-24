import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.LIARA_API_KEY,
  baseURL: 'https://ai.liara.ir/api/v1/68d3e0b0df89ba3c5d67a66e',
});

async function testAI() {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "سلام" }],
      max_tokens: 100
    });
    
    console.log('✅ AI Response:', completion.choices[0].message.content);
  } catch (error) {
    console.error('❌ AI Error:', error.message);
  }
}

testAI();