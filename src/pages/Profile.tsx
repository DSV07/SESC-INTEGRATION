import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { UserCircle, Mail, Briefcase, Building2, LogOut, Camera, Save, X } from 'lucide-react';

export default function Profile() {
  const { user, token, logout, setUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, department, avatar })
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Meu Perfil</h1>
        <p className="text-slate-500 mt-1">Gerencie suas informações e presença no SESC Integration.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
        <div className="h-40 bg-gradient-to-r from-blue-800 via-blue-900 to-blue-950 relative">
          <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px]"></div>
          <div className="absolute top-4 right-8 flex items-center gap-2">
             <div className="w-12 h-12 bg-orange-500 rounded-2xl rotate-3 shadow-xl flex items-center justify-center font-black text-white text-xl">S</div>
          </div>
        </div>
        <div className="px-8 pb-8">
          <div className="relative flex flex-col sm:flex-row justify-between items-center sm:items-end -mt-20 mb-6 gap-6">
            <div className="relative group">
              <div className="w-40 h-40 rounded-full border-8 border-white bg-slate-100 flex items-center justify-center text-slate-300 overflow-hidden shadow-xl shrink-0 transition-transform group-hover:scale-[1.02]">
                {avatar ? (
                  <img src={avatar} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <UserCircle className="w-24 h-24" />
                )}
              </div>
              {isEditing && (
                <div className="absolute bottom-2 right-2 flex gap-2">
                   <button 
                    onClick={() => {
                        const newAvatar = prompt('Insira a URL do novo avatar:', avatar);
                        if(newAvatar !== null) setAvatar(newAvatar);
                    }}
                    className="p-3 bg-white text-slate-700 rounded-full shadow-lg border border-slate-100 hover:bg-slate-50 transition-all active:scale-95"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              {isEditing ? (
                <>
                  <button 
                    onClick={() => {
                      setIsEditing(false);
                      setName(user.name);
                      setDepartment(user.department || '');
                      setAvatar(user.avatar || '');
                    }}
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" /> Cancelar
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" /> {loading ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="w-full sm:w-auto px-8 py-2.5 bg-white border-2 border-slate-200 text-slate-700 text-sm font-bold rounded-2xl hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm"
                >
                  Editar Perfil
                </button>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="text-center sm:text-left">
              {isEditing ? (
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="text-3xl font-black text-slate-900 bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 rounded-xl px-4 py-2 w-full max-w-md"
                  placeholder="Seu nome"
                />
              ) : (
                <>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">{user.name}</h2>
                  <p className="text-indigo-600 font-bold mt-1 uppercase tracking-widest text-xs">{user.role}</p>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Endereço de Email</p>
                  <p className="text-slate-900 font-bold break-all">{user.email}</p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Papel no Sistema</p>
                  <p className="text-slate-900 font-bold">{user.role}</p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Departamento</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={department}
                      onChange={e => setDepartment(e.target.value)}
                      className="w-full bg-white border-slate-200 rounded-lg text-sm font-bold focus:ring-indigo-500"
                    />
                  ) : (
                    <p className="text-slate-900 font-bold">{user.department || 'Geral'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-slate-900 rounded-3xl text-white shadow-xl shadow-slate-200 relative overflow-hidden group">
        <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-indigo-500/20 transition-all"></div>
        <div className="flex items-center gap-4 relative">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
            <LogOut className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <p className="font-black uppercase tracking-tight">Sessão Ativa</p>
            <p className="text-slate-400 text-xs font-medium">Você está conectado agora.</p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="mt-4 sm:mt-0 w-full sm:w-auto px-8 py-3 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-900/20 uppercase text-xs tracking-widest"
        >
          Encerrar Sessão
        </button>
      </div>
    </div>
  );
}
