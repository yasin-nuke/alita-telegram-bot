// pages/api/admin.js
import { loadDatabase, saveDatabase } from '../../lib/database';

export default async function handler(req, res) {
  // اضافه کردن CORS برای جلوگیری از خطاهای مرورگر
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  try {
    const { action, data, password } = req.body;

    // لاگ برای دیباگ
    console.log('🔄 Admin Action:', { action, data: data || 'no-data' });

    // بررسی وجود body
    if (!req.body) {
      return res.status(400).json({
        success: false,
        error: 'Request body is missing'
      });
    }

    // احراز هویت
    if (!password) {
      return res.status(401).json({
        success: false,
        error: 'Password is required'
      });
    }

    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        error: 'Invalid password'
      });
    }

    // بارگذاری دیتابیس
    let db;
    try {
      db = loadDatabase();
    } catch (dbError) {
      console.error('Database load error:', dbError);
      return res.status(500).json({
        success: false,
        error: 'Failed to load database'
      });
    }

    // مقداردهی اولیه اگر وجود نداشته باشد
    db.students = db.students || [];
    db.classes = db.classes || [];
    db.settings = db.settings || {};
    db.settings.permissions = db.settings.permissions || {};

    // پردازش action‌ها
    let result;
    switch (action) {
      case 'getData':
        result = { data: db };
        break;

      case 'updatePermissions':
        if (!data || typeof data !== 'object') {
          return res.status(400).json({
            success: false,
            error: 'Invalid permissions data'
          });
        }
        db.settings.permissions = { ...db.settings.permissions, ...data };
        result = { message: 'Permissions updated successfully' };
        break;

      case 'addStudent':
        if (!data || !data.firstName || !data.lastName) {
          return res.status(400).json({
            success: false,
            error: 'First name and last name are required'
          });
        }
        
        const newStudent = {
          id: Date.now(),
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          studentCode: data.studentCode || '',
          nationalCode: data.nationalCode || '',
          active: true
        };
        
        db.students.push(newStudent);
        result = { 
          message: 'Student added successfully',
          student: newStudent 
        };
        break;

      case 'deleteStudent':
        if (!data || !data.id) {
          return res.status(400).json({
            success: false,
            error: 'Student ID is required'
          });
        }
        
        const initialLength = db.students.length;
        db.students = db.students.filter(s => s.id !== data.id);
        
        if (db.students.length === initialLength) {
          return res.status(404).json({
            success: false,
            error: 'Student not found'
          });
        }
        
        result = { message: 'Student deleted successfully' };
        break;

      case 'addClass':
        if (!data || !data.className || !data.day) {
          return res.status(400).json({
            success: false,
            error: 'Class name and day are required'
          });
        }
        
        const newClass = {
          id: Date.now(),
          className: data.className.trim(),
          instructor: data.instructor || '',
          day: data.day,
          time: data.time || '',
          credits: data.credits || 3
        };
        
        db.classes.push(newClass);
        result = { 
          message: 'Class added successfully',
          class: newClass 
        };
        break;

      case 'deleteClass':
        if (!data || !data.id) {
          return res.status(400).json({
            success: false,
            error: 'Class ID is required'
          });
        }
        
        const initialClassLength = db.classes.length;
        db.classes = db.classes.filter(c => c.id !== data.id);
        
        if (db.classes.length === initialClassLength) {
          return res.status(404).json({
            success: false,
            error: 'Class not found'
          });
        }
        
        result = { message: 'Class deleted successfully' };
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action'
        });
    }

    // ذخیره‌سازی دیتابیس (برای action‌هایی که تغییر ایجاد می‌کنند)
    if (action !== 'getData') {
      try {
        const saved = saveDatabase(db);
        if (!saved) {
          throw new Error('Save failed');
        }
      } catch (saveError) {
        console.error('Save error:', saveError);
        return res.status(500).json({
          success: false,
          error: 'Failed to save database'
        });
      }
    }

    // پاسخ موفقیت‌آمیز
    res.status(200).json({
      success: true,
      data: db,
      ...result
    });

  } catch (error) {
    console.error('Admin API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}