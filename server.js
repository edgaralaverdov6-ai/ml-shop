require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Увеличиваем лимит размера запроса (для фото в base64)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors());
app.use(express.static('public'));

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

const accountsFile = path.join(__dirname, 'accounts.json');

function loadAccounts() {
  if (fs.existsSync(accountsFile)) {
    return JSON.parse(fs.readFileSync(accountsFile, 'utf8'));
  }
  return [];
}

function saveAccounts(accounts) {
  fs.writeFileSync(accountsFile, JSON.stringify(accounts, null, 2));
}

app.get('/api/accounts', (req, res) => {
  const accounts = loadAccounts();
  res.json(accounts);
});

app.post('/api/accounts', (req, res) => {
  const accounts = loadAccounts();
  const newAccount = {
    id: Date.now(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  accounts.push(newAccount);
  saveAccounts(accounts);
  res.json(newAccount);
});

app.delete('/api/accounts/:id', (req, res) => {
  let accounts = loadAccounts();
  accounts = accounts.filter(acc => acc.id !== parseInt(req.params.id));
  saveAccounts(accounts);
  res.json({ success: true });
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, '🎮 Добро пожаловать в магазин аккаунтов Mobile Legends!', {
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