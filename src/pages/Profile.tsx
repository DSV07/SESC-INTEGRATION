import { useAuthStore } from '../store/authStore';
import { UserCircle, Mail, Briefcase, Building2, LogOut } from 'lucide-react';

export default function Profile() {
  const { user, logout } = useAuthStore();

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Perfil</h1>
        <p className="text-slate-500 mt-1">Gerencie suas informações pessoais.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
        <div className="px-8 pb-8">
          <div className="relative flex flex-col sm:flex-row justify-between items-center sm:items-end -mt-16 mb-6 gap-4">
            <div className="w-32 h-32 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden shadow-md shrink-0">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <UserCircle className="w-20 h-20" />
              )}
            </div>
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm w-full sm:w-auto">
              Editar Perfil
            </button>
          </div>

          <div className="space-y-6 text-center sm:text-left">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{user.name}</h2>
              <p className="text-slate-500 font-medium mt-1">{user.role}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Email</p>
                  <p className="text-slate-900">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Cargo</p>
                  <p className="text-slate-900">{user.role}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Departamento</p>
                  <p className="text-slate-900">{user.department || 'Não informado'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Configurações da Conta</h3>
        <div className="space-y-4">
          <button className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors group">
            <div>
              <p className="font-medium text-slate-900 group-hover:text-indigo-700">Alterar Senha</p>
              <p className="text-sm text-slate-500 mt-1">Atualize sua senha de acesso regularmente.</p>
            </div>
          </button>
          
          <button className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors group">
            <div>
              <p className="font-medium text-slate-900 group-hover:text-indigo-700">Notificações</p>
              <p className="text-sm text-slate-500 mt-1">Gerencie como você recebe alertas e mensagens.</p>
            </div>
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          onClick={logout}
          className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sair da Conta
        </button>
      </div>
    </div>
  );
}
