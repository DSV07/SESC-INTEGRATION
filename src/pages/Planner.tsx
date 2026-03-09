import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Plus, FileText, Folder as FolderIcon, MoreVertical, ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';
import { clsx } from 'clsx';

interface Doc {
  id: number;
  title: string;
  content: string;
  folder: string;
  created_at: string;
}

export default function Planner() {
  const { token } = useAuthStore();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [activeDoc, setActiveDoc] = useState<Doc | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [showDocsOnMobile, setShowDocsOnMobile] = useState(true);

  useEffect(() => {
    fetch('/api/planner', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setDocs(data);
        if (data.length > 0) setActiveDoc(data[0]);
      });
  }, [token]);

  const handleCreate = async () => {
    const res = await fetch('/api/planner', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ title: 'Novo Documento', content: '', folder: 'Geral' })
    });
    const newDoc = await res.json();
    setDocs([newDoc, ...docs]);
    setActiveDoc(newDoc);
    setIsEditing(true);
    setNewTitle(newDoc.title);
    setNewContent(newDoc.content);
  };

  const handleSave = async () => {
    if (!activeDoc) return;
    // Mock save for prototype
    const updatedDoc = { ...activeDoc, title: newTitle, content: newContent };
    setDocs(docs.map(d => d.id === activeDoc.id ? updatedDoc : d));
    setActiveDoc(updatedDoc);
    setIsEditing(false);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
      {/* Sidebar */}
      <div className={clsx(
        "w-full md:w-64 border-r border-slate-200 bg-slate-50 flex flex-col absolute inset-y-0 left-0 z-10 md:static transition-transform",
        activeDoc && !showDocsOnMobile ? "-translate-x-full md:translate-x-0" : "translate-x-0"
      )}>
        <div className="p-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <h2 className="font-bold text-slate-900">Documentos</h2>
          <button onClick={handleCreate} className="p-1 text-slate-500 hover:bg-slate-200 rounded-md transition-colors">
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {docs.map(doc => (
            <button
              key={doc.id}
              onClick={() => {
                setActiveDoc(doc);
                setIsEditing(false);
                setShowDocsOnMobile(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeDoc?.id === doc.id 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-4 h-4 opacity-70" />
              <span className="truncate">{doc.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className={clsx(
        "flex-1 flex flex-col bg-white w-full",
        !activeDoc || showDocsOnMobile ? "hidden md:flex" : "flex"
      )}>
        {activeDoc ? (
          <>
            <div className="p-4 md:p-6 border-b border-slate-200 flex items-center justify-between shrink-0 gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <button 
                  className="md:hidden p-1 text-slate-500 hover:bg-slate-100 rounded-lg shrink-0"
                  onClick={() => setShowDocsOnMobile(true)}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {isEditing ? (
                  <input
                    type="text"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    className="text-xl md:text-2xl font-bold text-slate-900 bg-transparent border-none focus:outline-none focus:ring-0 w-full truncate"
                    autoFocus
                  />
                ) : (
                  <h1 className="text-xl md:text-2xl font-bold text-slate-900 truncate">{activeDoc.title}</h1>
                )}
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                {isEditing ? (
                  <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                    Salvar
                  </button>
                ) : (
                  <button onClick={() => {
                    setIsEditing(true);
                    setNewTitle(activeDoc.title);
                    setNewContent(activeDoc.content);
                  }} className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors">
                    Editar
                  </button>
                )}
                <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {isEditing ? (
                <textarea
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  placeholder="Comece a digitar..."
                  className="w-full h-full resize-none border-none focus:outline-none focus:ring-0 text-slate-700 text-base leading-relaxed"
                />
              ) : (
                <div className="prose prose-slate max-w-none">
                  {activeDoc.content ? (
                    <div dangerouslySetInnerHTML={{ __html: activeDoc.content.replace(/\\n/g, '<br/>') }} />
                  ) : (
                    <p className="text-slate-400 italic">Documento vazio. Clique em editar para adicionar conteúdo.</p>
                  )}
                </div>
              )}
            </div>
            
            <div className="px-4 md:px-6 py-3 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <FolderIcon className="w-4 h-4" />
                {activeDoc.folder}
              </div>
              <span>Criado em {format(new Date(activeDoc.created_at), 'dd/MM/yyyy HH:mm')}</span>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 flex-col gap-4">
            <FileText className="w-12 h-12 text-slate-300" />
            <p>Selecione um documento ou crie um novo</p>
            <button onClick={handleCreate} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" /> Novo Documento
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
