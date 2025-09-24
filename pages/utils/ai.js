import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.LIARA_API_KEY,
  baseURL: 'https://ai.liara.ir/api/v1/689b2cb0fb0f69c968ce1cfe',
});

const DB_PATH = path.join(process.cwd(), 'data', 'database.json');

export function loadDatabase() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch (error) {
    return { students: [], classes: [], settings: { adminId: 0, permissions: {} } };
  }
}

export function saveDatabase(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export async function callAI(prompt) {
  try {
    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
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

export function getContext(userId, chatType) {
  const db = loadDatabase();
  const isAdmin = userId === db.settings.adminId;
  const inGroup = chatType === 'group' || chatType === 'supergroup';
  
  return {
    isAdmin,
    inGroup,
    permissions: db.settings.permissions,
    data: {
      students: db.students.filter(s => s.active),
      classes: db.classes
    }
  };
}