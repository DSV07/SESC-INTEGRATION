import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { Send, Hash, UserCircle, ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';
import { clsx } from 'clsx';

interface Channel {
  id: number;
  name: string;
  description: string;
}

interface Message {
  id: number;
  channel_id: number;
  user_id: number;
  content: string;
  created_at: string;
  user_name: string;
  user_avatar: string | null;
}

export default function Chat() {
  const { user, token } = useAuthStore();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showChannelsOnMobile, setShowChannelsOnMobile] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/channels', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setChannels(data);
        if (data.length > 0) setActiveChannel(data[0]);
      });
  }, [token]);

  useEffect(() => {
    const newSocket = io({
      auth: { token }
    });
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  useEffect(() => {
    if (!activeChannel || !socket) return;

    socket.emit('join_channel', activeChannel.id);
    setIsLoading(true);

    fetch(`/api/channels/${activeChannel.id}/messages`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setMessages(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));

    const handleReceiveMessage = (message: Message) => {
      setMessages(prev => [...prev, message]);
    };

    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.emit('leave_channel', activeChannel.id);
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [activeChannel, socket, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChannel || !socket || !user) return;

    socket.emit('send_message', {
      channel_id: activeChannel.id,
      user_id: user.id,
      content: newMessage
    });

    setNewMessage('');
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
      {/* Sidebar */}
      <div className={clsx(
        "w-full md:w-64 border-r border-slate-200 bg-slate-50 flex flex-col absolute inset-y-0 left-0 z-10 md:static transition-transform",
        activeChannel && !showChannelsOnMobile ? "-translate-x-full md:translate-x-0" : "translate-x-0"
      )}>
        <div className="p-4 border-b border-slate-200 shrink-0">
          <h2 className="font-bold text-slate-900">Canais</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {channels.map(channel => (
            <button
              key={channel.id}
              onClick={() => {
                setActiveChannel(channel);
                setShowChannelsOnMobile(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeChannel?.id === channel.id 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Hash className="w-4 h-4 opacity-70" />
              {channel.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={clsx(
        "flex-1 flex flex-col bg-white w-full",
        !activeChannel || showChannelsOnMobile ? "hidden md:flex" : "flex"
      )}>
        {activeChannel ? (
          <>
            <div className="p-4 border-b border-slate-200 flex items-center gap-2 shrink-0">
              <button 
                className="md:hidden p-1 mr-1 text-slate-500 hover:bg-slate-100 rounded-lg"
                onClick={() => setShowChannelsOnMobile(true)}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <Hash className="w-5 h-5 text-slate-400" />
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 truncate">{activeChannel.name}</h3>
                <p className="text-xs text-slate-500 truncate">{activeChannel.description}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Carregando Conversa...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                   <p className="text-sm">Nenhuma mensagem ainda neste canal.</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.user_id === user?.id;
                  const showHeader = idx === 0 || messages[idx - 1].user_id !== msg.user_id;
                  
                  return (
                    <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                      {showHeader ? (
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                          {msg.user_avatar ? (
                            <img src={msg.user_avatar} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <UserCircle className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                      ) : (
                        <div className="w-8 shrink-0"></div>
                      )}
                      
                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
                        {showHeader && (
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-sm font-medium text-slate-900">{isMe ? 'Você' : msg.user_name}</span>
                            <span className="text-xs text-slate-400">
                              {format(new Date(msg.created_at), 'HH:mm')}
                            </span>
                          </div>
                        )}
                        <div className={`px-4 py-2 rounded-2xl text-sm ${
                          isMe 
                            ? 'bg-blue-600 text-white rounded-tr-none' 
                            : 'bg-slate-100 text-slate-900 rounded-tl-none'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-slate-200 shrink-0">
              <form onSubmit={sendMessage} className="relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Mensagem em #${activeChannel.name}`}
                  className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            Selecione um canal para começar
          </div>
        )}
      </div>
    </div>
  );
}
