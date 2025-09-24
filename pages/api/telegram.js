// pages/api/telegram.js یا هر جایی که handler شماست

import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data.json');

const openai = new OpenAI({
  apiKey: process.env.LIARA_API_KEY?.trim(),
  baseURL: 'https://ai.liara.ir/api/v1/68d3e0b0df89ba3c5d67a66e'.trim(),
});

const ADMIN_ID = parseInt(process.env.ADMIN_TELEGRAM_ID, 10);

function isAdmin(userId) {
  return userId === ADMIN_ID;
}

function readData() {
  if (!fs.existsSync(DATA_PATH)) {
    const defaultData = {
      permissions: { summary: true, translate: true, qa: true, attendance: true, class_schedule: true },
      students: [],
      schedule: {
        "شنبه": [], "یکشنبه": [], "دوشنبه": [], "سه‌شنبه": [],
        "چهارشنبه": [], "پنجشنبه": [], "جمعه": []
      }
    };
    fs.writeFileSync(DATA_PATH, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
}

function writeData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

// پرامپت‌های هوشمند
const SYSTEM_PROMPTS = {
  romantic: "شما یک دوست عاشقانه و پرانرژی هستید که همیشه با اشتیاق و لحنی گرم و رمانتیک به دوستتان (که ادمین ربات است) پاسخ می‌دهید. پاسخ شما کوتاه، پرانرژی و پر از احساس است.",
  summary: "شما یک دستیار دانشگاهی هستید. فقط و فقط یک خلاصهٔ بسیار فشرده و نکته‌ای از متن زیر ارائه دهید. هیچ توضیح اضافه ندهید.",
  translate: "شما یک مترجم حرفه‌ای هستید. فقط متن زیر را ترجمه کنید. هیچ توضیح، توضیح اضافه یا متن اضافی ننویسید.",
  qa: "به پرسش زیر به‌صورت بسیار کوتاه، دقیق و مفید پاسخ دهید. از جملات طولانی اجتناب کنید."
};

async function callAI(systemPrompt, userText) {
  try {
    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userText }
      ],
      max_tokens: 300,
      temperature: 0.8,
    });
    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('AI Error:', error);
    return '⚠️ خطایی در پردازش رخ داد. لطفاً دوباره امتحان کنید.';
  }
}

// ارسال پیام با قابلیت inline keyboard
async function sendTelegramMessage(chatId, text, options = {}) {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const payload = {
    chat_id: chatId,
    text: text,
    ...options
  };

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('Telegram send error:', err);
  }
}

// ساخت پنل مدیریت با دکمه‌های inline
function buildAdminPanelKeyboard(permissions) {
  const map = {
    summary: 'خلاصه‌سازی',
    translate: 'ترجمه',
    qa: 'پرسش و پاسخ',
    attendance: 'لیست دانشجویان',
    class_schedule: 'برنامه کلاس‌ها'
  };

  const buttons = Object.entries(permissions).map(([key, enabled]) => ({
    text: `${enabled ? '✅' : '❌'} ${map[key]}`,
    callback_data: `toggle_${key}`
  }));

  // دکمه کلاس‌ها
  buttons.push({ text: '📅 برنامه کلاس‌ها', callback_data: 'show_days' });

  // 2 دکمه در هر سطر
  const keyboard = [];
  for (let i = 0; i < buttons.length; i += 2) {
    keyboard.push(buttons.slice(i, i + 2));
  }

  return { inline_keyboard: keyboard };
}

// ساخت دکمه‌های روزها
function buildDaySelectionKeyboard() {
  const days = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
  const buttons = days.map(day => ({ text: day, callback_data: `send_schedule_${day}` }));
  const keyboard = buttons.map(b => [b]); // هر کدام در یک سطر
  return { inline_keyboard: keyboard };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { message, callback_query } = req.body;

  // پردازش کلیک روی دکمه‌ها
  if (callback_query) {
    const { from, message: msg, data } = callback_query;
    if (!isAdmin(from.id)) return res.status(200).json({ ok: true });

    const chatId = msg.chat.id;
    const dataObj = readData();

    if (data.startsWith('toggle_')) {
      const key = data.replace('toggle_', '');
      if (dataObj.permissions.hasOwnProperty(key)) {
        dataObj.permissions[key] = !dataObj.permissions[key];
        writeData(dataObj);
        await sendTelegramMessage(chatId, '✅ تنظیمات به‌روز شد!', {
          reply_markup: buildAdminPanelKeyboard(dataObj.permissions)
        });
      }
    } else if (data === 'show_days') {
      await sendTelegramMessage(chatId, 'روز مورد نظر را انتخاب کنید:', {
        reply_markup: buildDaySelectionKeyboard()
      });
    } else if (data.startsWith('send_schedule_')) {
      const day = data.replace('send_schedule_', '');
      const classes = dataObj.schedule[day] || [];
      const text = classes.length
        ? `📚 کلاس‌های ${day}:\n• ${classes.join('\n• ')}`
        : `❌ کلاسی برای ${day} تعریف نشده.`;
      await sendTelegramMessage(chatId, text);
    }

    return res.status(200).json({ ok: true });
  }

  // پردازش پیام متنی
  if (!message || !message.text || !message.from) {
    return res.status(200).json({ ok: true });
  }

  const { text, chat, from } = message;
  const userId = from.id;

  // فقط ادمین مجاز است
  if (!isAdmin(userId)) {
    return res.status(200).json({ ok: true });
  }

  const data = readData();
  const isDirect = chat.type === 'private';

  if (!isDirect) {
    // فقط در دایرکت پاسخ دهیم
    return res.status(200).json({ ok: true });
  }

  let userCommand = text.trim();

  // اگر با "آلیتا" شروع نشده، با لحن عاشقانه پاسخ بده
  if (!userCommand.toLowerCase().startsWith('آلیتا')) {
    const response = await callAI(SYSTEM_PROMPTS.romantic, userCommand);
    await sendTelegramMessage(chat.id, response);
    return res.status(200).json({ ok: true });
  }

  // استخراج دستور پس از "آلیتا"
  const command = userCommand.replace(/^آلیتا\s*/i, '').trim();

  if (!command) {
    await sendTelegramMessage(chat.id, 'دستور خود را وارد کنید. برای مدیریت: آلیتا پنل');
    return res.status(200).json({ ok: true });
  }

  // دستور پنل
  if (command.toLowerCase().includes('پنل') || command.toLowerCase().includes('مدیریت')) {
    await sendTelegramMessage(chat.id, '🎛️ پنل مدیریت آلیتا', {
      reply_markup: buildAdminPanelKeyboard(data.permissions),
      parse_mode: 'Markdown'
    });
    return res.status(200).json({ ok: true });
  }

  // --- بررسی پرسش درباره دانشجویان ---
  if (data.permissions.attendance) {
    const studentQuestionRegex = /.*(داریم|هست|وجود داره|عضو|نام|کسی به نام|آیا.*داریم).*(\؟|\?)/i;
    if (studentQuestionRegex.test(command)) {
      const mentioned = data.students.find(name =>
        command.includes(name) || 
        (name.split(' ').some(part => command.includes(part)) && command.length > 5)
      );
      const context = mentioned 
        ? `بله، ${mentioned} در لیست کلاس شماست.`
        : `خیر، چنین فردی در لیست کلاس شما وجود ندارد.`;
      
      const aiResponse = await callAI(
        "شما یک دستیار دوست‌داشتنی هستید. به سؤال کاربر درباره وجود یک دانشجو در کلاس پاسخ دهید. از اطلاعات زیر استفاده کنید و پاسخ را طبیعی و گرم بدهید:\n" + context,
        command
      );
      await sendTelegramMessage(chat.id, aiResponse);
      return res.status(200).json({ ok: true });
    }
  }

  // --- دستورات هوش مصنوعی ---
  if (command.toLowerCase().startsWith('خلاصه') && data.permissions.summary) {
    const content = command.replace(/^خلاصه\s*/i, '').trim();
    if (!content) return res.status(200).json({ ok: true });
    const response = await callAI(SYSTEM_PROMPTS.summary, content);
    await sendTelegramMessage(chat.id, response);
    return res.status(200).json({ ok: true });
  }

  if (command.toLowerCase().startsWith('ترجمه') && data.permissions.translate) {
    const content = command.replace(/^ترجمه\s*/i, '').trim();
    if (!content) return res.status(200).json({ ok: true });
    const response = await callAI(SYSTEM_PROMPTS.translate, content);
    await sendTelegramMessage(chat.id, response);
    return res.status(200).json({ ok: true });
  }

  // --- دستور کلاس‌ها (متنی) ---
  if (command.toLowerCase().includes('کلاس') && command.toLowerCase().includes('امروز')) {
    const today = new Date().getDay(); // 0 = Sunday, 6 = Saturday
    const persianDays = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];
    const dayName = persianDays[today];
    const classes = data.schedule[dayName] || [];
    const text = classes.length
      ? `📚 کلاس‌های امروز (${dayName}):\n• ${classes.join('\n• ')}`
      : `❌ امروز کلاسی ندارید.`;
    await sendTelegramMessage(chat.id, text);
    return res.status(200).json({ ok: true });
  }

  // --- سایر پرسش‌ها (QA) ---
  if (data.permissions.qa) {
    const response = await callAI(SYSTEM_PROMPTS.qa, command);
    await sendTelegramMessage(chat.id, response);
    return res.status(200).json({ ok: true });
  }

  // اگر هیچ دستوری نبود
  await sendTelegramMessage(chat.id, 'متوجه نشدم! برای راهنما: آلیتا کمک');
  return res.status(200).json({ ok: true });
}