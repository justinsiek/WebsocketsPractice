from flask import Flask, render_template
from flask_socketio import SocketIO, emit
from flask_cors import CORS

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

@socketio.on('message')
def handle_message(message):
    formatted_message = f"{message['username']}: {message['message']}"
    emit('message', formatted_message, broadcast=True)


if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=8080)