// pages/api/admin.js
import { loadDatabase, saveDatabase } from '../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, data, password } = req.body;
    
    // احراز هویت
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const db = loadDatabase();

    switch (action) {
      case 'getData':
        // فقط داده‌ها رو برگردون
        break;

      case 'addStudent':
        const newStudent = {
          id: Date.now(),
          ...data,
          active: true
        };
        db.students = db.students || [];
        db.students.push(newStudent);
        break;

      case 'updateStudent':
        if (db.students) {
          const studentIndex = db.students.findIndex(s => s.id === data.id);
          if (studentIndex !== -1) {
            db.students[studentIndex] = { ...db.students[studentIndex], ...data };
          }
        }
        break;

      case 'deleteStudent':
        if (db.students) {
          db.students = db.students.filter(s => s.id !== data.id);
        }
        break;

      case 'addClass':
        const newClass = {
          id: Date.now(),
          ...data
        };
        db.classes = db.classes || [];
        db.classes.push(newClass);
        break;

      case 'updateClass':
        if (db.classes) {
          const classIndex = db.classes.findIndex(c => c.id === data.id);
          if (classIndex !== -1) {
            db.classes[classIndex] = { ...db.classes[classIndex], ...data };
          }
        }
        break;

      case 'deleteClass':
        if (db.classes) {
          db.classes = db.classes.filter(c => c.id !== data.id);
        }
        break;

      case 'updatePermissions':
        db.settings.permissions = { 
          ...db.settings.permissions, 
          ...data 
        };
        break;

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    if (action !== 'getData') {
      const saved = saveDatabase(db);
      if (!saved) {
        return res.status(500).json({ error: 'Failed to save database' });
      }
    }

    res.status(200).json({ 
      success: true, 
      data: db 
    });

  } catch (error) {
    console.error('Admin API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}