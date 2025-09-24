import { loadDatabase, saveDatabase } from '../../../utils/ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { action, data, password } = req.body;
    
    // احراز هویت ساده
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const db = loadDatabase();

    switch (action) {
      case 'addStudent':
        const newStudent = {
          id: Date.now(),
          ...data,
          active: true
        };
        db.students.push(newStudent);
        break;

      case 'updateStudent':
        const studentIndex = db.students.findIndex(s => s.id === data.id);
        if (studentIndex !== -1) {
          db.students[studentIndex] = { ...db.students[studentIndex], ...data };
        }
        break;

      case 'deleteStudent':
        db.students = db.students.filter(s => s.id !== data.id);
        break;

      case 'addClass':
        const newClass = {
          id: Date.now(),
          ...data
        };
        db.classes.push(newClass);
        break;

      case 'updatePermissions':
        db.settings.permissions = { ...db.settings.permissions, ...data };
        break;

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    saveDatabase(db);
    res.status(200).json({ success: true, data: db });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}