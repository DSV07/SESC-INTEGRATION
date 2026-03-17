import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { 
  File, 
  Upload, 
  Trash2, 
  Search, 
  Filter, 
  MoreVertical,
  FolderOpen,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { clsx } from 'clsx';

interface FileData {
  id: number;
  name: string;
  size: number;
  type: string;
  content?: string;
  is_shared: boolean;
  user_id: number;
  user: { id: number, name: string };
  created_at: string;
}

export default function Files() {
  const { user, token } = useAuthStore();
  const [files, setFiles] = useState<FileData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'network'>('network');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, fileId: number | null }>({
    isOpen: false,
    fileId: null
  });

  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/files?shared=${activeTab === 'network'}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setFiles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao buscar arquivos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setFiles([]); // Limpa os arquivos ao trocar de aba para evitar percepção de mistura
    fetchFiles();
  }, [token, activeTab]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Content = reader.result as string;
        
        const res = await fetch('/api/files', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: file.name,
            size: file.size,
            type: file.type,
            content: base64Content,
            location: activeTab === 'network' ? 'NETWORK' : 'PERSONAL'
          })
        });

        if (res.ok) await fetchFiles();
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erro no upload:', error);
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleteModal({ isOpen: true, fileId: id });
  };

  const confirmDelete = async () => {
    if (!deleteModal.fileId) return;
    
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/files/${deleteModal.fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchFiles();
        setDeleteModal({ isOpen: false, fileId: null });
      }
    } catch (error) {
      console.error('Erro ao excluir:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDownload = (file: FileData) => {
    try {
      // O conteúdo vem em base64 (Data URL) do backend
      const link = document.createElement('a');
      link.href = (file as any).content;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gerenciador de Arquivos</h1>
          <p className="text-slate-500 mt-1">
            {activeTab === 'network' ? 'Arquivos compartilhados em toda a rede SESC.' : 'Seus arquivos privados e seguros.'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-sm font-bold rounded-xl hover:bg-orange-700 transition-all cursor-pointer shadow-lg shadow-orange-100">
            <Upload className="w-4 h-4" />
            {isUploading ? 'Enviando...' : (activeTab === 'network' ? 'Subir para Rede' : 'Upload Pessoal')}
            <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
          </label>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('network')}
          className={clsx(
            "px-6 py-2 rounded-xl text-sm font-bold transition-all",
            activeTab === 'network' ? "bg-white text-blue-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Rede da Empresa
        </button>
        <button 
          onClick={() => setActiveTab('personal')}
          className={clsx(
            "px-6 py-2 rounded-xl text-sm font-bold transition-all",
            activeTab === 'personal' ? "bg-white text-blue-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Meus Arquivos
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar arquivos..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-slate-600 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <Filter className="w-4 h-4" /> Filtrar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Tamanho</th>
                <th className="px-6 py-4">{activeTab === 'network' ? 'Autor' : 'Status'}</th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 relative min-h-[200px]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-slate-500 font-medium">Carregando arquivos...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredFiles.length > 0 ? filteredFiles.map((file) => (
                <tr key={file.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <File className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-bold text-slate-900 group-hover:text-blue-800 transition-colors truncate max-w-[200px]">
                        {file.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {formatFileSize(file.size)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200/50">
                      {activeTab === 'network' ? (file.user?.name || 'Sistema') : 'Privado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {format(new Date(file.created_at), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleDownload(file)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {(user?.id === file.user?.id || user?.role === 'admin') && (
                        <button 
                          onClick={() => handleDelete(file.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-500">
                     <File className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                     <p>Nenhum arquivo encontrado.</p>
                     <p className="text-sm text-slate-400 mt-1">Carregue um novo arquivo para começar.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 mx-auto mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Confirmar Exclusão</h3>
              <p className="text-slate-500 text-sm font-medium px-4">
                Tem certeza que deseja excluir permanentemente este arquivo? Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="p-6 bg-slate-50 flex flex-col gap-2">
              <button 
                onClick={confirmDelete}
                disabled={isActionLoading}
                className="w-full py-3 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-50"
              >
                {isActionLoading ? 'Excluindo...' : 'Sim, Excluir Arquivo'}
              </button>
              <button 
                onClick={() => setDeleteModal({ isOpen: false, fileId: null })}
                disabled={isActionLoading}
                className="w-full py-3 text-slate-500 font-bold hover:bg-white hover:shadow-sm rounded-xl transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
