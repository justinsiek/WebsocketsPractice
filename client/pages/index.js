import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

function Index() {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [username, setUsername] = useState('');
  const [isUsernameSet, setIsUsernameSet] = useState(false);

  useEffect(() => {
    const newSocket = io('http://172.20.10.2:8080');
    setSocket(newSocket);

    newSocket.on('message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      newSocket.off('message');
      newSocket.close();
    };
  }, []);

  const sendMessage = () => {
    if (inputMessage.trim() !== '' && socket) {
      socket.emit('message', { message: inputMessage, username: username });
      setInputMessage('');
    }
  };

  const setUsernameFn = () => {
    if (username.trim() !== '') {
      setIsUsernameSet(true);
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
    <div className='flex flex-col justify-center items-center h-screen'>
      <div className='w-1/2 h-3/4 border border-gray-300 rounded-lg overflow-y-auto mb-4 p-4'>
        {messages.map((msg, index) => (
          <p key={index}>{msg}</p>
        ))}
      </div>
      <div className='w-1/2 flex'>
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
  );
}

export default Index;