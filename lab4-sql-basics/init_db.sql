-- Включение проверки внешних ключей
PRAGMA foreign_keys = ON;

-- Удаление таблиц при повторной инициализации
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS groups;

-- Создание таблицы учебных групп
CREATE TABLE groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

-- Создание таблицы студентов
CREATE TABLE students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    group_id INTEGER NOT NULL,
    avg_grade REAL NOT NULL CHECK(avg_grade >= 2.0 AND avg_grade <= 5.0),

    FOREIGN KEY (group_id) REFERENCES groups(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- Создание индекса для ускорения поиска студентов по группе
CREATE INDEX idx_students_group_id
ON students(group_id);

-- Создание индекса для поиска студентов по среднему баллу
CREATE INDEX idx_students_avg_grade
ON students(avg_grade);