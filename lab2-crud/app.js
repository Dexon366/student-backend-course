const express = require('express');

const app = express();
const port = 3000;

// Middleware для обработки JSON
app.use(express.json());

// Хранилище студентов в памяти
let students = [
    { id: 1, name: 'Иван Иванов', group: 'ПИЖ-101' },
    { id: 2, name: 'Пётр Петров', group: 'ПИЖ-102' },
    { id: 3, name: 'Анна Сидорова', group: 'ПИЖ-101' }
];

// Счётчик для создания новых ID
let nextId = 4;

// GET /students — получить список всех студентов
app.get('/students', (req, res) => {
    res.json({
        count: students.length,
        students: students
    });
});

// GET /students/:id — получить студента по ID
app.get('/students/:id', (req, res) => {
    const id = Number(req.params.id);

    const student = students.find(s => s.id === id);

    if (!student) {
        return res.status(404).json({
            error: 'Студент не найден'
        });
    }

    res.json(student);
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});