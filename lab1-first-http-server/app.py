from flask import Flask, jsonify, request
import time

app = Flask(__name__)


# Логирование всех входящих запросов
@app.before_request
def log_request():
    print(
        f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] "
        f"{request.method} {request.path}"
    )


# 1. Текстовый эндпоинт
@app.route('/')
def home():
    return 'Flask-сервер варианта 6 работает!git status'


# 2. Эндпоинт со списком заказов
@app.route('/api/orders')
def orders():
    return jsonify([
        {
            'id': 1,
            'product': 'Ноутбук',
            'status': 'В обработке'
        },
        {
            'id': 2,
            'product': 'Клавиатура',
            'status': 'Доставляется'
        },
        {
            'id': 3,
            'product': 'Мышь',
            'status': 'Доставлен'
        }
    ])


# 3. Эндпоинт со списком клиентов
@app.route('/api/clients')
def clients():
    return jsonify([
        {
            'id': 1,
            'name': 'Иван Иванов'
        },
        {
            'id': 2,
            'name': 'Пётр Петров'
        },
        {
            'id': 3,
            'name': 'Анна Сидорова'
        }
    ])


# 4. Эндпоинт заказа с параметром ID
@app.route('/api/orders/<int:order_id>')
def get_order(order_id):
    return jsonify({
        'requestedId': order_id,
        'status': 'success'
    })


# 5. Обработка несуществующих маршрутов
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Маршрут не найден'
    }), 404


# Запуск сервера
if __name__ == '__main__':
    app.run(port=3000, debug=True)