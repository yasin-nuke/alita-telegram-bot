import { callAI, getContext, loadDatabase } from '../utils/ai';
import { PROMPTS } from '../utils/prompts';

async function sendTelegramMessage(chatId, text, parseMode = null) {
  const payload = {
    chat_id: chatId,
    text: text
  };
  
  if (parseMode) payload.parse_mode = parseMode;

  try {
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error('Telegram API Error:', error);
  }
}

function handleAdminCommands(message, context) {
  const text = message.toLowerCase().trim();
  const db = loadDatabase();

  if (text.includes('لیست دانشجو')) {
    if (db.students.length === 0) return '❌ هنوز دانشجویی ثبت نشده';
    return `👥 لیست دانشجویان:\n${db.students.map(s => `• ${s.firstName} ${s.lastName} (${s.studentCode})`).join('\n')}`;
  }

  if (text.includes('لیست کلاس')) {
    if (db.classes.length === 0) return '❌ هنوز کلاسی ثبت نشده';
    return `📚 برنامه کلاسی:\n${db.classes.map(c => `• ${c.className} - ${c.day} ${c.time} - ${c.instructor}`).join('\n')}`;
  }

  if (text.includes('کلاس امروز')) {
    const days = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];
    const today = days[new Date().getDay()];
    const todayClasses = db.classes.filter(c => c.day.includes(today));
    
    if (todayClasses.length === 0) return `📅 امروز (${today}) کلاسی ندارید`;
    return `📅 کلاس‌های امروز (${today}):\n${todayClasses.map(c => `• ${c.className} - ${c.time} - ${c.instructor}`).join('\n')}`;
  }

  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { message } = req.body;
    if (!message?.text) return res.status(200).json({ ok: true });

    const { text, chat, from } = message;
    const userId = from.id;
    const chatType = chat.type;
    
    const context = getContext(userId, chatType);
    const isAdmin = context.isAdmin;
    const inGroup = context.inGroup;

    // اگر در دایرکت هست و ادمین نیست، پاسخ نده
    if (!inGroup && !isAdmin) return res.status(200).json({ ok: true });

    // اگر با "آلیتا" شروع نشده
    const hasAlita = text.trim().toLowerCase().startsWith('آلیتا');
    if (!hasAlita && !isAdmin) return res.status(200).json({ ok: true });

    const userMessage = hasAlita ? text.replace(/^آلیتا\s*/i, '').trim() : text;
    
    // پردازش دستورات ادمین
    if (isAdmin) {
      const adminResponse = handleAdminCommands(userMessage, context);
      if (adminResponse) {
        await sendTelegramMessage(chat.id, adminResponse + (isAdmin ? ' 💖' : ''));
        return res.status(200).json({ ok: true });
      }
    }

    // پردازش با هوش مصنوعی
    let prompt;
    if (isAdmin && !hasAlita) {
      prompt = PROMPTS.adminRomantic(userMessage, context.data);
    } else {
      prompt = PROMPTS.main(userMessage, context);
    }

    const response = await callAI(prompt);
    await sendTelegramMessage(chat.id, response + (isAdmin ? ' 💖' : ''));

  } catch (error) {
    console.error('Error:', error);
    await sendTelegramMessage(req.body.message.chat.id, '⚠️ خطا در پردازش');
  }

  return res.status(200).json({ ok: true });
}