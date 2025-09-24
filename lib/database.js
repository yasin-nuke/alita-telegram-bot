// lib/database.js
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'database.json');

export function loadDatabase() {
  try {
    // مطمئن شو پوشه data وجود دارد
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // اگر فایل وجود ندارد، ایجاد کن
    if (!fs.existsSync(DB_PATH)) {
      const initialData = {
        students: [],
        classes: [],
        settings: { 
          adminId: parseInt(process.env.ADMIN_TELEGRAM_ID) || 123456789, 
          permissions: { 
            summary: true, 
            translate: true, 
            qa: true 
          } 
        }
      };
      
      fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
      return initialData;
    }

    // فایل رو بخوان
    const data = fs.readFileSync(DB_PATH, 'utf8');
    
    // اگر فایل خالی هست
    if (!data.trim()) {
      throw new Error('Database file is empty');
    }
    
    return JSON.parse(data);

  } catch (error) {
    console.error('Database load error:', error);
    // برگرداندن داده‌های پیش‌فرض
    return {
      students: [],
      classes: [],
      settings: { 
        adminId: parseInt(process.env.ADMIN_TELEGRAM_ID) || 123456789, 
        permissions: { summary: true, translate: true, qa: true } 
      }
    };
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