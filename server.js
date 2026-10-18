require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_ID = 6965294597;

app.use(express.json({ limit: '10mb' }));
app.use(cors());
app.use(express.static('public'));

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB подключена'))
  .catch(err => console.error('❌ Ошибка MongoDB:', err));

// ================= СХЕМЫ БАЗЫ ДАННЫХ =================

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

// ================= API РОУТЫ =================

// ✅ Теперь сортировка идёт через MongoDB (с индексом — мгновенно!)
app.get('/api/accounts', async (req, res) => {
  try {
    const accounts = await Account.find()
      .sort({ createdAt: -1 })
      .allowDiskUse(true);
    res.json(accounts);
  } catch (error) {
    console.error('Ошибка получения аккаунтов:', error);
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

// ================= ОБРАБОТЧИК /start =================

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
    console.error('Ошибка сохранения пользователя:', err);
  }

  const notification = `
🔔 <b>Новый пользователь нажал /start!</b>

👤 <b>Имя:</b> ${fullName}
🆔 <b>Username:</b> @${username}
🔢 <b>ID:</b> <code>${userId}</code>
📅 <b>Время:</b> ${new Date().toLocaleString('ru-RU')}
  `;

  bot.sendMessage(ADMIN_ID, notification, { parse_mode: 'HTML' });

  bot.sendMessage(msg.chat.id, ' Добро пожаловать в магазин аккаунтов Mobile Legends!', {
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
