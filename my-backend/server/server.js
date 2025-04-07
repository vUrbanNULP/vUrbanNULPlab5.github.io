const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();
const fs = require('fs');

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000/',
  'http://localhost:5000/',
  'http://localhost:3000',
  'http://localhost:5000',
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    console.log(`[Перевірка CORS] Джерело запиту: ${origin}`);
    if (!origin || allowedOrigins.includes(origin)) {
      console.log(`[Перевірка CORS] Дозволено для джерела: ${origin || 'Н/Д'}`);
      callback(null, true);
    } else {
      console.error(`[Перевірка CORS] Заблоковано джерело: ${origin}. Дозволені джерела: [${allowedOrigins.join(', ')}]`);
      callback(new Error(`Джерело ${origin} не дозволено CORS`));
    }
  },
  credentials: true
}));

app.use(express.json());

const staticPath = path.join(__dirname, 'public');
app.use(express.static(staticPath));
console.log(`Спроба роздачі статичних файлів з: ${staticPath}`);

if (fs.existsSync(staticPath)) {
  console.log(`Статичний шлях ${staticPath} існує.`);
  const imgPath = path.join(staticPath, 'img');
  if (fs.existsSync(imgPath)) {
     console.log(`Каталог зображень існує: ${imgPath}. Файли: ${fs.readdirSync(imgPath).join(', ')}`);
  } else {
     console.warn(`Каталог зображень НЕ ЗНАЙДЕНО за адресою: ${imgPath}`);
  }
} else {
  console.error(`Статичний шлях НЕ ЗНАЙДЕНО: ${staticPath}`);
}

const authRoutes = require('./routes/authRoutes');
const workoutRoutes = require('./routes/workoutRoutes');
const dietRoutes = require('./routes/dietRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/diet', dietRoutes);

app.get('/api', (req, res) => {
  res.json({ message: 'Бекенд API працює!' });
});

app.use('/api/*name', (req, res, next) => {
  res.status(404).json({ message: `Кінцева точка API не знайдена: ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  console.error("!!! Глобальний обробник помилок перехопив помилку:");
  console.error("Статус помилки:", err.status || 500);
  console.error("Повідомлення про помилку:", err.message || 'Внутрішня помилка сервера');
  console.error("Стек помилки:", err.stack);

  const errorResponse = {
    message: err.message || 'Внутрішня помилка сервера',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };
  res.status(err.status || 500).json(errorResponse);
});

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`--- Сервер запущено локально на http://localhost:${PORT} ---`));
}

module.exports = app;