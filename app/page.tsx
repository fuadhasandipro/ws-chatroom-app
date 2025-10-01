'use client';

import { useState, useEffect, useRef } from 'react';
import { sendMessage } from './actions';

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
}

interface TypingIndicator {
  sender: string;
  timestamp: number;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [username, setUsername] = useState('');
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  useEffect(() => {
    // Initialize audio
    audioRef.current = new Audio('/text.mp3');
  }, []);

  useEffect(() => {
    if (!isUsernameSet) return;

    // Connect to WebSocket server
    const ws = new WebSocket('ws://localhost:3001');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to WebSocket server');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'message') {
        const message = data.payload;
        // Only play sound if message is from someone else
        if (message.sender !== username) {
          audioRef.current?.play().catch(err => console.log('Audio play failed:', err));
        }
        setMessages((prev) => [...prev, message]);
      } else if (data.type === 'typing') {
        const typingData: TypingIndicator = data.payload;
        if (typingData.sender !== username) {
          setTypingUsers((prev) => {
            if (!prev.includes(typingData.sender)) {
              return [...prev, typingData.sender];
            }
            return prev;
          });

          // Remove typing indicator after 2 seconds
          setTimeout(() => {
            setTypingUsers((prev) => prev.filter(u => u !== typingData.sender));
          }, 2000);
        }
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('Disconnected from WebSocket server');
    };

    return () => {
      ws.close();
    };
  }, [isUsernameSet, username]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);

    // Send typing indicator
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        payload: {
          sender: username,
          timestamp: Date.now()
        }
      }));
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      text: input,
      sender: username,
      timestamp: new Date(),
    };

    // Send via WebSocket
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        payload: message
      }));
    }

    // Also save via server action
    await sendMessage(message);

    setInput('');
  };

  const handleSetUsername = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      setIsUsernameSet(true);
    }
  };

  if (!isUsernameSet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/20">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Welcome</h1>
            <p className="text-blue-200">Enter your name to start chatting</p>
          </div>
          <form onSubmit={handleSetUsername} className="space-y-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your name"
              className="w-full px-6 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
            />
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-4 rounded-2xl font-semibold hover:from-purple-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Start Chatting
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto h-screen flex flex-col py-4">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-t-3xl p-6 border border-white/20 border-b-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Chat Room</h2>
                <p className="text-sm text-blue-200">Logged in as {username}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-300">Online</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 bg-white/5 backdrop-blur-lg p-6 overflow-y-auto border-x border-white/20">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === username ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-6 py-3 rounded-2xl shadow-lg ${message.sender === username
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-br-none'
                      : 'bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-bl-none'
                    }`}
                >
                  <p className="text-xs font-semibold mb-1 opacity-80">
                    {message.sender}
                  </p>
                  <p className="break-words">{message.text}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <div className="flex justify-start">
                <div className="bg-white/10 backdrop-blur-sm text-white border border-white/20 px-6 py-3 rounded-2xl rounded-bl-none shadow-lg">
                  <p className="text-xs font-semibold mb-1 opacity-80">
                    {typingUsers.join(', ')}
                  </p>
                  <div className="flex items-center space-x-1">
                    <span className="text-sm">typing</span>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="bg-white/10 backdrop-blur-lg rounded-b-3xl p-6 border border-white/20 border-t-0">
          <form onSubmit={handleSendMessage} className="flex space-x-3">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Type your message..."
              className="flex-1 px-6 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
            />
            <button
              type="submit"
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-2xl font-semibold hover:from-purple-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
