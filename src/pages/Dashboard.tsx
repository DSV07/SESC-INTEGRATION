import { useAuthStore } from '../store/authStore';
import { MessageSquare, Calendar, Folder, StickyNote, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const { user, token } = useAuthStore();
  const [data, setData] = useState({
    stats: { notes: 0, pendingTasks: 0, files: 0 },
    recentActivities: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/dashboard/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const stats = await response.json();
          setData(stats);
        }
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, [token]);

  const statsList = [
    { name: 'Tarefas Ativas', value: data.stats.pendingTasks, icon: Calendar, color: 'text-blue-700', bg: 'bg-blue-50', link: '/planner' },
    { name: 'Arquivos na Rede', value: data.stats.files, icon: Folder, color: 'text-orange-600', bg: 'bg-orange-50', link: '/files' },
    { name: 'Minhas Notas', value: data.stats.notes, icon: StickyNote, color: 'text-emerald-600', bg: 'bg-emerald-50', link: '/notes' },
    { name: 'Canais de Chat', value: 3, icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-50', link: '/chat' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight">Olá, {user?.name.split(' ')[0]}!</h1>
          <p className="text-slate-500 mt-1">Sua central de integração SESC está pronta.</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
           <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
           <span className="text-sm font-bold text-blue-800 uppercase tracking-tighter">Sistema Online</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          [1,2,3,4].map(i => <div key={i} className="h-28 bg-white border border-slate-100 rounded-2xl animate-pulse"></div>)
        ) : (
          statsList.map((stat) => (
            <Link key={stat.name} to={stat.link} className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.name}</p>
                  <p className="text-3xl font-black text-slate-900 mt-1">{stat.value}</p>
                </div>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${stat.bg} ${stat.color}`}>
                  <stat.icon className="w-7 h-7" />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Atividades Recentes</h2>
            <button className="text-sm text-indigo-600 font-medium hover:text-indigo-700">Ver todas</button>
          </div>
          <div className="space-y-4">
            {data.recentActivities.length > 0 ? data.recentActivities.map((activity: any) => (
              <div key={activity.id} className="flex items-start gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{activity.description}</p>
                  <p className="text-xs text-slate-500 mt-1">{new Date(activity.created_at).toLocaleString()}</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-slate-500">Nenhuma atividade recente.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Ações Rápidas</h2>
            <Link to="/planner" className="text-sm text-blue-700 font-bold hover:underline">Novo Evento</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <Link to="/notes" className="group p-5 rounded-2xl border-2 border-slate-50 hover:border-blue-100 hover:bg-blue-50/50 transition-all">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <StickyNote className="w-5 h-5" />
                </div>
                <p className="text-sm font-black text-slate-900 leading-tight">Criar Nota</p>
                <p className="text-xs text-slate-500 mt-1">Anotação rápida e segura</p>
             </Link>
             <Link to="/planner" className="group p-5 rounded-2xl border-2 border-slate-50 hover:border-orange-100 hover:bg-orange-50/50 transition-all">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Calendar className="w-5 h-5" />
                </div>
                <p className="text-sm font-black text-slate-900 leading-tight">Nova Tarefa</p>
                <p className="text-xs text-slate-500 mt-1">Organize seu fluxo SESC</p>
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
