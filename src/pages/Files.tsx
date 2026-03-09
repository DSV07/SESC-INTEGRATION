import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Upload, File, Folder, MoreVertical, Download, Trash2, Search } from 'lucide-react';
import { format } from 'date-fns';

interface FileItem {
  id: number;
  name: string;
  size: number;
  type: string;
  url: string;
  folder: string;
  created_at: string;
}

export default function Files() {
  const { token } = useAuthStore();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/files', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setFiles(data));
  }, [token]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    
    const file = fileList[0];
    
    // Mock upload for prototype
    const res = await fetch('/api/files', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        url: '#',
        folder: 'Geral'
      })
    });
    
    const newFile = await res.json();
    setFiles([newFile, ...files]);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Arquivos</h1>
          <p className="text-slate-500 mt-1">Gerencie seus documentos e materiais.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative flex-1 sm:flex-none">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar arquivos..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:w-64"
            />
          </div>
          
          <label className="cursor-pointer bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shrink-0">
            <Upload className="w-4 h-4" />
            Upload
            <input type="file" className="hidden" onChange={handleUpload} />
          </label>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
              <th className="px-6 py-4">Nome</th>
              <th className="px-6 py-4">Tamanho</th>
              <th className="px-6 py-4">Data</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredFiles.length > 0 ? (
              filteredFiles.map(file => (
                <tr key={file.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                      <File className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{file.name}</p>
                      <p className="text-xs text-slate-500">{file.folder}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{formatSize(file.size)}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{format(new Date(file.created_at), 'dd/MM/yyyy')}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Folder className="w-12 h-12 text-slate-300" />
                    <p>Nenhum arquivo encontrado.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
