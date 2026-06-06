const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

// مفاتيح بيكو السرية
const FB_TOKEN = "EAAYv2humesYBRo8mEJObyRYECSVBsVxRlq5tpl8EZAGIOpxXDUahFU87tp5w3scNDmEoJa5gH7ubm4LCUuOdi0KUjAfahVuARlJYZBHs8d1QcjlvnZBwqxB0Uyy9wYrBnYFW6dhDx2zwnduThT27reRaTAhF8e3HIeaucT5BUX9zWf5dqCYzRAEZAX8ZBZAFf67b0hxwZDZD";
const GEMINI_API_KEY = "AIzaSyBYvjqxYasw83krgRxRk7pDfMXYGLeRojA";
const VERIFY_TOKEN = "beko_token_123";

let verifiedUsers = [];

app.get('/webhook', (req, res) => {
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
  if (mode && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post('/webhook', async (req, res) => {
  let body = req.body;
  if (body.object === 'page') {
    for (let entry of body.entry) {
      let webhook_event = entry.messaging[0];
      let sender_psid = webhook_event.sender.id;
      if (webhook_event.message && webhook_event.message.text) {
        await handleMessage(sender_psid, webhook_event.message.text);
      }
    }
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

async function handleMessage(sender_psid, userMessage) {
  let responseText = "";

  // الشرط الأول: التحقق من المتابعة
  if (!verifiedUsers.includes(sender_psid)) {
    if (userMessage.trim() === "تم") {
      verifiedUsers.push(sender_psid);
      await sendTextMessage(sender_psid, "تم التفعيل بنجاح! 🌟 الذكاء الاصطناعي تحت خدمتك هسي، اسألني أي حاجة.");
    } else {
      await sendTextMessage(sender_psid, "مرحباً بك! 🌟\nأنا بوت ذكي مصمم لمساعدتك.\nعشان تستخدم الذكاء الاصطناعي، يرجى متابعة صفحتنا دي أولاً.\n\nبعد ما تعمل متابعة، أرسل كلمة (تم) لتفعيل البوت طوالي!");
    }
    return;
  }

  // الشرط التاني: حقوق المطور
  const aboutKeywords = ["مطور", "برمجك", "صنعك", "عملك", "من انت", "منو برمجك"];
  let isAskingAboutDeveloper = aboutKeywords.some(keyword => userMessage.includes(keyword));

  if (isAskingAboutDeveloper) {
    await sendTextMessage(sender_psid, "أنا بوت ذكاء اصطناعي، قام ببرمجتي وتطويري المبرمج العبقري (أبوبكر عادل). وتقدر تتابع صفحته الرسمية من هنا: [خت رابط صفحتك هنا]");
    return;
  }

  // تشغيل الذكاء الاصطناعي
  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const aiResponse = await axios.post(geminiUrl, {
      contents: [{ parts: [{ text: userMessage }] }]
    });
    responseText = aiResponse.data.candidates[0].content.parts[0].text;
  } catch (error) {
    responseText = "معليش يا غالي، الشبكة كعبة شوية، حاول تاني!";
  }

  await sendTextMessage(sender_psid, responseText);
}

async function sendTextMessage(sender_psid, text) {
  try {
    await axios.post(`https://graph.facebook.com/v19.0/me/messages?access_token=${FB_TOKEN}`, {
      recipient: { id: sender_psid },
      message: { text: text }
    });
  } catch (err) {
    console.log("Error:", err.message);
  }
}

app.listen(process.env.PORT || 3000, () => {
  console.log('Bot is running...');
});

