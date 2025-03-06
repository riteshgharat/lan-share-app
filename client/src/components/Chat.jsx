import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://192.0.0.8:5000');

function Chat() {
  const [nickname, setNickname] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socket.on('message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    return () => socket.off('message');
  }, []);

  const handleSend = () => {
    if (nickname && message) {
      socket.emit('message', { nickname, message });
      setMessage('');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Chat</h2>
      <input
        type="text"
        placeholder="Your nickname"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        className="w-full p-2 mb-4 border rounded"
      />
      <div className="h-64 overflow-y-auto p-4 bg-white rounded shadow mb-4">
        {messages.map((msg, index) => (
          <div key={index} className="mb-2">
            <strong>{msg.nickname}:</strong> {msg.message}
          </div>
        ))}
      </div>
      <div className="flex">
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 p-2 border rounded-l"
        />
        <button
          onClick={handleSend}
          className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default Chat;
