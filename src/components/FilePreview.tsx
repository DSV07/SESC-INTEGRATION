import React, { useEffect, useRef, useState } from 'react';
import { X, Download, ZoomIn, ZoomOut, FileText, FileSpreadsheet, File as FileIcon, Loader2 } from 'lucide-react';
import { renderAsync } from 'docx-preview';
import * as XLSX from 'xlsx';

interface FilePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  fileType: string;
  fileContent: string; // Base64 com prefixo de data URL
}

export default function FilePreview({ isOpen, onClose, fileName, fileType, fileContent }: FilePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [xlsxData, setXlsxData] = useState<any[][]>([]);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    if (isOpen && fileContent) {
      renderPreview();
    }
  }, [isOpen, fileContent, fileName]);

  const renderPreview = async () => {
    setLoading(true);
    setError(null);
    setXlsxData([]);
    
    try {
      if (fileType.includes('image')) {
        setLoading(false);
      } else if (fileType === 'application/pdf') {
        setLoading(false);
      } else if (fileName.endsWith('.docx') || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const base64Data = fileContent.split(',')[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          await renderAsync(new Blob([bytes]), containerRef.current);
        }
        setLoading(false);
      } else if (fileName.endsWith('.xlsx') || fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        const base64Data = fileContent.split(',')[1];
        const binaryString = atob(base64Data);
        const workbook = XLSX.read(binaryString, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        setXlsxData(data);
        setLoading(false);
      } else {
        setError('Tipo de arquivo não suportado para pré-visualização.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Erro ao renderizar preview:', err);
      setError('Ocorreu um erro ao tentar carregar a prévia do arquivo.');
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileContent;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 md:p-8 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] w-full max-w-6xl h-full max-h-[90vh] shadow-2xl overflow-hidden flex flex-col border border-white/20">
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              {fileName.endsWith('.docx') ? <FileText className="w-6 h-6" /> : 
               fileName.endsWith('.xlsx') ? <FileSpreadsheet className="w-6 h-6" /> : 
               <FileIcon className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 truncate max-w-[200px] md:max-w-md">
                {fileName}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prévia do Arquivo</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button 
                onClick={() => setZoom(prev => Math.max(50, prev - 10))}
                className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-500 transition-all"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-black text-slate-600 px-2 min-w-[50px] text-center">{zoom}%</span>
              <button 
                onClick={() => setZoom(prev => Math.min(200, prev + 10))}
                className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-500 transition-all"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <button 
              onClick={handleDownload}
              className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center gap-2 font-bold text-xs"
            >
              <Download className="w-4 h-4" />
              <span className="hidden md:inline">Download</span>
            </button>

            <button 
              onClick={onClose}
              className="p-3 bg-slate-100 text-slate-500 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-slate-100/50 p-4 md:p-8 relative">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/80 backdrop-blur-sm z-10">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
              <p className="text-slate-900 font-black uppercase tracking-widest text-xs">Preparando Visualização...</p>
            </div>
          )}

          {error ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mb-6">
                <FileIcon className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">{error}</h3>
              <p className="text-slate-500 max-w-sm mx-auto mb-8 font-medium">Não conseguimos renderizar uma prévia para este formato. Você pode baixar o arquivo para visualizá-lo.</p>
              <button 
                onClick={handleDownload}
                className="px-8 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 uppercase text-xs tracking-widest"
              >
                Baixar Arquivo Agora
              </button>
            </div>
          ) : (
            <div 
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
              className="mx-auto transition-transform duration-200"
            >
              {fileType.includes('image') ? (
                <div className="flex justify-center">
                  <img src={fileContent} alt={fileName} className="max-w-full h-auto rounded-2xl shadow-2xl border-4 border-white" />
                </div>
              ) : fileType === 'application/pdf' ? (
                <iframe 
                  src={fileContent} 
                  className="w-full h-[75vh] rounded-2xl shadow-2xl border-4 border-white"
                  title={fileName}
                />
              ) : fileName.endsWith('.docx') ? (
                <div 
                  ref={containerRef} 
                  className="docx-container bg-white p-12 shadow-2xl rounded-2xl max-w-4xl mx-auto border border-slate-200"
                />
              ) : fileName.endsWith('.xlsx') ? (
                <div className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <tbody className="divide-y divide-slate-100">
                      {xlsxData.map((row, i) => (
                        <tr key={i} className={i === 0 ? "bg-slate-50 font-black text-slate-900" : "hover:bg-slate-50/50"}>
                          {row.map((cell, j) => (
                            <td key={j} className="px-6 py-4 whitespace-nowrap border-r border-slate-50 last:border-0 italic font-medium">
                              {cell?.toString() || ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
