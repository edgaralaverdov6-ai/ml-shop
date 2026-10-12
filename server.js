require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(cors());
app.use(express.static('public'));

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Подключение к MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB подключена'))
  .catch(err => console.error('❌ Ошибка MongoDB:', err));

// Схема аккаунта
const accountSchema = new mongoose.Schema({
  name: String,
  rank: String,
  heroes: Number,
  skins: Number,
  price: Number,
  description: String,
  photo: String,
  createdAt: { type: Date, default: Date.now }
});

const Account = mongoose.model('Account', accountSchema);

// Получить все аккаунты
app.get('/api/accounts', async (req, res) => {
  try {
    const accounts = await Account.find().sort({ createdAt: -1 });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Добавить аккаунт
app.post('/api/accounts', async (req, res) => {
  try {
    const account = new Account({ ...req.body, createdAt: new Date() });
    await account.save();
    res.json(account);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Удалить аккаунт
app.delete('/api/accounts/:id', async (req, res) => {
  try {
    await Account.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

bot.onText(/\/start/, (msg) => {
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