import { useAuthStore } from '../store/authStore';
import { MessageSquare, Calendar, Folder, StickyNote, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuthStore();

  const stats = [
    { name: 'Mensagens Não Lidas', value: '3', icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-100', link: '/chat' },
    { name: 'Tarefas Pendentes', value: '5', icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-100', link: '/planner' },
    { name: 'Arquivos Recentes', value: '12', icon: Folder, color: 'text-emerald-600', bg: 'bg-emerald-100', link: '/files' },
    { name: 'Notas Fixadas', value: '2', icon: StickyNote, color: 'text-amber-600', bg: 'bg-amber-100', link: '/notes' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Olá, {user?.name}!</h1>
        <p className="text-slate-500 mt-1">Bem-vindo ao seu painel EduConnect.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Link key={stat.name} to={stat.link} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.name}</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Atividades Recentes</h2>
            <button className="text-sm text-indigo-600 font-medium hover:text-indigo-700">Ver todas</button>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Nova mensagem no canal Geral</p>
                  <p className="text-xs text-slate-500 mt-1">Há 2 horas</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Próximas Tarefas</h2>
            <Link to="/planner" className="text-sm text-indigo-600 font-medium hover:text-indigo-700">Ir para Planner</Link>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                <div className="w-3 h-3 rounded-full bg-indigo-500 shrink-0"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Reunião de Alinhamento</p>
                  <p className="text-xs text-slate-500 mt-1">Amanhã, 14:00</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
