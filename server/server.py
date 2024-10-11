from flask import Flask, request
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
import uuid

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

connected_users = {}
user_rooms = {}
room_users = {}
DEFAULT_ROOM = 'default'

@socketio.on('connect')
def handle_connect():
    print(f"Client connected: {request.sid}")
    join_room(DEFAULT_ROOM)

@socketio.on('disconnect')
def handle_disconnect():
    user = next((username for username, sid in connected_users.items() if sid == request.sid), None)
    if user:
        del connected_users[user]
        if user in user_rooms:
            room = user_rooms[user]
            leave_room(room)
            if room in room_users:
                room_users[room].remove(user)
                if not room_users[room]:
                    del room_users[room]
                else:
                    emit('room_users', list(room_users[room]), room=room)
            del user_rooms[user]
        else:
            leave_room(DEFAULT_ROOM)
        emit('user_list', list(connected_users.keys()), room=DEFAULT_ROOM)
    print(f"Client disconnected: {request.sid}")
    print(connected_users.keys())

@socketio.on('set_username')
def handle_set_username(username):
    connected_users[username] = request.sid
    user_rooms[username] = DEFAULT_ROOM
    if DEFAULT_ROOM not in room_users:
        room_users[DEFAULT_ROOM] = set()
    room_users[DEFAULT_ROOM].add(username)
    emit('user_list', list(room_users[DEFAULT_ROOM]), room=DEFAULT_ROOM)

@socketio.on('message')
def handle_message(message):
    username = message['username']
    room = user_rooms.get(username, DEFAULT_ROOM)
    formatted_message = f"{username}: {message['message']}"
    emit('message', formatted_message, room=room)

@socketio.on('send_invite')
def handle_send_invite(data):
    inviter = data['inviter']
    invitee = data['invitee']
    if invitee in connected_users:
        invitee_sid = connected_users[invitee]
        emit('receive_invite', {'inviter': inviter}, room=invitee_sid)
    else:
        emit('invite_error', {'message': f"User {invitee} not found"}, room=connected_users[inviter])

@socketio.on('invite_response')
def handle_invite_response(data):
    inviter = data['inviter']
    invitee = next((username for username, sid in connected_users.items() if sid == request.sid), None)
    accepted = data['accepted']
    
    if inviter in connected_users:
        inviter_sid = connected_users[inviter]
        if accepted:
            new_room = str(uuid.uuid4())
            
            # Remove inviter from default room
            leave_room(DEFAULT_ROOM, sid=inviter_sid)
            room_users[DEFAULT_ROOM].remove(inviter)
            
            # Remove invitee from default room
            leave_room(DEFAULT_ROOM)
            room_users[DEFAULT_ROOM].remove(invitee)
            
            # Join new room
            join_room(new_room)
            join_room(new_room, sid=inviter_sid)
            
            user_rooms[invitee] = new_room
            user_rooms[inviter] = new_room
            
            room_users[new_room] = {inviter, invitee}
            
            emit('join_room', {'room': new_room}, room=new_room)
            emit('room_users', list(room_users[new_room]), room=new_room)
            emit('user_list', list(room_users[DEFAULT_ROOM]), room=DEFAULT_ROOM)
            
            emit('invite_accepted', {'invitee': invitee, 'room': new_room}, room=inviter_sid)
        else:
            emit('invite_rejected', {'invitee': invitee}, room=inviter_sid)
    else:
        emit('invite_error', {'message': f"Inviter {inviter} not found"}, room=request.sid)

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=8080)
