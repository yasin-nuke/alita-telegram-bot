// pages/api/admin.js - نسخه ساده‌شده
import { loadDatabase, saveDatabase } from '../../lib/database';

export default async function handler(req, res) {
  console.log('🔧 Admin API Called - Method:', req.method);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, data, password } = req.body;
    console.log('📦 Request Body:', { action, data: data ? 'exists' : 'empty' });
    
    // احراز هویت ساده‌شده
    const expectedPassword = process.env.ADMIN_PASSWORD;
    if (!expectedPassword) {
      console.error('❌ ADMIN_PASSWORD not set in environment');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    if (!password || password !== expectedPassword) {
      console.log('❌ Authentication failed');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('✅ Authentication successful');
    
    // بارگذاری دیتابیس
    let db;
    try {
      db = loadDatabase();
      console.log('📊 Database loaded successfully');
    } catch (dbError) {
      console.error('❌ Database load error:', dbError);
      return res.status(500).json({ error: 'Database error' });
    }

    // پردازش action‌ها
    switch (action) {
      case 'getData':
        console.log('📥 Get Data request');
        break;

      case 'updatePermissions':
        console.log('⚙️ Update Permissions:', data);
        if (data && typeof data === 'object') {
          db.settings = db.settings || {};
          db.settings.permissions = {
            ...(db.settings.permissions || {}),
            ...data
          };
        }
        break;

      case 'addStudent':
        console.log('👥 Add Student:', data);
        db.students = db.students || [];
        db.students.push({
          id: Date.now(),
          ...data,
          active: true
        });
        break;

      case 'addClass':
        console.log('📚 Add Class:', data);
        db.classes = db.classes || [];
        db.classes.push({
          id: Date.now(),
          ...data
        });
        break;

      default:
        console.log('❌ Unknown action:', action);
        return res.status(400).json({ error: 'Invalid action' });
    }

    // ذخیره‌سازی دیتابیس
    if (action !== 'getData') {
      try {
        const saved = saveDatabase(db);
        if (!saved) {
          throw new Error('Save failed');
        }
        console.log('💾 Database saved successfully');
      } catch (saveError) {
        console.error('❌ Database save error:', saveError);
        return res.status(500).json({ error: 'Save failed' });
      }
    }

    // پاسخ موفقیت‌آمیز
    const response = { 
      success: true, 
      data: db,
      action: action
    };
    
    console.log('✅ Response sent');
    res.status(200).json(response);

  } catch (error) {
    console.error('❌ Admin API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}