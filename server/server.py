from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit
from flask_cors import CORS

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

connected_users = {}

@socketio.on('connect')
def handle_connect():
    print(f"Client connected: {request.sid}")

@socketio.on('disconnect')
def handle_disconnect():
    user = next((username for username, sid in connected_users.items() if sid == request.sid), None)
    if user:
        del connected_users[user]
        emit('user_list', list(connected_users.keys()), broadcast=True)
    print(f"Client disconnected: {request.sid}")
    print(connected_users.keys())

@socketio.on('set_username')
def handle_set_username(username):
    connected_users[username] = request.sid
    emit('user_list', list(connected_users.keys()), broadcast=True)


@socketio.on('message')
def handle_message(message):
    formatted_message = f"{message['username']}: {message['message']}"
    emit('message', formatted_message, broadcast=True)
    print(connected_users.keys())


if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=8080)