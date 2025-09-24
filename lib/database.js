// lib/database.js
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'database.json');

export function loadDatabase() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const initialData = {
        students: [],
        classes: [],
        settings: { 
          adminId: parseInt(process.env.ADMIN_TELEGRAM_ID) || 0, 
          permissions: { summary: true, translate: true, qa: true } 
        }
      };
      
      const dataDir = path.dirname(DB_PATH);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
      return initialData;
    }
    
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch (error) {
    console.error('Database load error:', error);
    return { students: [], classes: [], settings: { adminId: 0, permissions: {} } };
  }
}

export function saveDatabase(data) {
  try {
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Database save error:', error);
    return false;
  }
}