import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Shield, Bell, Key, Check, AlertCircle } from 'lucide-react';

export default function Settings() {
  const { token } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'As senhas não coincidem.' });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (res.ok) {
        setStatus({ type: 'success', message: 'Senha alterada com sucesso!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setStatus({ type: 'error', message: data.error || 'Erro ao alterar senha.' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Erro de conexão com o servidor.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
        <p className="text-slate-500 mt-1">Gerencie a segurança e preferências da sua conta.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Mini */}
        <div className="lg:col-span-1 space-y-4">
             <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
                   <Shield className="w-6 h-6" />
                </div>
                <h3 className="font-black text-slate-900 uppercase tracking-tighter">Segurança Máxima</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Sua segurança é nossa prioridade. Recomendamos trocar sua senha a cada 90 dias.
                </p>
             </div>
             
             <div className="p-6 bg-indigo-900 text-white rounded-3xl shadow-xl shadow-indigo-100 flex items-center justify-between group cursor-pointer transition-all hover:translate-y-[-2px]">
                <div>
                   <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] mb-1">Notificações</p>
                   <p className="font-bold">Email</p>
                </div>
                <div className="w-12 h-7 bg-indigo-500/30 rounded-full relative p-1">
                   <div className="w-5 h-5 bg-emerald-400 rounded-full absolute right-1 shadow-lg shadow-emerald-500/50 transition-all"></div>
                </div>
             </div>
        </div>

        {/* Form Central */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-3">
              <Key className="w-5 h-5 text-slate-400" />
              <h2 className="font-black text-slate-900 uppercase tracking-tight text-sm">Atualizar Senha de Acesso</h2>
            </div>
            <form onSubmit={handlePasswordChange} className="p-8 space-y-6">
              {status && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in zoom-in duration-300 ${
                  status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                }`}>
                  {status.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  <p className="text-sm font-bold">{status.message}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha Atual</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    required
                    className="w-full bg-slate-50 border-slate-100 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium placeholder:text-slate-300"
                    placeholder="••••••••"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nova Senha</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full bg-slate-50 border-slate-100 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium placeholder:text-slate-300"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmar Nova Senha</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      className="w-full bg-slate-50 border-slate-100 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium placeholder:text-slate-300"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-indigo-600 transition-all active:scale-[0.98] shadow-lg shadow-slate-200 uppercase text-xs tracking-[0.2em] disabled:opacity-50"
                >
                  {loading ? 'Processando...' : 'Confirmar Nova Senha'}
                </button>
              </div>
            </form>
          </div>

          <div className="p-8 bg-amber-50 rounded-3xl border border-amber-100 flex items-start gap-4">
             <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <Bell className="w-5 h-5" />
             </div>
             <div>
                <h4 className="font-black text-amber-900 uppercase tracking-tight text-sm">Lembrete de Segurança</h4>
                <p className="text-amber-700 text-xs mt-1 font-medium leading-relaxed">
                  Nunca compartilhe sua senha com ninguém, nem mesmo com o suporte do EduConnect. Nossa equipe nunca solicitará sua senha por email ou chat.
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
