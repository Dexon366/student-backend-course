const express = require('express');

const app = express();
const port = 3000;

// Логирование всех входящих запросов
app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.url}`
  );

  next();
});

// 1. Текстовый эндпоинт
app.get('/', (req, res) => {
  res.send('Сервер варианта 6 работает!');
});

// 2. Эндпоинт со списком заказов
app.get('/api/orders', (req, res) => {
  res.json([
    {
      id: 1,
      product: 'Ноутбук',
      status: 'В обработке'
    },
    {
      id: 2,
      product: 'Клавиатура',
      status: 'Доставляется'
    },
    {
      id: 3,
      product: 'Мышь',
      status: 'Доставлен'
    }
  ]);
});

// 3. Эндпоинт со списком клиентов
app.get('/api/clients', (req, res) => {
  res.json([
    {
      id: 1,
      name: 'Иван Иванов'
    },
    {
      id: 2,
      name: 'Пётр Петров'
    },
    {
      id: 3,
      name: 'Анна Сидорова'
    }
  ]);
});

// 4. Эндпоинт заказа с параметром ID
app.get('/api/orders/:id', (req, res) => {
  res.json({
    requestedId: req.params.id,
    status: 'success'
  });
});

// 5. Обработка несуществующих маршрутов
app.use((req, res) => {
  res.status(404).json({
    error: 'Маршрут не найден'
  });
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});