import { Bell, Search, UserCircle, Menu } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Topbar({ setSidebarOpen }: { setSidebarOpen: (v: boolean) => void }) {
  const { user, logout } = useAuthStore();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shrink-0">
      <div className="flex items-center flex-1 gap-4">
        <button 
          className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="relative w-full max-w-md hidden sm:block">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <button className="relative p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors hidden sm:block">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="flex items-center gap-3 sm:pl-4 sm:border-l border-slate-200">
          <div className="flex-col items-end hidden sm:flex">
            <span className="text-sm font-medium text-slate-900">{user?.name || 'Usuário'}</span>
            <span className="text-xs text-slate-500">{user?.role || 'Aluno'}</span>
          </div>
          <button onClick={logout} className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors shrink-0">
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
            ) : (
              <UserCircle className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
