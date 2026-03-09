import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Plus, Pin, Trash2, MoreVertical, Palette } from 'lucide-react';
import { format } from 'date-fns';

interface Note {
  id: number;
  title: string;
  content: string;
  color: string;
  is_pinned: boolean;
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
  const { token } = useAuthStore();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newColor, setNewColor] = useState('#ffffff');
  const [newIsPinned, setNewIsPinned] = useState(false);

  useEffect(() => {
    fetch('/api/notes', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setNotes(data));
  }, [token]);

  const handleCreate = async () => {
    if (!newTitle.trim() && !newContent.trim()) {
      setIsCreating(false);
      return;
    }

    const res = await fetch('/api/notes', {
      method: 'POST',
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
    
    const newNote = await res.json();
    setNotes([newNote, ...notes].sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned)));
    
    setIsCreating(false);
    setNewTitle('');
    setNewContent('');
    setNewColor('#ffffff');
    setNewIsPinned(false);
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/notes/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    setNotes(notes.filter(n => n.id !== id));
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
                  className={`p-2 rounded-full transition-colors ${newIsPinned ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:bg-black/5'}`}
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
                    className={`w-6 h-6 rounded-full border-2 ${newColor === c ? 'border-indigo-600' : 'border-transparent hover:border-black/20'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <button 
                onClick={handleCreate}
                className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
              >
                Fechar
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
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
        {notes.map(note => (
          <div 
            key={note.id} 
            className="break-inside-avoid rounded-2xl border border-slate-200 shadow-sm p-5 group relative hover:shadow-md transition-shadow"
            style={{ backgroundColor: note.color }}
          >
            {note.is_pinned && (
              <div className="absolute top-4 right-4 text-indigo-600">
                <Pin className="w-4 h-4" />
              </div>
            )}
            
            {note.title && <h3 className="font-bold text-slate-900 mb-2 pr-6">{note.title}</h3>}
            {note.content && <p className="text-slate-700 text-sm whitespace-pre-wrap">{note.content}</p>}
            
            <div className="mt-4 pt-4 border-t border-black/5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs text-slate-500 font-medium">
                {format(new Date(note.created_at), 'dd/MM/yyyy')}
              </span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => handleDelete(note.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
