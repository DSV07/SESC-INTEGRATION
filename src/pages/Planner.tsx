import React, { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { 
  Plus, 
  Trash2, 
  Calendar as CalendarIcon, 
  Clock, 
  MoreVertical, 
  Share2, 
  Users, 
  Edit3,
  Layout,
  Layers,
  ChevronRight,
  ChevronLeft,
  Filter,
  ArrowRight,
  Flag,
  CheckCircle2,
  Circle,
  FolderOpen,
  Settings,
  MoreHorizontal
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface Project {
  id: number;
  name: string;
  description: string | null;
  color: string;
  user_id: number;
  _count?: { tasks: number };
}

interface Task {
  id: number;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  due_date: string | null;
  user_id: number;
  project_id: number | null;
  project?: { name: string; color: string };
  user?: { name: string; avatar: string };
  shares?: { permission: string }[];
  created_at: string;
}

const COLUMNS = [
  { id: 'TODO', title: 'A Fazer', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  { id: 'IN_PROGRESS', title: 'Em Andamento', color: 'bg-blue-50 text-blue-700 border-blue-100' },
  { id: 'REVIEW', title: 'Em Revisão', color: 'bg-amber-50 text-amber-700 border-amber-100' },
  { id: 'DONE', title: 'Concluído', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' }
] as const;

export default function Planner() {
  const { user, token } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  
  // Modals / UI States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isProjectDeleteModalOpen, setIsProjectDeleteModalOpen] = useState(false);
  const [isSharingModalOpen, setIsSharingModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  // Form States
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    due_date: '',
    project_id: '' as string | number,
    priority: 'MEDIUM' as const,
    status: 'TODO' as const
  });

  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    color: '#3b82f6'
  });
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [shareData, setShareData] = useState({
    id: null as number | null,
    type: 'task' as 'task' | 'project',
    email: '',
    permission: 'VIEW' as 'VIEW' | 'EDIT'
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [tasksRes, projectsRes] = await Promise.all([
        fetch(`/api/planner${selectedProjectId ? `?projectId=${selectedProjectId}` : ''}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/projects', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const tasksData = await tasksRes.json();
      const projectsData = await projectsRes.json();

      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token, selectedProjectId]);

  useEffect(() => {
    fetchData();

    const newSocket = io({ auth: { token } });
    setSocket(newSocket);

    return () => { newSocket.disconnect(); };
  }, [token, selectedProjectId]);

  useEffect(() => {
    if (!socket || !user) return;

    socket.on(`tasks_updated_${user.id}`, () => fetchData());
    return () => { socket.off(`tasks_updated_${user.id}`); };
  }, [socket, user, fetchData]);

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;

    setIsActionLoading(true);
    try {
      const isEdit = !!editingTask;
      const url = isEdit ? `/api/planner/${editingTask.id}` : '/api/planner';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...taskForm,
          project_id: taskForm.project_id ? Number(taskForm.project_id) : null
        })
      });

      if (res.ok) {
        setIsTaskModalOpen(false);
        setEditingTask(null);
        setTaskForm({ title: '', description: '', due_date: '', project_id: '', priority: 'MEDIUM', status: 'TODO' });
        fetchData();
      }
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.name.trim()) return;

    setIsActionLoading(true);
    try {
      const isEdit = !!editingProject;
      const url = isEdit ? `/api/projects/${editingProject.id}` : '/api/projects';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(projectForm)
      });

      if (res.ok) {
        setIsProjectModalOpen(false);
        setEditingProject(null);
        setProjectForm({ name: '', description: '', color: '#3b82f6' });
        fetchData();
      }
    } catch (error) {
      console.error('Erro ao salvar projeto:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const deleteProject = async () => {
    if (!projectToDelete) return;
    
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        if (selectedProjectId === projectToDelete.id) setSelectedProjectId(null);
        setIsProjectDeleteModalOpen(false);
        setProjectToDelete(null);
        fetchData();
      }
    } catch (error) {
      console.error('Erro ao excluir projeto:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: number, newStatus: Task['status']) => {
    try {
      await fetch(`/api/planner/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      fetchData();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const deleteTask = async (id: number) => {
    if (!confirm('Deseja excluir esta tarefa?')) return;
    try {
      await fetch(`/api/planner/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
    }
  };

  const handleShare = async () => {
    if (!shareData.email.trim() || !shareData.id) return;
    setIsActionLoading(true);
    try {
      const endpoint = shareData.type === 'task' ? `/api/planner/${shareData.id}/share` : `/api/projects/${shareData.id}/share`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email: shareData.email, permission: shareData.permission })
      });

      if (res.ok) {
        setIsSharingModalOpen(false);
        setShareData(prev => ({ ...prev, email: '', id: null }));
        fetchData();
      } else {
        alert('Usuário não encontrado.');
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'HIGH': return 'border-red-500 text-red-600 bg-red-50';
      case 'MEDIUM': return 'border-orange-500 text-orange-600 bg-orange-50';
      case 'LOW': return 'border-blue-500 text-blue-600 bg-blue-50';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] gap-6">
      {/* Header com Workspace Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl shadow-slate-200">
            <Layout className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Workspace de Demandas</h1>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
              <span>Projetos SESC</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-blue-600">{selectedProjectId ? projects.find(p => p.id === selectedProjectId)?.name : 'Visão Geral'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsProjectModalOpen(true)}
              className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Novo Projeto
            </button>
            <button 
              onClick={() => {
                  setEditingTask(null);
                  setTaskForm({ title: '', description: '', due_date: '', project_id: selectedProjectId || '', priority: 'MEDIUM', status: 'TODO' });
                  setIsTaskModalOpen(true)
              }}
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-100"
            >
              <Plus className="w-4 h-4" /> Nova Tarefa
            </button>
        </div>
      </div>

      {/* Seletor de Projetos Mobile (H-Scroll) */}
      <div className="lg:hidden -mx-4 px-4 pb-2 overflow-x-auto no-scrollbar flex items-center gap-2">
        <button 
          onClick={() => setSelectedProjectId(null)}
          className={clsx(
            "shrink-0 px-4 py-2 rounded-xl font-bold text-xs transition-all border",
            selectedProjectId === null 
              ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200" 
              : "bg-white text-slate-500 border-slate-200"
          )}
        >
          Visão Geral
        </button>
        {projects.map(project => (
          <div key={project.id} className="shrink-0 flex items-center gap-1">
            <button 
              onClick={() => setSelectedProjectId(project.id)}
              className={clsx(
                "px-4 py-2 rounded-xl font-bold text-xs transition-all border flex items-center gap-2",
                selectedProjectId === project.id 
                  ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100" 
                  : "bg-white text-slate-500 border-slate-200"
              )}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: project.id === selectedProjectId ? 'white' : project.color }} />
              {project.name}
            </button>
            
            {selectedProjectId === project.id && project.user_id === user?.id && (
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 animate-in slide-in-from-left-2 fade-in duration-200">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingProject(project);
                    setProjectForm({ name: project.name, description: project.description || '', color: project.color });
                    setIsProjectModalOpen(true);
                  }}
                  className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setProjectToDelete(project);
                    setIsProjectDeleteModalOpen(true);
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
        <button 
          onClick={() => setIsProjectModalOpen(true)}
          className="shrink-0 w-9 h-9 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-xl"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex h-full gap-6 overflow-hidden">
        {/* Sidebar de Projetos */}
        <div className="hidden lg:flex flex-col w-64 bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Seus Projetos</h3>
            <FolderOpen className="w-4 h-4 text-slate-300" />
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
            <button 
              onClick={() => setSelectedProjectId(null)}
              className={clsx(
                "w-full flex items-center justify-between p-3 rounded-2xl transition-all font-bold text-sm group",
                selectedProjectId === null ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-slate-400" />
                Visão Geral
              </div>
              <span className="text-[10px] bg-white px-2 py-0.5 rounded-lg shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                {tasks.length}
              </span>
            </button>
            
            {projects.map(project => (
              <div key={project.id} className="group/project relative">
                <button 
                  onClick={() => setSelectedProjectId(project.id)}
                  className={clsx(
                    "w-full flex items-center justify-between p-3 rounded-2xl transition-all font-bold text-sm",
                    selectedProjectId === project.id ? "bg-blue-50 text-blue-800" : "text-slate-500 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
                    <span className="truncate">{project.name}</span>
                  </div>
                  {project._count && (
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded-lg shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                      {project._count.tasks}
                    </span>
                  )}
                </button>
                
                {project.user_id === user?.id && (
                  <div className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/project:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingProject(project);
                        setProjectForm({ name: project.name, description: project.description || '', color: project.color });
                        setIsProjectModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setProjectToDelete(project);
                        setIsProjectDeleteModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-6 border-t border-slate-100">
             <button 
              onClick={() => setIsSharingModalOpen(true)}
              className="w-full flex items-center gap-3 p-3 text-slate-500 hover:text-blue-600 transition-colors font-bold text-xs uppercase tracking-widest"
             >
                <Users className="w-4 h-4" />
                Membros da Rede
             </button>
          </div>
        </div>

        {/* Kanban Board Area */}
        <div className="flex-1 flex gap-6 overflow-x-auto pb-4 custom-scrollbar items-start">
          <AnimatePresence mode="popLayout">
            {COLUMNS.map(column => (
              <div key={column.id} className="min-w-[320px] max-w-[320px] flex flex-col h-full bg-slate-100/30 rounded-[2rem] border border-slate-200/50 p-2">
                 <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <div className={clsx("w-2 h-2 rounded-full", column.id === 'DONE' ? 'bg-emerald-500' : column.id === 'IN_PROGRESS' ? 'bg-blue-500' : column.id === 'REVIEW' ? 'bg-amber-500' : 'bg-slate-400')} />
                       <h3 className="text-sm font-black text-slate-900">{column.title}</h3>
                       <span className="text-[10px] font-black text-slate-400 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                          {tasks.filter(t => t.status === column.id).length}
                       </span>
                    </div>
                    <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white transition-all">
                       <Plus className="w-4 h-4" onClick={() => {
                          setTaskForm(prev => ({ ...prev, status: column.id, project_id: selectedProjectId || '' }));
                          setIsTaskModalOpen(true);
                       }} />
                    </button>
                 </div>

                 <div className="flex-1 flex flex-col gap-3 p-2 overflow-y-auto custom-scrollbar">
                    {tasks.filter(t => t.status === column.id).map(task => (
                      <motion.div 
                        layout
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative"
                      >
                         <div className="flex justify-between items-start gap-2 mb-2">
                            <span className={clsx(
                              "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                              getPriorityColor(task.priority)
                            )}>
                               {task.priority === 'HIGH' ? 'Urgente' : task.priority === 'MEDIUM' ? 'Normal' : 'Baixa'}
                            </span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button 
                                onClick={() => {
                                  setEditingTask(task);
                                  setTaskForm({
                                    title: task.title,
                                    description: task.description || '',
                                    due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '',
                                    project_id: task.project_id || '',
                                    priority: task.priority,
                                    status: task.status
                                  });
                                  setIsTaskModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                               >
                                  <Edit3 className="w-3.5 h-3.5" />
                               </button>
                               <button 
                                onClick={() => deleteTask(task.id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                               >
                                  <Trash2 className="w-3.5 h-3.5" />
                               </button>
                            </div>
                         </div>
                         
                         <h4 className="text-sm font-bold text-slate-900 mb-1 line-clamp-2">{task.title}</h4>
                         {task.description && (
                            <p className="text-[11px] text-slate-500 mb-4 line-clamp-2 font-medium">{task.description}</p>
                         )}

                         <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                            <div className="flex -space-x-2">
                               {task.shares && task.shares.length > 0 ? (
                                  <div className="w-6 h-6 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center">
                                     <Users className="w-3 h-3 text-blue-600" />
                                  </div>
                               ) : (
                                  <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center">
                                     <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                                  </div>
                               )}
                            </div>

                            <div className="flex items-center gap-3">
                               {task.due_date && (
                                  <div className={clsx(
                                    "flex items-center gap-1 text-[9px] font-black",
                                    new Date(task.due_date) < new Date() && task.status !== 'DONE' ? "text-red-500" : "text-slate-400"
                                  )}>
                                     <Clock className="w-3 h-3" />
                                     {format(new Date(task.due_date), "dd/MM")}
                                  </div>
                               )}
                               
                               <div className="flex items-center gap-1">
                                  {column.id !== 'TODO' && (
                                    <button 
                                      onClick={() => updateTaskStatus(task.id, COLUMNS[COLUMNS.findIndex(c => c.id === column.id) - 1].id as any)}
                                      className="p-1 text-slate-300 hover:text-slate-600"
                                    >
                                       <ChevronLeft className="w-4 h-4" />
                                    </button>
                                  )}
                                  {column.id !== 'DONE' && (
                                    <button 
                                      onClick={() => updateTaskStatus(task.id, COLUMNS[COLUMNS.findIndex(c => c.id === column.id) + 1].id as any)}
                                      className="p-1 text-slate-300 hover:text-slate-600"
                                    >
                                       <ChevronRight className="w-4 h-4" />
                                    </button>
                                  )}
                               </div>
                            </div>
                         </div>
                      </motion.div>
                    ))}
                    
                    {tasks.filter(t => t.status === column.id).length === 0 && (
                       <div className="flex-1 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-8 text-center opacity-50">
                          <Plus className="w-8 h-8 text-slate-300 mb-2" />
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Soltar demanda aqui</p>
                       </div>
                    )}
                 </div>
              </div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Modals Implementations */}
      {/* 1. Task Modal */}
      <AnimatePresence>
        {isTaskModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden"
            >
               <form onSubmit={handleSaveTask}>
                  <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-4 mb-6">
                       <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                          <Plus className="w-6 h-6" />
                       </div>
                       <div>
                          <h2 className="text-xl font-black text-slate-900">{editingTask ? 'Editar Tarefa' : 'Nova Demanda'}</h2>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Workspace de Planejamento</p>
                       </div>
                    </div>
                    
                    <div className="space-y-4">
                       <input 
                          type="text" 
                          placeholder="Título da Tarefa"
                          className="w-full text-2xl font-black text-slate-900 border-none focus:ring-0 p-0 placeholder:text-slate-200"
                          value={taskForm.title}
                          onChange={e => setTaskForm({...taskForm, title: e.target.value})}
                          required
                       />
                       <textarea 
                          placeholder="Detalhes e objetivos da demanda..."
                          className="w-full border-none focus:ring-0 p-0 text-slate-500 font-medium min-h-[100px] resize-none placeholder:text-slate-300"
                          value={taskForm.description}
                          onChange={e => setTaskForm({...taskForm, description: e.target.value})}
                       />
                    </div>
                  </div>

                  <div className="p-8 space-y-6">
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Pilar / Projeto</label>
                           <select 
                              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none"
                              value={taskForm.project_id}
                              onChange={e => setTaskForm({...taskForm, project_id: e.target.value})}
                           >
                              <option value="">Nenhum</option>
                              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                           </select>
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Prioridade</label>
                           <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                              {(['LOW', 'MEDIUM', 'HIGH'] as const).map(p => (
                                <button 
                                  key={p}
                                  type="button"
                                  onClick={() => setTaskForm({...taskForm, priority: p})}
                                  className={clsx(
                                    "flex-1 py-2 text-[10px] font-black rounded-lg transition-all",
                                    taskForm.priority === p ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:bg-white/50"
                                  )}
                                >
                                  {p}
                                </button>
                              ))}
                           </div>
                        </div>
                     </div>

                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Data de Entrega</label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                              type="datetime-local" 
                              className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-slate-700 outline-none"
                              value={taskForm.due_date}
                              onChange={e => setTaskForm({...taskForm, due_date: e.target.value})}
                            />
                        </div>
                     </div>
                  </div>

                  <div className="p-8 bg-slate-50 flex gap-4">
                     <button 
                        type="button"
                        onClick={() => setIsTaskModalOpen(false)}
                        className="flex-1 py-4 text-slate-500 font-bold hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-200"
                     >
                        Cancelar
                     </button>
                     <button 
                        type="submit"
                        disabled={isActionLoading}
                        className="flex-1 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
                     >
                        {isActionLoading ? 'Salvando...' : 'Finalizar Demanda'}
                     </button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Project Modal */}
      <AnimatePresence>
        {isProjectModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl overflow-hidden"
            >
               <form onSubmit={handleSaveProject}>
                  <div className="p-8 text-center border-b border-slate-50">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                        <FolderOpen className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-black text-slate-900">{editingProject ? 'Editar Projeto' : 'Novo Projeto'}</h2>
                    <p className="text-xs text-slate-400 font-bold mt-1">{editingProject ? 'Atualize as informações do pilar.' : 'Defina um novo pilar de trabalho.'}</p>
                  </div>
                  
                  <div className="p-8 space-y-4">
                    <input 
                      type="text" 
                      placeholder="Nome do Projeto"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-600"
                      value={projectForm.name}
                      onChange={e => setProjectForm({...projectForm, name: e.target.value})}
                      required
                    />
                    <input 
                      type="color" 
                      className="w-full h-12 bg-white border border-slate-100 rounded-xl cursor-pointer"
                      value={projectForm.color}
                      onChange={e => setProjectForm({...projectForm, color: e.target.value})}
                    />
                  </div>

                  <div className="p-8 bg-slate-50 flex flex-col gap-2">
                     <button 
                        type="submit"
                        disabled={isActionLoading}
                        className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                     >
                        {editingProject ? 'Salvar Alterações' : 'Criar Projeto'}
                     </button>
                     <button 
                        type="button"
                        onClick={() => {
                          setIsProjectModalOpen(false);
                          setEditingProject(null);
                          setProjectForm({ name: '', description: '', color: '#3b82f6' });
                        }}
                        className="w-full py-3 text-slate-500 font-bold hover:bg-white rounded-xl transition-all"
                     >
                        Cancelar
                     </button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* 3. Project Delete Confirmation Modal */}
      <AnimatePresence>
        {isProjectDeleteModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl overflow-hidden"
            >
               <div className="p-8 text-center border-b border-slate-50">
                  <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trash2 className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900">Excluir Projeto?</h2>
                  <p className="text-xs text-slate-400 font-bold mt-2 leading-relaxed px-4">
                    Isso removerá permanentemente o projeto <span className="text-red-600">"{projectToDelete?.name}"</span> e todas as suas tarefas. 
                    Esta ação não pode ser desfeita.
                  </p>
               </div>
               
               <div className="p-8 bg-slate-50 flex flex-col gap-2">
                  <button 
                    onClick={deleteProject}
                    disabled={isActionLoading}
                    className="w-full py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-100 flex items-center justify-center gap-2"
                  >
                    {isActionLoading ? 'Excluindo...' : 'Sim, Excluir Projeto'}
                  </button>
                  <button 
                    onClick={() => {
                      setIsProjectDeleteModalOpen(false);
                      setProjectToDelete(null);
                    }}
                    disabled={isActionLoading}
                    className="w-full py-3 text-slate-500 font-bold hover:bg-white rounded-xl transition-all"
                  >
                    Não, Manter Projeto
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSharingModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden"
            >
               <div className="p-8 bg-slate-900 text-white">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                        <Users className="w-6 h-6" />
                     </div>
                     <div>
                        <h2 className="text-xl font-black">Compartilhamento</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Colaboração em Rede</p>
                     </div>
                  </div>
               </div>
               
               <div className="p-8 space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Email do Colaborador</label>
                    <input 
                      type="email" 
                      placeholder="colaborador@sesc.com.br"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-900 outline-none"
                      value={shareData.email}
                      onChange={e => setShareData({...shareData, email: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">O que compartilhar?</label>
                        <select 
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700"
                          value={shareData.type}
                          onChange={e => setShareData({...shareData, type: e.target.value as any, id: null })}
                        >
                           <option value="project">Projeto</option>
                           <option value="task">Tarefa Individual</option>
                        </select>
                     </div>
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Item Específico</label>
                        <select 
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700"
                          value={shareData.id || ''}
                          onChange={e => setShareData({...shareData, id: Number(e.target.value) })}
                        >
                           <option value="">Selecione...</option>
                           {shareData.type === 'project' 
                             ? projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)
                             : tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)
                           }
                        </select>
                     </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                     <p className="text-[10px] text-blue-700 font-bold leading-relaxed">
                        Ao compartilhar um projeto, o colaborador terá acesso a todas as demandas contidas nele.
                     </p>
                  </div>

                  <div className="flex flex-col gap-2">
                     <button 
                        onClick={handleShare}
                        disabled={isActionLoading}
                        className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                     >
                        {isActionLoading ? 'Processando...' : 'Convidar para Workspace'}
                     </button>
                     <button 
                        onClick={() => setIsSharingModalOpen(false)}
                        className="w-full py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-all"
                     >
                        Fechar
                     </button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
