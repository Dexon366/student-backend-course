const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Подключение к базе данных
const db = new Database(path.join(__dirname, 'lab4.db'));

// Включение проверки внешних ключей
db.pragma('foreign_keys = ON');

// Путь к SQL-скрипту создания таблиц
const initScriptPath = path.join(__dirname, 'init_db.sql');

// Проверка наличия таблицы
function tableExists(tableName) {
    return Boolean(
        db.prepare(`
            SELECT name
            FROM sqlite_master
            WHERE type = 'table' AND name = ?
        `).get(tableName)
    );
}

// Вывод заголовка раздела
function printSection(title) {
    console.log('\n' + '='.repeat(65));
    console.log(title);
    console.log('='.repeat(65));
}

// Вывод результатов SQL-запроса
function printResults(title, rows) {
    console.log(`\n${title}`);

    if (rows.length === 0) {
        console.log('Записи не найдены.');
        return;
    }

    console.table(rows);
}

// Инициализация структуры базы данных
function initializeDatabase() {
    const resetRequested = process.argv.includes('--reset');

    // Создание таблиц при первом запуске или полном сбросе
    if (resetRequested || !tableExists('groups')) {
        const sql = fs.readFileSync(initScriptPath, 'utf8');
        db.exec(sql);

        console.log('Структура базы данных создана.');
    }

    // Заполнение базы только при отсутствии групп
    const groupsCount = db.prepare(
        'SELECT COUNT(*) AS count FROM groups'
    ).get().count;

    if (groupsCount === 0) {
        insertInitialData();
    }
}

// Добавление начальных данных
function insertInitialData() {
    printSection('ЗАПОЛНЕНИЕ БАЗЫ ДАННЫХ');

    const groups = [
        'ПИЖ-б-о-25-1',
        'ПИЖ-б-о-25-2',
        'ПИЖ-б-о-24-1',
        'ПИЖ-б-о-24-2',
        'ПИЖ-б-о-23-1',
        'ПИЖ-б-о-23-2',
        'ПИЖ-б-о-22-1'
    ];

    const students = [
        ['Иванов Артём', 1, 4.7],
        ['Петрова Анна', 1, 4.9],
        ['Сидоров Максим', 1, 3.8],
        ['Смирнова Мария', 2, 4.6],
        ['Кузнецов Даниил', 2, 3.9],
        ['Попова Елена', 2, 4.8],
        ['Васильев Кирилл', 3, 3.5],
        ['Морозова София', 3, 4.2],
        ['Новиков Илья', 4, 4.0],
        ['Фёдорова Алиса', 4, 4.95],
        ['Волков Матвей', 5, 3.2],
        ['Алексеева Полина', 5, 4.4],
        ['Лебедев Егор', 6, 2.9],
        ['Захарова Дарья', 6, 4.1],
        ['Орлов Никита', 6, 3.7]
    ];

    // Добавление учебных групп
    const insertGroup = db.prepare(
        'INSERT INTO groups (name) VALUES (?)'
    );

    const insertGroupsTransaction = db.transaction(() => {
        for (const group of groups) {
            insertGroup.run(group);
        }
    });

    insertGroupsTransaction();

    // Добавление студентов
    const insertStudent = db.prepare(`
        INSERT INTO students (name, group_id, avg_grade)
        VALUES (?, ?, ?)
    `);

    const insertStudentsTransaction = db.transaction(() => {
        for (const student of students) {
            insertStudent.run(...student);
        }
    });

    insertStudentsTransaction();

    console.log(`Добавлено групп: ${groups.length}`);
    console.log(`Добавлено студентов: ${students.length}`);
}

// Базовые CRUD-операции
function performCrudOperations() {
    printSection('1. БАЗОВЫЕ CRUD-ОПЕРАЦИИ');

    // SELECT - получение всех студентов
    const allStudents = db.prepare(`
        SELECT * FROM students
    `).all();

    printResults('Все студенты:', allStudents);

    // WHERE - фильтрация по среднему баллу
    const filteredStudents = db.prepare(`
        SELECT * FROM students
        WHERE avg_grade > ?
    `).all(4.5);

    printResults('Студенты со средним баллом выше 4.5:', filteredStudents);

    // UPDATE - обновление информации о студенте
    const updateStudent = db.prepare(`
        UPDATE students
        SET avg_grade = ?
        WHERE id = ?
    `);

    const updateResult = updateStudent.run(4.8, 1);

    console.log(
        `\nОбновлено записей: ${updateResult.changes}`
    );

    // Проверка обновления
    const updatedStudent = db.prepare(`
        SELECT * FROM students WHERE id = ?
    `).get(1);

    console.log('Обновлённый студент:');
    console.table([updatedStudent]);

    // DELETE - удаление студента
    const deleteStudent = db.prepare(`
        DELETE FROM students
        WHERE id = ?
    `);

    const deleteResult = deleteStudent.run(15);

    console.log(
        `Удалено записей: ${deleteResult.changes}`
    );
}

// Сортировка и фильтрация
function performFilteringOperations() {
    printSection('2. СОРТИРОВКА И ФИЛЬТРАЦИЯ');

    // ORDER BY ASC - сортировка по имени
    const ascending = db.prepare(`
        SELECT * FROM students
        ORDER BY name ASC
    `).all();

    printResults('Сортировка по имени (возрастание):', ascending);

    // ORDER BY DESC - сортировка по среднему баллу
    const descending = db.prepare(`
        SELECT * FROM students
        ORDER BY avg_grade DESC
    `).all();

    printResults('Сортировка по среднему баллу (убывание):', descending);

    // LIMIT и OFFSET - первая страница
    const firstPage = db.prepare(`
        SELECT * FROM students
        ORDER BY id
        LIMIT ? OFFSET ?
    `).all(5, 0);

    printResults('Первая страница (5 записей):', firstPage);

    // LIMIT и OFFSET - вторая страница
    const secondPage = db.prepare(`
        SELECT * FROM students
        ORDER BY id
        LIMIT ? OFFSET ?
    `).all(5, 5);

    printResults('Вторая страница (5 записей):', secondPage);

    // LIKE - поиск по подстроке
    const search = db.prepare(`
        SELECT * FROM students
        WHERE name LIKE ?
    `).all('%ова%');

    printResults('Поиск студентов по подстроке "ова":', search);

    // BETWEEN - выборка по диапазону
    const range = db.prepare(`
        SELECT * FROM students
        WHERE avg_grade BETWEEN ? AND ?
        ORDER BY avg_grade
    `).all(4.0, 4.8);

    printResults('Студенты со средним баллом от 4.0 до 4.8:', range);

    // IN - выборка по списку групп
    const groupList = db.prepare(`
        SELECT * FROM students
        WHERE group_id IN (?, ?)
        ORDER BY group_id, name
    `).all(1, 2);

    printResults('Студенты групп №1 и №2:', groupList);
}

// Агрегатные функции
function performAggregateOperations() {
    printSection('3. АГРЕГАТНЫЕ ФУНКЦИИ');

    const statistics = db.prepare(`
        SELECT
            COUNT(*) AS total_students,
            SUM(avg_grade) AS total_grades,
            ROUND(AVG(avg_grade), 2) AS average_grade,
            MAX(avg_grade) AS highest_grade,
            MIN(avg_grade) AS lowest_grade
        FROM students
    `).get();

    console.log('Общая статистика студентов:');
    console.table([statistics]);
}

// Группировка данных
function performGroupingOperations() {
    printSection('4. GROUP BY И HAVING');

    // GROUP BY - группировка студентов по учебным группам
    const groupsStatistics = db.prepare(`
        SELECT
            groups.id,
            groups.name AS group_name,
            COUNT(students.id) AS students_count,
            ROUND(AVG(students.avg_grade), 2) AS average_grade
        FROM groups
        LEFT JOIN students
            ON groups.id = students.group_id
        GROUP BY groups.id, groups.name
        ORDER BY groups.name
    `).all();

    printResults('Статистика по учебным группам:', groupsStatistics);

    // HAVING - группы, в которых минимум 3 студента
    const popularGroups = db.prepare(`
        SELECT
            groups.name AS group_name,
            COUNT(students.id) AS students_count
        FROM groups
        INNER JOIN students
            ON groups.id = students.group_id
        GROUP BY groups.id, groups.name
        HAVING COUNT(students.id) >= ?
    `).all(3);

    printResults('Группы с количеством студентов не менее 3:', popularGroups);
}

// Объединение таблиц
function performJoinOperations() {
    printSection('5. ОБЪЕДИНЕНИЕ ТАБЛИЦ JOIN');

    // INNER JOIN - только группы с соответствующими студентами
    const innerJoin = db.prepare(`
        SELECT
            students.id,
            students.name AS student_name,
            groups.name AS group_name,
            students.avg_grade
        FROM students
        INNER JOIN groups
            ON students.group_id = groups.id
        ORDER BY groups.name, students.name
    `).all();

    printResults('INNER JOIN - студенты и их группы:', innerJoin);

    // LEFT JOIN - все группы, даже без студентов
    const leftJoin = db.prepare(`
        SELECT
            groups.id,
            groups.name AS group_name,
            students.name AS student_name,
            students.avg_grade
        FROM groups
        LEFT JOIN students
            ON groups.id = students.group_id
        ORDER BY groups.id, students.name
    `).all();

    printResults('LEFT JOIN - все группы и их студенты:', leftJoin);

    // Проверка внешнего ключа
    console.log('\nПроверка ограничения FOREIGN KEY:');

    try {
        db.prepare(`
            INSERT INTO students (name, group_id, avg_grade)
            VALUES (?, ?, ?)
        `).run('Тестовый студент', 999, 4.5);
    } catch (error) {
        console.log('Внешний ключ работает:');
        console.log(error.message);
    }
}

// Подзапросы
function performSubqueryOperations() {
    printSection('6. ПОДЗАПРОСЫ SQL');

    // Поиск студентов, чей балл выше общего среднего
    const aboveAverage = db.prepare(`
        SELECT
            name,
            avg_grade
        FROM students
        WHERE avg_grade > (
            SELECT AVG(avg_grade)
            FROM students
        )
        ORDER BY avg_grade DESC
    `).all();

    printResults(
        'Студенты со средним баллом выше общего среднего:',
        aboveAverage
    );
}

// Транзакции
function performTransactionOperations() {
    printSection('7. ТРАНЗАКЦИИ');

    // Транзакция с подтверждением изменений
    const commitTransaction = db.transaction(() => {
        // Устанавливаем фиксированные значения, чтобы повторный запуск
        // программы не приводил к превышению допустимой оценки
        db.prepare(`
            UPDATE students
            SET avg_grade = 5.0
            WHERE id = 2
        `).run();

        db.prepare(`
            UPDATE students
            SET avg_grade = 3.9
            WHERE id = 3
        `).run();
    });

    try {
        commitTransaction();

        console.log('Транзакция COMMIT выполнена успешно.');
        console.log('Оценки студентов обновлены.');
    } catch (error) {
        console.log('Ошибка при выполнении COMMIT:', error.message);
    }

    // Транзакция с принудительным откатом изменений
    const rollbackTransaction = db.transaction(() => {
        // Временная запись для проверки механизма ROLLBACK
        db.prepare(`
            INSERT INTO students (name, group_id, avg_grade)
            VALUES (?, ?, ?)
        `).run('Тестовый студент', 7, 4.5);

        // Искусственно вызываем ошибку для демонстрации отката
        throw new Error('Тестовая ошибка для проверки ROLLBACK');
    });

    try {
        rollbackTransaction();
    } catch (error) {
        console.log('Транзакция ROLLBACK выполнена.');
        console.log('Причина отката:', error.message);
    }

    // Проверяем, что временная запись не сохранилась
    const testStudent = db.prepare(`
        SELECT *
        FROM students
        WHERE name = ?
    `).get('Тестовый студент');

    if (!testStudent) {
        console.log('Проверка успешна: тестовая запись отсутствует.');
    } else {
        console.log('Внимание: тестовая запись осталась в базе данных.');
    }
}

// Проверка индексов
function performIndexOperations() {
    printSection('8. ИНДЕКСЫ');

    // Просмотр созданных индексов
    const indexes = db.prepare(`
        PRAGMA index_list('students')
    `).all();

    printResults('Индексы таблицы students:', indexes);

    // Анализ плана выполнения запроса
    const queryPlan = db.prepare(`
        EXPLAIN QUERY PLAN
        SELECT * FROM students
        WHERE group_id = ?
    `).all(2);

    printResults('План выполнения запроса:', queryPlan);
}

// Главная функция программы
function main() {
    try {
        initializeDatabase();

        performCrudOperations();
        performFilteringOperations();
        performAggregateOperations();
        performGroupingOperations();
        performJoinOperations();
        performSubqueryOperations();
        performTransactionOperations();
        performIndexOperations();

        printSection('РАБОТА ПРОГРАММЫ ЗАВЕРШЕНА');

        const finalCount = db.prepare(`
            SELECT COUNT(*) AS count FROM students
        `).get();

        console.log(`Всего студентов в базе: ${finalCount.count}`);
        console.log('Все SQL-запросы выполнены.');

    } catch (error) {
        console.error('\nОшибка выполнения программы:');
        console.error(error.message);
        process.exitCode = 1;

    } finally {
        db.close();
        console.log('\nСоединение с базой данных закрыто.');
    }
}

// Запуск программы
main();
