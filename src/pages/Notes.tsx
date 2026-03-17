import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { Plus, Pin, Trash2, MoreVertical, Palette, Share2, Users, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { clsx } from 'clsx';

interface Note {
  id: number;
  title: string;
  content: string;
  color: string;
  is_pinned: boolean;
  user_id: number;
  user?: { name: string; avatar: string };
  shares?: { permission: string }[];
  created_at: string;
}

const colors = [
  '#ffffff', // white
  '#fecaca', // red
  '#fde68a', // yellow
  '#a7f3d0', // green
  '#bfdbfe', // blue
  '#e9d5ff', // purple
];

export default function Notes() {
  const { user, token } = useAuthStore();
  const [notes, setNotes] = useState<Note[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newColor, setNewColor] = useState('#ffffff');
  const [newIsPinned, setNewIsPinned] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [sharingId, setSharingId] = useState<number | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState<'VIEW' | 'EDIT'>('VIEW');

  useEffect(() => {
    setIsLoading(true);
    fetch('/api/notes', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setNotes(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));

    // Configurar Socket
    const newSocket = io({
      auth: { token }
    });
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  useEffect(() => {
    if (!socket || !user) return;

    // Ouvir atualizações de notas próprias
    socket.on(`notes_updated_${user.id}`, (data: { action: string, note?: Note, noteId?: number }) => {
      if (data.action === 'CREATE' && data.note) {
        setNotes(prev => [data.note!, ...prev].sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned)));
      } else if (data.action === 'UPDATE' && data.note) {
        setNotes(prev => prev.map(n => n.id === data.note!.id ? data.note! : n).sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned)));
      } else if (data.action === 'DELETE' && data.noteId) {
        setNotes(prev => prev.filter(n => n.id !== Number(data.noteId)));
      }
    });

    return () => {
      socket.off(`notes_updated_${user.id}`);
    };
  }, [socket, user]);

  const handleSave = async () => {
    if (!newTitle.trim() && !newContent.trim()) {
      setIsCreating(false);
      setEditingNote(null);
      return;
    }

    setIsActionLoading(true);
    const method = editingNote ? 'PATCH' : 'POST';
    const url = editingNote ? `/api/notes/${editingNote.id}` : '/api/notes';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: newTitle,
        content: newContent,
        color: newColor,
        is_pinned: newIsPinned
      })
    });
    
    const savedNote = await res.json();
    
    if (editingNote) {
      setNotes(notes.map(n => n.id === savedNote.id ? savedNote : n).sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned)));
    } else {
      setNotes([savedNote, ...notes].sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned)));
    }
    
    setIsActionLoading(false);
    setIsCreating(false);
    setEditingNote(null);
    setNewTitle('');
    setNewContent('');
    setNewColor('#ffffff');
    setNewIsPinned(false);
  };

  const startEditing = (note: Note) => {
    setEditingNote(note);
    setNewTitle(note.title);
    setNewContent(note.content);
    setNewColor(note.color);
    setNewIsPinned(note.is_pinned);
    setIsCreating(true);
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/notes/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    setNotes(notes.filter(n => n.id !== id));
  };

  const handleShare = async () => {
    if (!shareEmail.trim() || !sharingId) return;
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/notes/${sharingId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email: shareEmail, permission: sharePermission })
      });
      if (res.ok) {
        setSharingId(null);
        setShareEmail('');
      } else {
        alert('Usuário não encontrado ou erro ao compartilhar.');
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Notas Rápidas</h1>
        <p className="text-slate-500 mt-1">Suas ideias, lembretes e tarefas.</p>
      </div>

      {/* Create Note Input */}
      <div className="max-w-2xl mx-auto">
        {isCreating ? (
          <div 
            className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden transition-all"
            style={{ backgroundColor: newColor }}
          >
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  placeholder="Título"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full bg-transparent text-lg font-bold text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-0"
                  autoFocus
                />
                <button 
                  onClick={() => setNewIsPinned(!newIsPinned)}
                  className={clsx(
                    "p-2 rounded-full transition-colors",
                    newIsPinned ? 'text-blue-700 bg-blue-100 shadow-sm' : 'text-slate-400 hover:bg-black/5'
                  )}
                >
                  <Pin className="w-5 h-5" />
                </button>
              </div>
              <textarea
                placeholder="Criar uma nota..."
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                className="w-full bg-transparent resize-none text-slate-700 placeholder-slate-500 focus:outline-none focus:ring-0 min-h-[100px]"
              />
            </div>
            <div className="px-4 py-3 flex items-center justify-between border-t border-black/5">
              <div className="flex items-center gap-1">
                {colors.map(c => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className={clsx(
                      "w-6 h-6 rounded-full border-2 transition-all",
                      newColor === c ? 'border-blue-700 scale-110 shadow-md' : 'border-transparent hover:border-black/20'
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <button 
                onClick={handleSave}
                disabled={isActionLoading}
                className="px-6 py-2 bg-blue-800 text-white text-sm font-black rounded-xl hover:bg-blue-900 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
              >
                {isActionLoading ? 'Salvando...' : editingNote ? 'Atualizar' : 'Fechar'}
              </button>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => setIsCreating(true)}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3 cursor-text hover:shadow-md transition-shadow"
          >
            <Plus className="w-5 h-5 text-slate-400" />
            <span className="text-slate-500 font-medium">Criar uma nota...</span>
          </div>
        )}
      </div>

      {/* Notes Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-48 bg-slate-100 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
           <p className="text-slate-400 font-medium">Nenhuma nota encontrada. Comece criando uma!</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {notes.map(note => {
            const isSharedWithMe = note.shares && note.shares.length > 0;
            const myPermission = note.shares?.[0]?.permission;

            return (
              <div 
                key={note.id} 
                onClick={() => (myPermission === 'EDIT' || !isSharedWithMe) && startEditing(note)}
                className={clsx(
                  "break-inside-avoid rounded-2xl border border-slate-200 shadow-sm p-5 group relative hover:shadow-xl hover:-translate-y-1 transition-all duration-300",
                  (myPermission === 'EDIT' || !isSharedWithMe) ? "cursor-pointer" : "cursor-default"
                )}
                style={{ backgroundColor: note.color }}
              >
                {note.is_pinned && (
                  <div className="absolute top-4 right-4 text-blue-800">
                    <Pin className="w-4 h-4" />
                  </div>
                )}
                
                {note.title && <h3 className="font-bold text-slate-900 mb-2 pr-6 leading-tight">{note.title}</h3>}
                {note.content && <p className="text-slate-700 text-sm whitespace-pre-wrap">{note.content}</p>}
                
                <div className="mt-4 pt-4 border-t border-black/5 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                      {format(new Date(note.created_at), 'dd MMM yyyy')}
                    </span>
                    {isSharedWithMe && (
                      <div className="flex items-center gap-1 mt-1 text-[10px] font-black text-blue-700 bg-blue-100/50 px-1.5 py-0.5 rounded-md">
                        <Users className="w-2.5 h-2.5" /> {note.user?.name} ({myPermission})
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!isSharedWithMe && (
                      <button 
                        onClick={() => setSharingId(note.id)}
                        className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    )}
                    {(myPermission === 'EDIT' || !isSharedWithMe) && (
                      <button 
                        onClick={() => handleDelete(note.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Share Modal */}
      {sharingId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
             <div className="bg-blue-800 p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                    <Share2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black">Compartilhar Nota</h2>
                    <p className="text-blue-100 text-xs font-bold uppercase tracking-widest">Colaboração SESC</p>
                  </div>
                </div>
             </div>
             <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Email do Colaborador</label>
                  <input 
                    type="email"
                    placeholder="exemplo@sesc.com.br"
                    value={shareEmail}
                    onChange={e => setShareEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Permissão</label>
                  <div className="grid grid-cols-2 gap-2">
                     <button 
                        onClick={() => setSharePermission('VIEW')}
                        className={clsx(
                          "py-3 rounded-xl text-sm font-bold border-2 transition-all",
                          sharePermission === 'VIEW' ? "bg-blue-50 border-blue-600 text-blue-700" : "border-slate-100 text-slate-500 hover:bg-slate-50"
                        )}
                     >
                        Visualizar
                     </button>
                     <button 
                        onClick={() => setSharePermission('EDIT')}
                        className={clsx(
                          "py-3 rounded-xl text-sm font-bold border-2 transition-all",
                          sharePermission === 'EDIT' ? "bg-blue-50 border-blue-600 text-blue-700" : "border-slate-100 text-slate-500 hover:bg-slate-50"
                        )}
                     >
                        Editar
                     </button>
                  </div>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                   <button 
                      onClick={handleShare}
                      disabled={isActionLoading}
                      className="w-full py-3 bg-blue-800 text-white font-black rounded-xl hover:bg-blue-900 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
                   >
                      {isActionLoading ? 'Compartilhando...' : 'Convidar Colaborador'}
                   </button>
                   <button 
                      onClick={() => setSharingId(null)}
                      className="w-full py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-all"
                   >
                      Cancelar
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
