import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

function Index() {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [username, setUsername] = useState('');
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [inviteUsername, setInviteUsername] = useState('');

  useEffect(() => {
    const newSocket = io('http://localhost:8080'); //REMEMBER TO CHANGE THIS WHEN CONNECTING TO INTERNET
    setSocket(newSocket);

    newSocket.on('message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    newSocket.on('user_list', (users) => {
      setConnectedUsers(users);
    });

    newSocket.on('receive_invite', (data) => {
      alert(`You received an invite from ${data.inviter}`);
    });

    newSocket.on('invite_error', (data) => {
      alert(data.message);
    });

    return () => {
      newSocket.off('message');
      newSocket.off('user_list');
      newSocket.off('receive_invite');
      newSocket.off('invite_error');
      newSocket.close();
    };
  }, []);

  const sendMessage = () => {
    if (inputMessage.trim() !== '' && socket && isUsernameSet) {
      socket.emit('message', { message: inputMessage, username: username });
      setInputMessage('');
    }
  };

  const setUsernameFn = () => {
    if (username.trim() !== '' && socket) {
      socket.emit('set_username', username);
      setIsUsernameSet(true);
    }
  };

  const sendInvite = () => {
    if (inviteUsername.trim() !== '' && socket) {
      socket.emit('send_invite', { inviter: username, invitee: inviteUsername });
      setInviteUsername('');
    }
  };

  if (!isUsernameSet) {
    return (
      <div className='flex flex-col justify-center items-center h-screen'>
        <input
          className='border border-gray-400 p-2 rounded-lg mb-2'
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
          onKeyDown={(e) => e.key === 'Enter' && setUsernameFn()}
        />
        <button
          className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg'
          onClick={setUsernameFn}>
          Set Username
        </button>
      </div>
    );
  }

  return (
    <div className='flex justify-center items-center h-screen'>
      <div className='border border-gray-300 rounded-lg overflow-y-auto mr-4 p-4'>
        <h2 className='font-bold mb-2'>Username: {username}</h2>
        <h2 className='font-bold mb-2'>Connected Users:</h2>
        <ul>
          {connectedUsers.map((user, index) => (
            <li key={index}>{user}</li>
          ))}
        </ul>
      </div>
      <div className='w-1/2 flex flex-col h-3/4'>
        <div className='flex-grow border border-gray-300 rounded-lg overflow-y-auto mb-4 p-4'>
          {messages.map((msg, index) => (
            <p key={index}>{msg}</p>
          ))}
        </div>
        <div className='flex mt-4'>
          <input
            className='border border-gray-400 p-2 flex-grow rounded-l-lg'
            type="text"
            value={inviteUsername}
            onChange={(e) => setInviteUsername(e.target.value)}
            placeholder="Enter username to invite..."
            onKeyDown={(e) => e.key === 'Enter' && sendInvite()}
          />
          <button
            className='bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-r-lg'
            onClick={sendInvite}>
            Invite
          </button>
        </div>
        <div className='flex'>
          <input
            className='border border-gray-400 p-2 flex-grow rounded-l-lg'
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button
            className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r-lg'
            onClick={sendMessage}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default Index;