import React, { useState, useEffect } from 'react';
import { HistoryItem, getAllHistory, deleteFromHistory, clearAllHistory } from '../services/dbService';

interface HistoryGalleryProps {
  onClose: () => void;
}

const HistoryGallery: React.FC<HistoryGalleryProps> = ({ onClose }) => {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [isBatching, setIsBatching] = useState(false);

  const loadHistory = async () => {
    const history = await getAllHistory();
    setItems(history);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
    if (newSelected.size > 0) setIsSelectMode(true);
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.png`;
    link.click();
  };

  const batchDownload = async () => {
    const selectedItems = items.filter(item => selectedIds.has(item.id));
    if (selectedItems.length === 0) return;

    setIsBatching(true);
    try {
      // 动态导入 JSZip 实现真正的打包下载，解决多图下载被拦截的问题
      // Fixed: Cast jszipModule to any to handle unknown module content from dynamic import
      const jszipModule = (await import('https://esm.sh/jszip')) as any;
      const JSZip = jszipModule.default || jszipModule;
      const zip = new JSZip();
      
      selectedItems.forEach((item: HistoryItem) => {
        // Ensure all properties are strings to prevent type issues
        const currentUrl: string = String(item.url || '');
        const currentTheme: string = String(item.theme || 'NFT');
        const currentId: string = String(item.id || '');
        
        // Extract base64 part of the data URL
        const parts = currentUrl.split(',');
        const base64Data: string = parts.length > 1 ? parts[1] : currentUrl;
        
        // 清理文件名中的非法字符
        // Fixed: Explicitly typed safeTheme as string to prevent potential unknown inference in template literals
        const safeTheme: string = currentTheme.replace(/[\\/:*?"<>|]/g, '_');
        const filename: string = `NFT-${safeTheme}-${currentId.slice(0, 4)}.png`;
        
        // Use explicit any cast on the zip instance to handle dynamic module typing issues
        // Fixed: Cast arguments to string where they might be inferred as unknown
        (zip as any).file(filename as string, base64Data as string, { base64: true });
      });
      
      const content = await (zip as any).generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = zipUrl;
      link.download = `NFT-Collection-${new Date().getTime()}.zip`;
      link.click();
      URL.revokeObjectURL(zipUrl);
    } catch (err) {
      console.error("Batch download failed:", err);
      alert("打包下载失败，请稍后重试。");
    } finally {
      setIsBatching(false);
    }
  };

  const batchDelete = async () => {
    if (!window.confirm(`确定要删除选中的 ${selectedIds.size} 项记录吗？`)) return;
    for (const id of Array.from(selectedIds)) {
      await deleteFromHistory(id);
    }
    setSelectedIds(new Set());
    setIsSelectMode(false);
    loadHistory();
  };

  const handleClearAll = async () => {
    if (!window.confirm("确定要清空所有历史记录吗？此操作不可撤销。")) return;
    await clearAllHistory();
    setItems([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col animate-in fade-in duration-300">
      {/* Header */}
      <header className="h-20 border-b border-appBorder bg-appDark/80 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <button onClick={onClose} className="group flex items-center gap-2 text-appGray hover:text-white transition-colors">
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-black uppercase tracking-widest text-xs">返回铸造</span>
          </button>
          <div className="h-4 w-[1px] bg-appBorder"></div>
          <h2 className="text-xl font-black italic uppercase tracking-tighter">历史画廊 <span className="text-accentGreen">Gallery</span></h2>
        </div>

        <div className="flex items-center gap-4">
          {items.length > 0 && (
            <button 
              onClick={() => { setIsSelectMode(!isSelectMode); setSelectedIds(new Set()); }}
              className={`px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest border transition-all ${isSelectMode ? 'bg-accentGreen border-accentGreen text-black' : 'border-appBorder text-appGray hover:border-white hover:text-white'}`}
            >
              {isSelectMode ? '取消选择' : '批量管理'}
            </button>
          )}
          <button onClick={handleClearAll} className="px-4 py-2 border border-red-500/20 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded text-[10px] font-black uppercase tracking-widest transition-all">
            清空全部
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-neutral-950">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
            <div className="w-20 h-20 border-2 border-dashed border-appBorder rounded-full flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="font-black uppercase tracking-[0.3em] text-xs">暂无铸造记录</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 max-w-[1600px] mx-auto">
            {items.map((item) => (
              <div 
                key={item.id} 
                className={`relative group rounded-xl overflow-hidden bg-appCard border transition-all duration-500 ${selectedIds.has(item.id) ? 'border-accentGreen ring-2 ring-accentGreen/20 scale-[0.98]' : 'border-appBorder hover:border-white/20'}`}
                onClick={() => isSelectMode && toggleSelect(item.id)}
              >
                {/* 预览图 */}
                <div className="aspect-square bg-black overflow-hidden">
                  <img src={item.url} alt={item.theme} className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110" />
                </div>

                {/* 悬浮覆盖层 - 操作按钮：右下下载，左下删除 */}
                {!isSelectMode && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4">
                    <div className="text-center">
                      <h4 className="text-accentGreen font-black text-sm uppercase italic mb-1 truncate">{item.theme}</h4>
                      <p className="text-[9px] text-white/60 line-clamp-2">{item.description}</p>
                    </div>
                    <div className="flex justify-between items-center mt-auto">
                      <button 
                        onClick={async (e) => { e.stopPropagation(); if(confirm("删除此项记录？")) { await deleteFromHistory(item.id); loadHistory(); } }}
                        className="p-2.5 bg-red-500/80 backdrop-blur text-white rounded-xl hover:bg-red-500 transition-all hover:scale-110 active:scale-95"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" strokeWidth={2}/></svg>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDownload(item.url, item.theme); }}
                        className="p-2.5 bg-accentGreen text-black rounded-xl hover:bg-white transition-all hover:scale-110 active:scale-95"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeWidth={2}/></svg>
                      </button>
                    </div>
                  </div>
                )}

                {/* 选择标记 */}
                {isSelectMode && (
                  <div className="absolute top-3 right-3 z-10">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedIds.has(item.id) ? 'bg-accentGreen border-accentGreen' : 'border-white/20 bg-black/40'}`}>
                      {selectedIds.has(item.id) && (
                        <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  </div>
                )}
                
                {/* 底部信息 (非悬浮时) */}
                <div className="p-3 bg-appCard">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-white/40 truncate pr-2">{item.theme}</span>
                    <span className="text-[8px] text-appGray shrink-0">{new Date(item.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部操作栏 (多选模式) */}
      {isSelectMode && selectedIds.size > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-2xl border border-white/20 px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-8 animate-in slide-in-from-bottom-8">
          <div className="flex flex-col">
            <span className="text-accentGreen font-black text-sm leading-none">{selectedIds.size}</span>
            <span className="text-[9px] font-bold uppercase text-white/40">已选择项</span>
          </div>
          <div className="h-8 w-[1px] bg-white/10"></div>
          <div className="flex gap-4">
            <button 
              onClick={batchDownload} 
              disabled={isBatching}
              className={`bg-accentGreen text-black px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2 ${isBatching ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isBatching ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeWidth={2}/></svg>
              )}
              {isBatching ? '正在打包...' : '打包下载'}
            </button>
            <button onClick={batchDelete} className="bg-red-500 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" strokeWidth={2}/></svg>
              批量删除
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryGallery;
