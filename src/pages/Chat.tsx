import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { Send, Hash, UserCircle, ChevronLeft, AtSign, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { useSearchParams } from 'react-router-dom';

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
  user_role_tag?: string;
  user_dept_tag?: string;
  user_unit_tag?: string;
}

export default function Chat() {
  const { user, token } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showChannelsOnMobile, setShowChannelsOnMobile] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [highlightedMessageId, setHighlightedMessageId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  useEffect(() => {
    const channelParam = searchParams.get('channel');

    if (channelParam && channels.length > 0) {
      const channel = channels.find(c => c.id === parseInt(channelParam));
      if (channel) {
        setActiveChannel(channel);
        setShowChannelsOnMobile(false);
      }
    }
  }, [searchParams, channels]);

  useEffect(() => {
    const msgParam = searchParams.get('message');
    if (msgParam && !isLoading && messages.length > 0) {
      const msgId = parseInt(msgParam);
      setTimeout(() => {
        messageRefs.current[msgId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedMessageId(msgId);
        setTimeout(() => setHighlightedMessageId(null), 3000);
      }, 500);
    }
  }, [searchParams, isLoading, messages]);

  useEffect(() => {
    fetch('/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setUsers(data));
  }, [token]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewMessage(value);

    const lastAtPos = value.lastIndexOf('@');
    if (lastAtPos !== -1) {
      const query = value.slice(lastAtPos + 1).split(/\s|\n/)[0];
      setMentionQuery(query);
      const filtered = users.filter(u => 
        u.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredUsers(filtered);
      setShowMentionList(filtered.length > 0);
    } else {
      setShowMentionList(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (showMentionList && filteredUsers.length > 0) {
        // Se a lista de menções estiver aberta, seleciona a primeira
        e.preventDefault();
        handleMentionSelect(filteredUsers[0].name);
      } else {
        // Caso contrário, envia a mensagem
        e.preventDefault();
        sendMessage(e as unknown as React.FormEvent);
      }
    }
  };

  const handleMentionSelect = (userName: string) => {
    const lastAtPos = newMessage.lastIndexOf('@');
    const beforeAt = newMessage.slice(0, lastAtPos);
    const afterMention = newMessage.slice(lastAtPos + 1 + mentionQuery.length);
    setNewMessage(`${beforeAt}@${userName} ${afterMention}`);
    setShowMentionList(false);
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChannel || !socket || !user) return;

    socket.emit('send_message', {
      channel_id: activeChannel.id,
      user_id: user.id,
      content: newMessage
    });

    setNewMessage('');
    setShowMentionList(false);
  };

  const renderMessageContent = (content: string) => {
    // Regex para encontrar menções (@Nome)
    // Usamos um Split com captura para manter os delimitadores
    const parts = content.split(/(@[A-Z-a-zÀ-ü\s]+?(?=\s|$))/g);
    
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        const potentialName = part.slice(1).trim();
        const isUserMentioned = users.some(u => u.name === potentialName);
        if (isUserMentioned) {
          return (
            <span key={i} className="font-bold text-blue-100 bg-blue-700/40 px-1 rounded mx-0.5">
              @{potentialName}
            </span>
          );
        }
      }
      return part;
    });
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
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-slate-900 truncate">{activeChannel.name}</h3>
                <p className="text-xs text-slate-500 truncate">{activeChannel.description}</p>
              </div>

              <button 
                onClick={() => {
                  const myMentions = messages.filter(m => m.content.includes(`@${user?.name}`));
                  if (myMentions.length > 0) {
                    const first = myMentions[0];
                    messageRefs.current[first.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setHighlightedMessageId(first.id);
                    setTimeout(() => setHighlightedMessageId(null), 3000);
                  }
                }}
                title="Ver minhas menções"
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <AtSign className="w-5 h-5" />
              </button>
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
                  const isHighlighted = highlightedMessageId === msg.id;
                  
                  return (
                    <div 
                      key={msg.id} 
                      ref={el => messageRefs.current[msg.id] = el}
                      className={clsx(
                        "flex gap-3 transition-all duration-1000 p-2 rounded-xl",
                        isMe ? 'flex-row-reverse' : '',
                        isHighlighted ? 'bg-indigo-50 ring-2 ring-indigo-200' : ''
                      )}
                    >
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
                          <div className="flex flex-wrap items-baseline gap-2 mb-1">
                            <span className="text-sm font-medium text-slate-900">{isMe ? 'Você' : msg.user_name}</span>
                            <div className="flex gap-1 flex-wrap">
                              {msg.user_role_tag && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-bold border border-blue-100">{msg.user_role_tag}</span>}
                              {msg.user_dept_tag && <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full font-bold border border-emerald-100">{msg.user_dept_tag}</span>}
                              {msg.user_unit_tag && <span className="text-[10px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded-full font-bold border border-orange-100">{msg.user_unit_tag}</span>}
                            </div>
                            <span className="text-xs text-slate-400">
                              {format(new Date(msg.created_at), 'HH:mm')}
                            </span>
                          </div>
                        )}
                        <div className={`px-4 py-2 rounded-2xl text-sm leading-relaxed ${
                          isMe 
                            ? 'bg-blue-600 text-white rounded-tr-none' 
                            : 'bg-slate-100 text-slate-900 rounded-tl-none'
                        }`}>
                          {renderMessageContent(msg.content)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-slate-200 shrink-0 relative">
              {showMentionList && (
                <div className="absolute bottom-full left-4 mb-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-20 animate-in slide-in-from-bottom-2 duration-200">
                  <div className="p-2 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Mencionar usuário
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredUsers.map(u => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleMentionSelect(u.name)}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                          {u.avatar ? (
                            <img src={u.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <UserCircle className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                        <span className="text-sm font-medium text-slate-700">{u.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={sendMessage} className="relative">
                <textarea
                  value={newMessage}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={`Mensagem em #${activeChannel.name}`}
                  rows={1}
                  className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium resize-none min-h-[44px] max-h-32"
                  style={{ height: 'auto' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${target.scrollHeight}px`;
                  }}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="absolute right-2 bottom-1.5 p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
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
