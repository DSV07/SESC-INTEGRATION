import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Plus, CheckCircle2, Circle, Trash2, Calendar as CalendarIcon, Clock, MoreVertical, Share2, Users, Edit3 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { clsx } from 'clsx';

interface Task {
  id: number;
  title: string;
  description: string;
  status: 'PENDING' | 'COMPLETED';
  due_date: string | null;
  user_id: number;
  user?: { name: string; avatar: string };
  shares?: { permission: string }[];
  created_at: string;
}

export default function Planner() {
  const { token } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [sharingId, setSharingId] = useState<number | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState<'VIEW' | 'EDIT'>('VIEW');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/planner', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [token]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsActionLoading(true);
    try {
      const method = editingTask ? 'PATCH' : 'POST';
      const url = editingTask ? `/api/planner/${editingTask.id}` : '/api/planner';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          title: newTitle, 
          description: newDescription, 
          due_date: newDueDate || null 
        })
      });
      
      if (res.ok) {
        await fetchTasks();
        setIsCreating(false);
        setEditingTask(null);
        setNewTitle('');
        setNewDescription('');
        setNewDueDate('');
      }
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const startEditing = (task: Task) => {
    setEditingTask(task);
    setNewTitle(task.title);
    setNewDescription(task.description);
    setNewDueDate(task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '');
    setIsCreating(true);
  };

  const toggleStatus = async (task: Task) => {
    const newStatus = task.status === 'PENDING' ? 'COMPLETED' : 'PENDING';
    try {
      const res = await fetch(`/api/planner/${task.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) await fetchTasks();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/planner/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleShare = async () => {
    if (!shareEmail.trim() || !sharingId) return;
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/planner/${sharingId}/share`, {
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
        await fetchTasks(); // Refresh tasks to show new share status
      } else {
        alert('Usuário não encontrado ou erro ao compartilhar.');
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Meu Planejador</h1>
          <p className="text-slate-500 mt-1">Organize suas tarefas e prazos.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-blue-700 text-white text-sm font-bold rounded-xl hover:bg-blue-800 transition-all flex items-center gap-2 shadow-lg shadow-blue-100"
        >
          <Plus className="w-4 h-4" /> Novo Item
        </button>
      </div>

      {isCreating && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-4 duration-200">
          <form onSubmit={handleSave} className="space-y-4">
            <input
              type="text"
              placeholder="O que precisa ser feito?"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="w-full text-lg font-bold text-slate-900 border-none focus:ring-0 p-0 placeholder:text-slate-400"
              autoFocus
              required
            />
            <textarea
              placeholder="Adicionar descrição (opcional)"
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              className="w-full text-slate-600 border-none focus:ring-0 p-0 h-20 resize-none placeholder:text-slate-400"
            />
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 text-slate-500">
                <CalendarIcon className="w-4 h-4" />
                <input
                  type="datetime-local"
                  value={newDueDate}
                  onChange={e => setNewDueDate(e.target.value)}
                  className="text-sm border-slate-200 rounded-lg focus:ring-blue-600 focus:border-blue-600 bg-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingTask(null);
                    setNewTitle('');
                    setNewDescription('');
                    setNewDueDate('');
                  }}
                  className="px-4 py-2 text-slate-600 text-sm font-medium hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                 <button 
                  type="submit"
                  disabled={isActionLoading}
                  className="px-6 py-2 bg-orange-600 text-white text-sm font-bold rounded-xl hover:bg-orange-700 transition-all shadow-md shadow-orange-100 disabled:opacity-50"
                >
                  {isActionLoading ? 'Salvando...' : editingTask ? 'Atualizar' : 'Confirmar'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}      <div className="grid gap-4">
        {isLoading ? (
          [1,2,3].map(i => <div key={i} className="h-24 bg-white border border-slate-100 rounded-2xl animate-pulse"></div>)
        ) : tasks.length > 0 ? tasks.map(task => {
          const isSharedWithMe = task.shares && task.shares.length > 0;
          const myPermission = task.shares?.[0]?.permission;

          return (
            <div 
              key={task.id}
              className={clsx(
                "p-4 bg-white rounded-2xl border transition-all flex items-start gap-4 hover:shadow-md",
                task.status === 'COMPLETED' ? "border-emerald-100 bg-emerald-50/30 opacity-75" : "border-slate-200"
              )}
            >
              <button 
                onClick={() => toggleStatus(task)}
                className={clsx(
                  "mt-1 transition-colors",
                  task.status === 'COMPLETED' ? "text-emerald-500" : "text-slate-400 hover:text-blue-600"
                )}
              >
                {task.status === 'COMPLETED' ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={clsx(
                    "font-bold text-slate-900 truncate",
                    task.status === 'COMPLETED' && "line-through text-slate-500"
                  )}>
                    {task.title}
                  </h3>
                  {isSharedWithMe && (
                    <div className="flex items-center gap-1 text-[10px] font-black text-blue-700 bg-blue-100/50 px-1.5 py-0.5 rounded-md">
                      <Users className="w-2.5 h-2.5" /> {task.user?.name}
                    </div>
                  )}
                </div>
                {task.description && (
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{task.description}</p>
                )}
                <div className="flex items-center gap-4 mt-3">
                  {task.due_date && (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
                      <Clock className="w-3 h-3" />
                      <span>{format(new Date(task.due_date), "dd/MM 'às' HH:mm", { locale: ptBR })}</span>
                    </div>
                  )}
                  <span className="text-[10px] text-slate-400">Criada em {format(new Date(task.created_at), 'dd/MM/yyyy')}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!isSharedWithMe && (
                  <button 
                    onClick={() => setSharingId(task.id)}
                    className="p-2 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                )}
                {(myPermission === 'EDIT' || !isSharedWithMe) && (
                  <>
                    <button 
                      onClick={() => startEditing(task)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Editar"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(task.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        }) : (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <CalendarIcon className="w-12 h-12 text-blue-100 mx-auto mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Nenhuma tarefa no horizonte</p>
            <p className="text-sm text-slate-400 mt-1">Sua produtividade começa com um novo item.</p>
          </div>
        )}
      </div>

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
                    <h2 className="text-xl font-black">Compartilhar Tarefa</h2>
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
