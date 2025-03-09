import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";

const socket = io(import.meta.env.VITE_BACKEND_URL);

function Chat() {
  const [nickname, setNickname] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket.on("message", (msg) => {
      setMessages((prev) => [...prev, msg]);
      setIsTyping(false);
    });

    // socket.on('typing', (user) => {
    //   setIsTyping(user);
    // });

    socket.on("userCount", (users) => {
      console.log(users);
      setOnlineUsers(users);
    });

    return () => {
      socket.off("message");
      //socket.off('typing');
      socket.off("userCount");
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (nickname && message) {
      socket.emit("message", {
        nickname,
        message,
        timestamp: new Date().toISOString(),
      });
      setMessage("");
    } else if (!nickname) {
      alert("Please enter a nickname");
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    if (nickname) {
      socket.emit("typing", nickname);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow h-full flex flex-col">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Chat</h2>

      <div className="flex space-x-4 mb-6">
        <input
          type="text"
          placeholder="Your nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="w-48 bg-white rounded-lg border border-gray-200">
          <div className="p-2 bg-gray-50 border-b border-gray-200 font-semibold text-gray-700">
            Online Users
          </div>
          <div className="p-2 max-h-32 overflow-y-auto">
            <div className="text-gray-500 text-sm">{onlineUsers}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-lg border border-gray-200 mb-6 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.nickname === nickname ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs md:max-w-md rounded-lg px-4 py-2 ${
                  msg.nickname === nickname
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                <div className="font-semibold">
                  {msg.nickname === nickname ? "You" : msg.nickname}
                </div>
                <div>{msg.message}</div>
                <div className="text-xs opacity-75 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="text-gray-500 italic text-sm">
              {isTyping} is typing...
            </div>
          )}
          <div ref={messagesEndRef}></div>
        </div>

        <div className="border-t border-gray-200 p-2">
          <div className="flex">
            <textarea
              placeholder="Type a message..."
              value={message}
              onChange={handleTyping}
              onKeyPress={handleKeyPress}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="2"
            />
            <button
              onClick={handleSend}
              disabled={!nickname || !message}
              className={`px-4 py-2 rounded-r-lg text-white transition-colors duration-200 ${
                !nickname || !message
                  ? "bg-blue-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;
