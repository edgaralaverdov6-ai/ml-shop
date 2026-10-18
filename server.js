require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const cors = require('cors');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_ID = 6965294597;

app.use(express.json({ limit: '10mb' }));
app.use(cors());
app.use(express.static('public'));

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB подключена'))
  .catch(err => console.error('❌ Ошибка MongoDB:', err));

const accountSchema = new mongoose.Schema({
  name: String,
  rank: String,
  heroes: Number,
  skins: Number,
  price: Number,
  description: String,
  photo: String,
  createdAt: { type: Date, default: Date.now, index: true }
});
const Account = mongoose.model('Account', accountSchema);

const userSchema = new mongoose.Schema({
  telegramId: { type: Number, required: true, unique: true },
  username: String,
  firstName: String,
  lastName: String,
  firstVisit: { type: Date, default: Date.now },
  lastVisit: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// ================= МИГРАЦИЯ СТАРЫХ ФОТО =================
app.get('/migrate-photos', async (req, res) => {
  try {
    const oldAccounts = await Account.find({ 
      photo: { $regex: /^data:image/ } 
    });

    if (oldAccounts.length === 0) {
      return res.json({ 
        message: '✅ Все фото уже в Cloudinary! Миграция не нужна.',
        total: await Account.countDocuments()
      });
    }

    res.json({ 
      message: `⏳ Начинаем миграцию ${oldAccounts.length} фото. Открой эту страницу через 60 секунд.`,
      total: oldAccounts.length
    });

    (async () => {
      let success = 0;
      let failed = 0;
      
      for (const account of oldAccounts) {
        try {
          const result = await cloudinary.uploader.upload(account.photo, {
            folder: 'mlbb-accounts',
            quality: 80,
            width: 800,
            crop: 'limit'
          });
          
          account.photo = result.secure_url;
          await account.save();
          success++;
          console.log(`✅ [${success}/${oldAccounts.length}] Мигрирован: ${account.name}`);
        } catch (err) {
          failed++;
          console.error(`❌ [${failed}] Ошибка: ${account.name} - ${err.message}`);
        }
      }
      
      console.log(`🎉 Миграция завершена! Успешно: ${success}, Ошибок: ${failed}`);
    })();

  } catch (error) {
    console.error('Ошибка миграции:', error);
    res.status(500).json({ error: error.message });
  }
});

// ================= API РОУТЫ =================

app.get('/api/accounts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    
    const accounts = await Account.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Account.countDocuments();
    
    res.json({ 
      accounts, 
      hasMore: skip + accounts.length < total,
      total 
    });
  } catch (error) {
    console.error('Ошибка:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/upload-photo', async (req, res) => {
  try {
    const { photo } = req.body;
    if (!photo) return res.status(400).json({ error: 'Нет фото' });

    const result = await cloudinary.uploader.upload(photo, {
      folder: 'mlbb-accounts',
      quality: 80,
      width: 800,
      crop: 'limit'
    });

    res.json({ url: result.secure_url });
  } catch (error) {
    console.error('Ошибка загрузки:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/accounts', async (req, res) => {
  try {
    const account = new Account({ ...req.body, createdAt: new Date() });
    await account.save();
    res.json(account);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/accounts/:id', async (req, res) => {
  try {
    await Account.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

bot.onText(/\/start/, async (msg) => {
  const userId = msg.from.id;
  const username = msg.from.username || 'нет username';
  const firstName = msg.from.first_name || 'Не указано';
  const lastName = msg.from.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();

  try {
    await User.findOneAndUpdate(
      { telegramId: userId },
      { username, firstName, lastName, lastVisit: new Date() },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error('Ошибка:', err);
  }

  const notification = `
🔔 <b>Новый пользователь!</b>
👤 <b>Имя:</b> ${fullName}
🆔 <b>Username:</b> @${username}
🔢 <b>ID:</b> <code>${userId}</code>
📅 <b>Время:</b> ${new Date().toLocaleString('ru-RU')}
  `;

  bot.sendMessage(ADMIN_ID, notification, { parse_mode: 'HTML' });

  bot.sendMessage(msg.chat.id, '🎮 Добро пожаловать в магазин аккаунтов Mobile Legends!', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🛒 Открыть магазин', web_app: { url: 'https://ml-shop.onrender.com' } }]
      ]
    }
  });
});

app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);
});
