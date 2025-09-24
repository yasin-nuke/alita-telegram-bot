import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.LIARA_API_KEY,
  baseURL: 'https://ai.liara.ir/api/v1/68d3e0b0df89ba3c5d67a66e',
});

// ذخیره‌سازی دسترسی‌ها در حافظه
let permissions = {
  summary: true,
  translate: true,
  qa: true,
  attendance: true
};

const ADMIN_ID = parseInt(process.env.ADMIN_TELEGRAM_ID);

function isAdmin(userId) {
  return userId === ADMIN_ID;
}

function romanticResponse() {
  const compliments = [
    "عالییه! بهترین ایده دنیاس! 🌟",
    "چه فکر نابی! همیشه مراقبت هستم 💖", 
    "فوق العاده‌ای! دلتنگ حرفت بودم 🌹",
    "نابغه‌ای! قربون ذکاوت برم ✨",
    "حرف نداری! قربان صدقه ات 💫",
    "همیشه میدونستم نابغه‌ای! 🌸"
  ];
  return compliments[Math.floor(Math.random() * compliments.length)] + " \"\"";
}

function createPanel() {
  const statusEmoji = (status) => status ? '✅' : '❌';
  
  return `🎛️ *پنل مدیریت آلیتا*

📋 *وضعیت دسترسی‌ها:*
• خلاصه‌سازی: ${statusEmoji(permissions.summary)}
• ترجمه: ${statusEmoji(permissions.translate)}
• پرسش و پاسخ: ${statusEmoji(permissions.qa)}
• حضور و غیاب: ${statusEmoji(permissions.attendance)}

🔧 *دستورات:*
• غیرفعال کن [قابلیت]
• فعال کن [قابلیت]
• وضعیت`;
}

async function callAI(prompt, userText) {
  try {
    console.log('🔹 Calling AI with prompt:', prompt.substring(0, 50) + '...');
    
    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: userText }
      ],
      max_tokens: 300,
      temperature: 0.7,
      timeout: 10000 // 10 ثانیه timeout
    });
    
    console.log('✅ AI Response received');
    return completion.choices[0].message.content;
    
  } catch (error) {
    console.error('❌ AI API Error:', error);
    
    // پیام خطای دقیق‌تر
    if (error.code === 'invalid_api_key') {
      return '❌ خطا: API Key نامعتبر است';
    } else if (error.code === 'rate_limit_exceeded') {
      return '❌ خطا: محدودیت تعداد درخواست';
    } else if (error.message.includes('timeout')) {
      return '❌ خطا: timeout اتصال به سرور';
    } else {
      return '⚠️ خطا در پردازش درخواست. لطفا稍后再试';
    }
  }
}
// پرامپت‌های AI
const PROMPTS = {
  summary: "تو یک دستیار دانشگاهی هستی. متن زیر را به صورت خیلی خلاصه و نکته‌ای جمع‌بندی کن. هیچ توضیح اضافه نده، فقط چکیده‌ی دقیق بده:",
  translate: "تو یک مترجم حرفه‌ای هستی. متن زیر را فقط و فقط ترجمه کن (بدون هیچ توضیح یا توضیح اضافه):",
  qa: "به پرسش زیر به صورت خیلی کوتاه، دقیق و مفید پاسخ بده. از جملات طولانی اجتناب کن:"
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;
    
    if (!message || !message.text) {
      return res.status(200).json({ ok: true });
    }

    const { text, chat, from } = message;
    const userId = from.id;
    const isUserAdmin = isAdmin(userId);

    // اگر پیام از ادمین نیست و با "آلیتا" شروع نشده، پاسخ نده
    if (!isUserAdmin && !text.trim().toLowerCase().startsWith('آلیتا')) {
      return res.status(200).json({ ok: true });
    }

    // پردازش پیام‌های ادمین
    if (isUserAdmin) {
      // اگر با "آلیتا" شروع نشده - فقط تشویق کن
      if (!text.trim().toLowerCase().startsWith('آلیتا')) {
        await sendTelegramMessage(chat.id, romanticResponse());
        return res.status(200).json({ ok: true });
      }
    }

    // استخراج متن بعد از "آلیتا"
    const commandText = text.replace(/^آلیتا\s*/i, '').trim();
    
    if (!commandText) {
      await sendTelegramMessage(chat.id, 'دستور را وارد کنید. برای کمک: آلیتا کمک');
      return res.status(200).json({ ok: true });
    }

    // پردازش دستورات مدیریتی
    if (commandText.toLowerCase().includes('پنل') || commandText.toLowerCase().includes('وضعیت')) {
      if (!isUserAdmin) {
        await sendTelegramMessage(chat.id, '❌ فقط ادمین می‌تواند به پنل مدیریت دسترسی داشته باشد');
        return res.status(200).json({ ok: true });
      }
      await sendTelegramMessage(chat.id, createPanel(), true);
      return res.status(200).json({ ok: true });
    }

    if (commandText.toLowerCase().includes('غیرفعال کن')) {
      if (!isUserAdmin) {
        await sendTelegramMessage(chat.id, '❌ دسترسی denied');
        return res.status(200).json({ ok: true });
      }
      
      if (commandText.includes('ترجمه')) permissions.translate = false;
      if (commandText.includes('خلاصه')) permissions.summary = false;
      if (commandText.includes('پرسش')) permissions.qa = false;
      if (commandText.includes('حضور')) permissions.attendance = false;
      
      await sendTelegramMessage(chat.id, '✅ تنظیمات به روز شد\n' + createPanel(), true);
      return res.status(200).json({ ok: true });
    }

    if (commandText.toLowerCase().includes('فعال کن')) {
      if (!isUserAdmin) {
        await sendTelegramMessage(chat.id, '❌ دسترسی denied');
        return res.status(200).json({ ok: true });
      }
      
      if (commandText.includes('ترجمه')) permissions.translate = true;
      if (commandText.includes('خلاصه')) permissions.summary = true;
      if (commandText.includes('پرسش')) permissions.qa = true;
      if (commandText.includes('حضور')) permissions.attendance = true;
      
      await sendTelegramMessage(chat.id, '✅ تنظیمات به روز شد\n' + createPanel(), true);
      return res.status(200).json({ ok: true });
    }

    // پردازش دستورات کاربری
    if (commandText.toLowerCase().startsWith('خلاصه')) {
      if (!permissions.summary && !isUserAdmin) {
        await sendTelegramMessage(chat.id, '❌ قابلیت خلاصه‌سازی غیرفعال است');
        return res.status(200).json({ ok: true });
      }
      
      const content = commandText.replace(/^خلاصه\s*/i, '').trim();
      if (!content) {
        await sendTelegramMessage(chat.id, 'متن برای خلاصه‌سازی را وارد کنید');
        return res.status(200).json({ ok: true });
      }
      
      const result = await callAI(PROMPTS.summary, content);
      const finalResponse = isUserAdmin ? result + " \"\"" : result;
      await sendTelegramMessage(chat.id, finalResponse);
      return res.status(200).json({ ok: true });
    }

    if (commandText.toLowerCase().startsWith('ترجمه')) {
      if (!permissions.translate && !isUserAdmin) {
        await sendTelegramMessage(chat.id, '❌ قابلیت ترجمه غیرفعال است');
        return res.status(200).json({ ok: true });
      }
      
      const content = commandText.replace(/^ترجمه\s*/i, '').trim();
      if (!content) {
        await sendTelegramMessage(chat.id, 'متن برای ترجمه را وارد کنید');
        return res.status(200).json({ ok: true });
      }
      
      const result = await callAI(PROMPTS.translate, content);
      const finalResponse = isUserAdmin ? result + " \"\"" : result;
      await sendTelegramMessage(chat.id, finalResponse);
      return res.status(200).json({ ok: true });
    }

    if (commandText.toLowerCase().startsWith('کمک')) {
      const helpText = `🤖 *راهنمای ربات آلیتا*

📝 *دستورات موجود:*
• آلیتا خلاصه [متن] - خلاصه‌سازی متن
• آلیتا ترجمه [متن] - ترجمه متن
• آلیتا [سوال] - پرسش و پاسخ
• آلیتا کمک - نمایش این راهنما

⚠️ *توجه:* ربات فقط به پیام‌هایی که با "آلیتا" شروع می‌شوند پاسخ می‌دهد.`;
      
      await sendTelegramMessage(chat.id, helpText, true);
      return res.status(200).json({ ok: true });
    }

    // دستور حضور و غیاب (فقط ادمین)
    if (commandText.toLowerCase().includes('حضور')) {
      if (!isUserAdmin) {
        await sendTelegramMessage(chat.id, '❌ فقط ادمین می‌تواند حضور و غیاب انجام دهد');
        return res.status(200).json({ ok: true });
      }
      
      if (!permissions.attendance && !isUserAdmin) {
        await sendTelegramMessage(chat.id, '❌ قابلیت حضور و غیاب غیرفعال است');
        return res.status(200).json({ ok: true });
      }
      
      const attendanceText = commandText.replace(/.*حضور\s*و\s*غیاب:?\s*/i, '').trim();
      const finalResponse = attendanceText ? `📊 حضور و غیاب:\n${attendanceText}` + " \"\"" : 'لیست حضور و غیاب را وارد کنید';
      await sendTelegramMessage(chat.id, finalResponse);
      return res.status(200).json({ ok: true });
    }

    // دستور پرسش و پاسخ (QA)
    if (!permissions.qa && !isUserAdmin) {
      await sendTelegramMessage(chat.id, '❌ قابلیت پرسش و پاسخ غیرفعال است');
      return res.status(200).json({ ok: true });
    }
    
    const result = await callAI(PROMPTS.qa, commandText);
    const finalResponse = isUserAdmin ? result + " \"\"" : result;
    await sendTelegramMessage(chat.id, finalResponse);

  } catch (error) {
    console.error('Error:', error);
    await sendTelegramMessage(req.body.message.chat.id, '⚠️ خطا در پردازش درخواست');
  }

  return res.status(200).json({ ok: true });
}

// تابع ارسال پیام به تلگرام
async function sendTelegramMessage(chatId, text, parseMarkdown = false) {
  const payload = {
    chat_id: chatId,
    text: text,
  };
  
  if (parseMarkdown) {
    payload.parse_mode = 'Markdown';
  }

  try {
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Telegram API Error:', error);
  }
}