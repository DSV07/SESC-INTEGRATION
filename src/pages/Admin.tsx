import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { 
  Users, 
  Briefcase, 
  Building2, 
  MapPin, 
  Plus, 
  Trash2, 
  Pencil,
  Save,
  X,
  MessageSquare,
  Megaphone,
  Eraser
} from 'lucide-react';
import { clsx } from 'clsx';

type Tab = 'users' | 'roles' | 'depts' | 'units' | 'channels';

export default function Admin() {
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States para formulários
  const [roles, setRoles] = useState<any[]>([]);
  const [depts, setDepts] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'users' ? '/api/admin/users' : 
                      activeTab === 'roles' ? '/api/admin/roles' :
                      activeTab === 'depts' ? '/api/admin/departments' :
                      activeTab === 'channels' ? '/api/channels' :
                      '/api/admin/units';
      
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      setData(json);

      // Se for a aba de usuários, buscar também os metadados para o formulário
      if (activeTab === 'users') {
        const [r, d, u] = await Promise.all([
          fetch('/api/admin/roles', { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json()),
          fetch('/api/admin/departments', { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json()),
          fetch('/api/admin/units', { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json())
        ]);
        setRoles(r);
        setDepts(d);
        setUnits(u);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, token]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    try {
      const method = editingItem ? 'PUT' : 'POST';
      const endpoint = activeTab === 'users' ? `/api/admin/users${editingItem ? `/${editingItem.id}` : ''}` : 
                        activeTab === 'roles' ? `/api/admin/roles${editingItem ? `/${editingItem.id}` : ''}` :
                        activeTab === 'depts' ? `/api/admin/departments${editingItem ? `/${editingItem.id}` : ''}` :
                        activeTab === 'channels' ? `/api/admin/channels${editingItem ? `/${editingItem.id}` : ''}` :
                        `/api/admin/units${editingItem ? `/${editingItem.id}` : ''}`;

      const res = await fetch(endpoint, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erro ao salvar dados');
      }

      setIsModalOpen(false);
      setEditingItem(null);
      setFormData({});
      fetchData();
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deletingId) return;
    
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const endpoint = activeTab === 'users' ? `/api/admin/users/${deletingId}` : 
                        activeTab === 'roles' ? `/api/admin/roles/${deletingId}` :
                        activeTab === 'depts' ? `/api/admin/departments/${deletingId}` :
                        activeTab === 'channels' ? `/api/admin/channels/${deletingId}` :
                        `/api/admin/units/${deletingId}`;
      
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Falha ao excluir item');
      }

      setIsDeleteModalOpen(false);
      setDeletingId(null);
      fetchData();
    } catch (err: any) {
      setDeleteError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const [announcementModal, setAnnouncementModal] = useState<{ isOpen: boolean, channelId: number | null }>({
    isOpen: false,
    channelId: null
  });
  const [announcementText, setAnnouncementText] = useState('');

  const sendAnnouncement = async () => {
    if (!announcementModal.channelId || !announcementText.trim()) return;
    
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ channelId: announcementModal.channelId, content: announcementText })
      });
      if (res.ok) {
        setAnnouncementModal({ isOpen: false, channelId: null });
        setAnnouncementText('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const clearMessages = async (channelId: number) => {
    if (!confirm('Tem certeza que deseja limpar todas as mensagens deste canal?')) return;
    
    try {
      const res = await fetch(`/api/admin/channels/${channelId}/messages`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) alert('Mensagens removidas.');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Administração do Sistema</h1>
          <p className="text-slate-500 text-sm">Gerencie usuários, cargos e departamentos da unidade.</p>
        </div>
        <button 
          onClick={() => { setEditingItem(null); setFormData({}); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium w-fit shrink-0"
        >
          <Plus className="w-4 h-4" />
          Novo {activeTab === 'users' ? 'Usuário' : activeTab === 'roles' ? 'Cargo' : activeTab === 'depts' ? 'Departamento' : activeTab === 'channels' ? 'Canal' : 'Unidade'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 overflow-x-auto scrollbar-hide no-scrollbar">
        {[
          { id: 'users', label: 'Usuários', icon: Users },
          { id: 'roles', label: 'Cargos', icon: Briefcase },
          { id: 'depts', label: 'Departamentos', icon: Building2 },
          { id: 'units', label: 'Unidades', icon: MapPin },
          { id: 'channels', label: 'Canais', icon: MessageSquare },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={clsx(
              "flex items-center gap-2 py-3 border-b-2 px-1 text-sm font-medium transition-colors",
              activeTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tabela ou Lista */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto overflow-y-hidden">
        {loading ? (
           <div className="p-12 text-center text-slate-500">Carregando dados...</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 whitespace-nowrap">
              <tr>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Nome</th>
                {activeTab === 'users' && <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">E-mail / Cargo</th>}
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 whitespace-nowrap">
              {data.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{item.name}</div>
                    {item.role && <div className="text-xs text-slate-400 capitalize">{item.role === 'admin' ? 'Acesso Admin' : 'Acesso Geral'}</div>}
                  </td>
                  {activeTab === 'users' && (
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600">{item.email}</div>
                      <div className="flex gap-1 mt-1">
                        {item.system_role && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">{item.system_role.name}</span>}
                        {item.department && <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full">{item.department.name}</span>}
                        {item.unit && <span className="text-[10px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded-full">{item.unit.name}</span>}
                      </div>
                    </td>
                  )}
                  {activeTab === 'channels' && (
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {item.description || 'Sem descrição'}
                    </td>
                  )}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {activeTab === 'channels' && (
                        <>
                          <button 
                            onClick={() => setAnnouncementModal({ isOpen: true, channelId: item.id })}
                            className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Mandar Aviso"
                          >
                            <Megaphone className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => clearMessages(item.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Limpar Mensagens"
                          >
                            <Eraser className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => { setEditingItem(item); setFormData(item); setIsModalOpen(true); }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                         onClick={() => { setDeletingId(item.id); setIsDeleteModalOpen(true); setDeleteError(null); }}
                         className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Confirmar Exclusão</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Tem certeza que deseja excluir este {activeTab === 'users' ? 'usuário' : 'item'}? Esta ação não pode ser desfeita.
                </p>
              </div>

              {deleteError && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-lg text-xs font-medium">
                  {deleteError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : 'Sim, Excluir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Formulário */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{editingItem ? 'Editar' : 'Novo'} {activeTab === 'users' ? 'Usuário' : 'Item'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:bg-slate-100 p-1 rounded-full"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Nome</label>
                <input 
                  type="text" 
                  value={formData.name || ''} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              {activeTab === 'users' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">E-mail</label>
                    <input 
                      type="email" 
                      value={formData.email || ''} 
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                  {!editingItem && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Senha</label>
                      <input 
                        type="password" 
                        value={formData.password || ''} 
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Tipo Acesso</label>
                      <select 
                        value={formData.role || 'user'}
                        onChange={e => setFormData({...formData, role: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                      >
                        <option value="user">Geral</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Cargo</label>
                      <select 
                        value={formData.role_id || ''}
                        onChange={e => setFormData({...formData, role_id: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                      >
                        <option value="">Selecione...</option>
                        {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Depto</label>
                      <select 
                         value={formData.dept_id || ''}
                         onChange={e => setFormData({...formData, dept_id: e.target.value})}
                         className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                      >
                        <option value="">Selecione...</option>
                        {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Unidade</label>
                       <select 
                         value={formData.unit_id || ''}
                         onChange={e => setFormData({...formData, unit_id: e.target.value})}
                         className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                      >
                        <option value="">Selecione...</option>
                        {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'channels' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Descrição (Opcional)</label>
                    <textarea 
                      value={formData.description || ''} 
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none h-24"
                    />
                  </div>
                </div>
              )}

              {saveError && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-2 rounded-lg text-xs font-medium">
                  {saveError}
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal de Aviso Admin */}
      {announcementModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between font-bold text-slate-900">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-orange-600" />
                <h2>Mandar Aviso Destacado</h2>
              </div>
              <button onClick={() => setAnnouncementModal({ isOpen: false, channelId: null })} className="text-slate-400 hover:bg-slate-100 p-1 rounded-full"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-500">Este aviso será destacado com um fundo especial e ícone de administrador para todos no canal.</p>
              <textarea 
                value={announcementText}
                onChange={e => setAnnouncementText(e.target.value)}
                placeholder="Escreva sua mensagem oficial..."
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none"
              />
              <div className="flex gap-3">
                <button 
                  onClick={() => setAnnouncementModal({ isOpen: false, channelId: null })}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={sendAnnouncement}
                  disabled={isSaving || !announcementText.trim()}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-black hover:bg-orange-700 transition-colors shadow-lg shadow-orange-100 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? 'Enviando...' : 'Enviar Agora'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
