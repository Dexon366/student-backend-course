const express = require('express');
const fs = require('fs');

const app = express();
const port = 3000;

// Middleware для обработки JSON
app.use(express.json());


// ЛОГИРОВАНИЕ ЗАПРОСОВ


app.use((req, res, next) => {
    const startTime = new Date();

    res.on('finish', () => {
        const logMessage =
            `[${startTime.toISOString()}] ` +
            `${req.method} ${req.originalUrl} ` +
            `${res.statusCode}\n`;

        fs.appendFile('access.log', logMessage, (error) => {
            if (error) {
                console.error('Ошибка записи в access.log:', error.message);
            }
        });
    });

    next();
});


// ХРАНИЛИЩЕ ДАННЫХ В ПАМЯТИ


let students = [
    {
        id: 1,
        name: 'Иван Иванов',
        group: 'ИВТ-101',
        course: 2,
        avg_grade: 4.2
    },
    {
        id: 2,
        name: 'Пётр Петров',
        group: 'ИВТ-102',
        course: 3,
        avg_grade: 4.6
    },
    {
        id: 3,
        name: 'Анна Сидорова',
        group: 'ИВТ-101',
        course: 2,
        avg_grade: 4.8
    },
    {
        id: 4,
        name: 'Мария Кузнецова',
        group: 'ИВТ-103',
        course: 1,
        avg_grade: 4.0
    },
    {
        id: 5,
        name: 'Дмитрий Смирнов',
        group: 'ИВТ-102',
        course: 3,
        avg_grade: 3.7
    }
];

let nextId = 6;


// ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ВАЛИДАЦИИ


function validateStudent(data) {
    const { name, group, course, avg_grade } = data;

    // Проверка обязательных полей
    if (
        !name ||
        !group ||
        course === undefined ||
        avg_grade === undefined
    ) {
        return 'Поля name, group, course и avg_grade обязательны';
    }

    // Проверка типов
    if (
        typeof name !== 'string' ||
        typeof group !== 'string' ||
        typeof course !== 'number' ||
        typeof avg_grade !== 'number'
    ) {
        return 'Неверный тип данных';
    }

    // Проверка курса
    if (!Number.isInteger(course) || course < 1 || course > 6) {
        return 'Курс должен быть целым числом от 1 до 6';
    }

    // Проверка среднего балла
    if (avg_grade < 2 || avg_grade > 5) {
        return 'Средний балл должен быть от 2 до 5';
    }

    return null;
}


// GET /students
// Получить всех студентов
// + поиск
// + сортировка
// + пагинация


app.get('/students', (req, res) => {
    let result = [...students];

    // --------------------------------------------------------
    // ПОИСК
    // GET /students?search=иван
    // --------------------------------------------------------

    if (req.query.search) {
        const search = req.query.search.toLowerCase();

        result = result.filter(student =>
            student.name.toLowerCase().includes(search)
        );
    }

    // --------------------------------------------------------
    // СОРТИРОВКА
    // GET /students?sort=avg_grade&order=desc
    // --------------------------------------------------------

    if (req.query.sort) {
        const field = req.query.sort;
        const order = req.query.order === 'desc' ? -1 : 1;

        const allowedFields = [
            'id',
            'name',
            'group',
            'course',
            'avg_grade'
        ];

        if (!allowedFields.includes(field)) {
            return res.status(400).json({
                error: 'Недопустимое поле для сортировки'
            });
        }

        result.sort((a, b) => {
            if (typeof a[field] === 'string') {
                return a[field].localeCompare(b[field]) * order;
            }

            return (a[field] - b[field]) * order;
        });
    }

    // --------------------------------------------------------
    // ПАГИНАЦИЯ
    // GET /students?page=1&limit=2
    // --------------------------------------------------------

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || result.length;

    if (
        !Number.isInteger(page) ||
        !Number.isInteger(limit) ||
        page < 1 ||
        limit < 1
    ) {
        return res.status(400).json({
            error: 'page и limit должны быть положительными целыми числами'
        });
    }

    const start = (page - 1) * limit;
    const end = start + limit;

    const paginatedStudents = result.slice(start, end);

    res.json({
        count: result.length,
        page: page,
        limit: limit,
        totalPages: Math.ceil(result.length / limit),
        students: paginatedStudents
    });
});


// GET /students/stats
// Статистика


app.get('/students/stats', (req, res) => {
    const count = students.length;

    const averageGrade =
        count > 0
            ? students.reduce((sum, student) => {
                return sum + student.avg_grade;
            }, 0) / count
            : 0;

    res.json({
        count: count,
        average_grade: Number(averageGrade.toFixed(2))
    });
});


// GET /students/:id/related
// Получить студентов из той же группы


app.get('/students/:id/related', (req, res) => {
    const id = Number(req.params.id);

    const student = students.find(s => s.id === id);

    if (!student) {
        return res.status(404).json({
            error: 'Студент не найден'
        });
    }

    const relatedStudents = students.filter(
        s => s.group === student.group && s.id !== student.id
    );

    res.json({
        student_id: student.id,
        group: student.group,
        related: relatedStudents
    });
});


// GET /students/:id
// Получить одного студента


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


// POST /students
// Создать одного студента


app.post('/students', (req, res) => {
    const validationError = validateStudent(req.body);

    if (validationError) {
        return res.status(400).json({
            error: validationError
        });
    }

    const newStudent = {
        id: nextId++,
        name: req.body.name,
        group: req.body.group,
        course: req.body.course,
        avg_grade: req.body.avg_grade
    };

    students.push(newStudent);

    res.status(201).json(newStudent);
});


// POST /students/bulk
// Массовое создание студентов


app.post('/students/bulk', (req, res) => {
    const { students: newStudents } = req.body;

    if (!Array.isArray(newStudents) || newStudents.length === 0) {
        return res.status(400).json({
            error: 'Поле students должно содержать непустой массив'
        });
    }

    // Сначала проверяем все данные.
    // Если хотя бы один студент неправильный,
    // ничего не добавляем.
    for (let i = 0; i < newStudents.length; i++) {
        const validationError = validateStudent(newStudents[i]);

        if (validationError) {
            return res.status(400).json({
                error: `Ошибка в студенте №${i + 1}: ${validationError}`
            });
        }
    }

    const createdStudents = newStudents.map(student => ({
        id: nextId++,
        name: student.name,
        group: student.group,
        course: student.course,
        avg_grade: student.avg_grade
    }));

    students.push(...createdStudents);

    res.status(201).json({
        count: createdStudents.length,
        students: createdStudents
    });
});


// PUT /students/:id
// Полное обновление студента


app.put('/students/:id', (req, res) => {
    const id = Number(req.params.id);

    const index = students.findIndex(s => s.id === id);

    if (index === -1) {
        return res.status(404).json({
            error: 'Студент не найден'
        });
    }

    const validationError = validateStudent(req.body);

    if (validationError) {
        return res.status(400).json({
            error: validationError
        });
    }

    students[index] = {
        id: id,
        name: req.body.name,
        group: req.body.group,
        course: req.body.course,
        avg_grade: req.body.avg_grade
    };

    res.json(students[index]);
});


// PATCH /students/:id
// Частичное обновление студента


app.patch('/students/:id', (req, res) => {
    const id = Number(req.params.id);

    const index = students.findIndex(s => s.id === id);

    if (index === -1) {
        return res.status(404).json({
            error: 'Студент не найден'
        });
    }

    const allowedFields = [
        'name',
        'group',
        'course',
        'avg_grade'
    ];

    const receivedFields = Object.keys(req.body);

    // Проверяем неизвестные поля
    const unknownFields = receivedFields.filter(
        field => !allowedFields.includes(field)
    );

    if (unknownFields.length > 0) {
        return res.status(400).json({
            error: `Недопустимые поля: ${unknownFields.join(', ')}`
        });
    }

    // Создаём будущую версию студента
    const updatedStudent = {
        ...students[index],
        ...req.body,
        id: id
    };

    const validationError = validateStudent(updatedStudent);

    if (validationError) {
        return res.status(400).json({
            error: validationError
        });
    }

    students[index] = updatedStudent;

    res.json(students[index]);
});


// DELETE /students/:id
// Удалить одного студента


app.delete('/students/:id', (req, res) => {
    const id = Number(req.params.id);

    const index = students.findIndex(s => s.id === id);

    if (index === -1) {
        return res.status(404).json({
            error: 'Студент не найден'
        });
    }

    students.splice(index, 1);

    res.status(204).send();
});


// DELETE /students
// Массовое удаление всех студентов


app.delete('/students', (req, res) => {
    const deletedCount = students.length;

    students = [];

    res.json({
        message: 'Все студенты удалены',
        deletedCount: deletedCount
    });
});


// ОБРАБОТКА НЕСУЩЕСТВУЮЩИХ МАРШРУТОВ


app.use((req, res) => {
    res.status(404).json({
        error: 'Маршрут не найден'
    });
});


// ГЛОБАЛЬНЫЙ ОБРАБОТЧИК ОШИБОК


app.use((err, req, res, next) => {
    console.error('Ошибка сервера:', err);

    res.status(500).json({
        error: 'Внутренняя ошибка сервера'
    });
});


// ЗАПУСК СЕРВЕРА


app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});