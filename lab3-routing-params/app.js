const express = require('express');

const app = express();
const PORT = 3000;


// MIDDLEWARE


app.use(express.json());

/**
 * Логирование всех входящих запросов.
 * Требование продвинутого уровня:
 * время + HTTP-метод + URL + IP.
 */
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const ip = req.ip;

    console.log(
        `[${timestamp}] ${req.method} ${req.originalUrl} | IP: ${ip}`
    );

    next();
});


// ДАННЫЕ


let clients = [
    {
        id: 1,
        name: 'Иван Петров',
        email: 'ivan.petrov@example.com',
        city: 'Москва'
    },
    {
        id: 2,
        name: 'Анна Смирнова',
        email: 'anna.smirnova@example.com',
        city: 'Санкт-Петербург'
    },
    {
        id: 3,
        name: 'Дмитрий Иванов',
        email: 'dmitry.ivanov@example.com',
        city: 'Казань'
    },
    {
        id: 4,
        name: 'Мария Соколова',
        email: 'maria.sokolova@example.com',
        city: 'Москва'
    },
    {
        id: 5,
        name: 'Алексей Волков',
        email: 'alexey.volkov@example.com',
        city: 'Екатеринбург'
    }
];

let orders = [
    {
        id: 1,
        clientId: 1,
        product: 'Ноутбук ASUS',
        amount: 85000,
        status: 'completed',
        date: '2026-09-01'
    },
    {
        id: 2,
        clientId: 2,
        product: 'Механическая клавиатура',
        amount: 12000,
        status: 'processing',
        date: '2026-09-03'
    },
    {
        id: 3,
        clientId: 3,
        product: 'Монитор LG',
        amount: 35000,
        status: 'completed',
        date: '2026-09-05'
    },
    {
        id: 4,
        clientId: 1,
        product: 'Мышь Logitech',
        amount: 6500,
        status: 'cancelled',
        date: '2026-09-07'
    },
    {
        id: 5,
        clientId: 4,
        product: 'Наушники Sony',
        amount: 18000,
        status: 'processing',
        date: '2026-09-09'
    },
    {
        id: 6,
        clientId: 5,
        product: 'SSD Samsung 1TB',
        amount: 11000,
        status: 'completed',
        date: '2026-09-11'
    },
    {
        id: 7,
        clientId: 2,
        product: 'Веб-камера Logitech',
        amount: 9000,
        status: 'pending',
        date: '2026-09-13'
    },
    {
        id: 8,
        clientId: 3,
        product: 'Игровое кресло',
        amount: 27000,
        status: 'completed',
        date: '2026-09-15'
    },
    {
        id: 9,
        clientId: 4,
        product: 'USB-C Hub',
        amount: 4500,
        status: 'pending',
        date: '2026-09-17'
    },
    {
        id: 10,
        clientId: 5,
        product: 'Wi-Fi роутер',
        amount: 7500,
        status: 'processing',
        date: '2026-09-19'
    }
];

const allowedStatuses = [
    'pending',
    'processing',
    'completed',
    'cancelled'
];

const allowedSortFields = [
    'id',
    'amount',
    'product',
    'status',
    'date',
    'clientId'
];


// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
 

function parsePositiveInteger(value, parameterName) {
    const number = Number(value);

    if (!Number.isInteger(number) || number < 1) {
        return {
            valid: false,
            error: `${parameterName} должен быть положительным целым числом`
        };
    }

    return {
        valid: true,
        value: number
    };
}

function findClientById(clientId) {
    return clients.find(client => client.id === clientId);
}

function findOrderById(orderId) {
    return orders.find(order => order.id === orderId);
}


// БАЗОВЫЕ МАРШРУТЫ


/**
 * GET /orders
 *
 * Получение списка заказов.
 * Поддерживает:
 * search
 * sort
 * order
 * page
 * limit
 * filter
 * status
 */
app.get('/orders', (req, res) => {
    let result = [...orders];


    // Поиск

    const search = req.query.search;

    if (search !== undefined) {
        if (typeof search !== 'string' || search.length > 100) {
            return res.status(400).json({
                error: 'Параметр search должен быть строкой длиной не более 100 символов'
            });
        }

        result = result.filter(order =>
            order.product.toLowerCase().includes(search.toLowerCase())
        );
    }


    // Фильтрация по статусу

    const status = req.query.status;

    if (status !== undefined) {
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                error: `Недопустимый статус. Разрешены: ${allowedStatuses.join(', ')}`
            });
        }

        result = result.filter(order => order.status === status);
    }


    // Универсальный filter=field:value

    const filter = req.query.filter;

    if (filter !== undefined) {
        if (typeof filter !== 'string' || !filter.includes(':')) {
            return res.status(400).json({
                error: 'Параметр filter должен иметь формат field:value'
            });
        }

        const [field, ...valueParts] = filter.split(':');
        const value = valueParts.join(':');

        const allowedFilterFields = [
            'status',
            'clientId',
            'amount'
        ];

        if (!allowedFilterFields.includes(field)) {
            return res.status(400).json({
                error: `Недопустимое поле фильтра. Разрешены: ${allowedFilterFields.join(', ')}`
            });
        }

        if (field === 'status') {
            if (!allowedStatuses.includes(value)) {
                return res.status(400).json({
                    error: `Недопустимый статус. Разрешены: ${allowedStatuses.join(', ')}`
                });
            }

            result = result.filter(order => order.status === value);
        }

        if (field === 'clientId') {
            const clientId = Number(value);

            if (!Number.isInteger(clientId) || clientId < 1) {
                return res.status(400).json({
                    error: 'Значение clientId должно быть положительным целым числом'
                });
            }

            result = result.filter(order => order.clientId === clientId);
        }

        if (field === 'amount') {
            const amount = Number(value);

            if (!Number.isFinite(amount) || amount < 0) {
                return res.status(400).json({
                    error: 'Значение amount должно быть неотрицательным числом'
                });
            }

            result = result.filter(order => order.amount === amount);
        }
    }


    // Сортировка

    const sort = req.query.sort;
    const order = req.query.order || 'asc';

    if (sort !== undefined) {
        if (!allowedSortFields.includes(sort)) {
            return res.status(400).json({
                error: `Поле сортировки должно быть одним из: ${allowedSortFields.join(', ')}`
            });
        }

        if (!['asc', 'desc'].includes(order)) {
            return res.status(400).json({
                error: 'Параметр order должен быть asc или desc'
            });
        }

        result.sort((a, b) => {
            const valueA = a[sort];
            const valueB = b[sort];

            if (valueA < valueB) {
                return order === 'asc' ? -1 : 1;
            }

            if (valueA > valueB) {
                return order === 'asc' ? 1 : -1;
            }

            return 0;
        });
    } else if (req.query.order !== undefined) {
        if (!['asc', 'desc'].includes(order)) {
            return res.status(400).json({
                error: 'Параметр order должен быть asc или desc'
            });
        }
    }


    // Пагинация

    const page = req.query.page === undefined
        ? 1
        : Number(req.query.page);

    const limit = req.query.limit === undefined
        ? 10
        : Number(req.query.limit);

    if (!Number.isInteger(page) || page < 1) {
        return res.status(400).json({
            error: 'page должен быть положительным целым числом'
        });
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        return res.status(400).json({
            error: 'limit должен быть целым числом от 1 до 100'
        });
    }

    const totalPages = Math.ceil(result.length / limit);
    const start = (page - 1) * limit;

    const paginatedOrders = result.slice(start, start + limit);

    res.json({
        count: result.length,
        page,
        limit,
        totalPages,
        orders: paginatedOrders
    });
});


// GET /orders/stats
// Статистика по заказам


app.get('/orders/stats', (req, res) => {
    const count = orders.length;

    const totalAmount = orders.reduce(
        (sum, order) => sum + order.amount,
        0
    );

    const averageAmount = count > 0
        ? totalAmount / count
        : 0;

    const minAmount = count > 0
        ? Math.min(...orders.map(order => order.amount))
        : 0;

    const maxAmount = count > 0
        ? Math.max(...orders.map(order => order.amount))
        : 0;

    const byStatus = {};

    for (const status of allowedStatuses) {
        byStatus[status] = orders.filter(
            order => order.status === status
        ).length;
    }

    res.json({
        count,
        totalAmount,
        averageAmount: Number(averageAmount.toFixed(2)),
        minAmount,
        maxAmount,
        byStatus
    });
});



// GET /orders/:id
// Получение одного заказа


app.get('/orders/:id', (req, res) => {
    const parsedId = parsePositiveInteger(req.params.id, 'ID заказа');

    if (!parsedId.valid) {
        return res.status(400).json({
            error: parsedId.error
        });
    }

    const order = findOrderById(parsedId.value);

    if (!order) {
        return res.status(404).json({
            error: 'Заказ не найден'
        });
    }

    res.json(order);
});


// GET /orders/:id/client
// Вложенный ресурс — клиент заказа


app.get('/orders/:id/client', (req, res) => {
    const parsedId = parsePositiveInteger(req.params.id, 'ID заказа');

    if (!parsedId.valid) {
        return res.status(400).json({
            error: parsedId.error
        });
    }

    const order = findOrderById(parsedId.value);

    if (!order) {
        return res.status(404).json({
            error: 'Заказ не найден'
        });
    }

    const client = findClientById(order.clientId);

    if (!client) {
        return res.status(404).json({
            error: 'Клиент заказа не найден'
        });
    }

    res.json({
        orderId: order.id,
        client
    });
});


// GET /clients/:clientId/orders
// Вложенный маршрут: все заказы клиента


app.get('/clients/:clientId/orders', (req, res) => {
    const parsedClientId = parsePositiveInteger(
        req.params.clientId,
        'ID клиента'
    );

    if (!parsedClientId.valid) {
        return res.status(400).json({
            error: parsedClientId.error
        });
    }

    const client = findClientById(parsedClientId.value);

    if (!client) {
        return res.status(404).json({
            error: 'Клиент не найден'
        });
    }

    const clientOrders = orders.filter(
        order => order.clientId === client.id
    );

    res.json({
        client,
        count: clientOrders.length,
        orders: clientOrders
    });
});


// GET /clients/:clientId/orders/:orderId
// Вложенный маршрут с двумя параметрами


app.get('/clients/:clientId/orders/:orderId', (req, res) => {
    const parsedClientId = parsePositiveInteger(
        req.params.clientId,
        'ID клиента'
    );

    if (!parsedClientId.valid) {
        return res.status(400).json({
            error: parsedClientId.error
        });
    }

    const parsedOrderId = parsePositiveInteger(
        req.params.orderId,
        'ID заказа'
    );

    if (!parsedOrderId.valid) {
        return res.status(400).json({
            error: parsedOrderId.error
        });
    }

    const client = findClientById(parsedClientId.value);

    if (!client) {
        return res.status(404).json({
            error: 'Клиент не найден'
        });
    }

    const order = findOrderById(parsedOrderId.value);

    if (!order) {
        return res.status(404).json({
            error: 'Заказ не найден'
        });
    }

    if (order.clientId !== client.id) {
        return res.status(404).json({
            error: 'Указанный заказ не принадлежит данному клиенту'
        });
    }

    res.json({
        client,
        order
    });
});


// GET /statuses/:status/orders
// Связь по статусу


app.get('/statuses/:status/orders', (req, res) => {
    const { status } = req.params;

    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
            error: `Недопустимый статус. Разрешены: ${allowedStatuses.join(', ')}`
        });
    }

    const filteredOrders = orders.filter(
        order => order.status === status
    );

    res.json({
        status,
        count: filteredOrders.length,
        orders: filteredOrders
    });
});


// GET /clients/:clientId
// Информация о клиенте


app.get('/clients/:clientId', (req, res) => {
    const parsedClientId = parsePositiveInteger(
        req.params.clientId,
        'ID клиента'
    );

    if (!parsedClientId.valid) {
        return res.status(400).json({
            error: parsedClientId.error
        });
    }

    const client = findClientById(parsedClientId.value);

    if (!client) {
        return res.status(404).json({
            error: 'Клиент не найден'
        });
    }

    res.json(client);
});


// ТЕСТОВЫЙ ENDPOINT ДЛЯ ПРОВЕРКИ 500


app.get('/test/error', (req, res, next) => {
    next(new Error('Тестовая ошибка сервера'));
});


// WILDCARD 404
// Должен находиться после всех остальных маршрутов


app.use((req, res) => {
    res.status(404).json({
        error: 'Маршрут не найден',
        method: req.method,
        url: req.originalUrl
    });
});


// ГЛОБАЛЬНЫЙ ОБРАБОТЧИК ОШИБОК 500


app.use((err, req, res, next) => {
    console.error(
        `[500] ${new Date().toISOString()} ${req.method} ${req.originalUrl}`
    );

    console.error(err.stack);

    res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: err.message
    });
});


// ЗАПУСК СЕРВЕРА


app.listen(PORT, () => {
    console.log('==========================================');
    console.log('Лабораторная работа №3');
    console.log('Express Routing API');
    console.log(`Сервер запущен: http://localhost:${PORT}`);
    console.log('==========================================');
});