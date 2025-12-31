
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GenerationParams, AvatarStyle, Accessory, Clothing, Background, GeneratedResult } from './types';
import { transformImage } from './services/geminiService';
import { saveToHistory, getAllHistory, HistoryItem } from './services/dbService';
import ControlPanel from './components/ControlPanel';

interface GenerationBatch {
  id: string;
  timestamp: number;
  params: GenerationParams;
  uploadedImage: string;
  tasks: GenerationTask[];
}

interface GenerationTask {
  id: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  result?: GeneratedResult;
  error?: string;
  isCancelled?: boolean;
}

const App: React.FC = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [currentBatch, setCurrentBatch] = useState<GenerationBatch | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [zoomIndex, setZoomIndex] = useState<number | null>(null);
  
  const taskCancelRef = useRef<{ [key: string]: boolean }>({});
  const settingsRef = useRef<HTMLDivElement>(null);
  
  const initialParams: GenerationParams = {
    style: AvatarStyle.MATTE_CLAY,
    accessory: Accessory.SUNGLASSES,
    clothing: Clothing.HOODIE,
    background: Background.PASTEL_RAINBOW,
    intensity: 75,
    theme: '',
    isRandom: false,
    quantity: 1
  };

  const [params, setParams] = useState<GenerationParams>(initialParams);

  const loadHistory = async () => {
    const items = await getAllHistory();
    setHistory(items);
  };

  useEffect(() => {
    loadHistory();
  }, [currentBatch]);

  // 点击空白区域收起设置面板
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const mapErrorToChinese = (err: any) => {
    const msg = (err?.message || "").toLowerCase();
    if (msg.includes("quota") || msg.includes("limit") || msg.includes("429")) return "积分不足";
    if (msg.includes("500") || msg.includes("503") || msg.includes("overloaded")) return "服务器繁忙";
    if (msg.includes("safety") || msg.includes("blocked")) return "内容受限";
    if (msg.includes("fetch") || msg.includes("network")) return "网络断开";
    return "生成失败";
  };

  const runSingleTask = useCallback(async (taskIndex: number, batch: GenerationBatch) => {
    const taskId = batch.tasks[taskIndex].id;
    taskCancelRef.current[taskId] = false;

    setCurrentBatch(prev => {
      if (!prev || prev.id !== batch.id) return prev;
      const newTasks = [...prev.tasks];
      newTasks[taskIndex] = { ...newTasks[taskIndex], status: 'loading', isCancelled: false };
      return { ...prev, tasks: newTasks };
    });

    try {
      const res = await transformImage(batch.uploadedImage, batch.params, taskIndex, batch.params.quantity);
      if (taskCancelRef.current[taskId]) return;

      setCurrentBatch(prev => {
        if (!prev || prev.id !== batch.id) return prev;
        const newTasks = [...prev.tasks];
        newTasks[taskIndex] = { ...newTasks[taskIndex], status: 'success', result: res };
        return { ...prev, tasks: newTasks };
      });
      await saveToHistory(res);
    } catch (err: any) {
      if (taskCancelRef.current[taskId]) return;
      
      setCurrentBatch(prev => {
        if (!prev || prev.id !== batch.id) return prev;
        const newTasks = [...prev.tasks];
        newTasks[taskIndex] = { ...newTasks[taskIndex], status: 'error', error: mapErrorToChinese(err) };
        return { ...prev, tasks: newTasks };
      });
    }
  }, []);

  const handleGenerate = async () => {
    if (!uploadedImage) return;
    setShowSettings(false);
    
    const batchId = crypto.randomUUID();
    const tasks: GenerationTask[] = Array.from({ length: params.quantity }).map(() => ({
      id: crypto.randomUUID(),
      status: 'idle'
    }));

    const newBatch: GenerationBatch = {
      id: batchId,
      timestamp: Date.now(),
      params: { ...params },
      uploadedImage: uploadedImage,
      tasks: tasks
    };
    
    setCurrentBatch(newBatch);

    for (let i = 0; i < tasks.length; i++) {
      runSingleTask(i, newBatch);
      await new Promise(r => setTimeout(r, 600));
    }
  };

  const handleCancelTask = (idx: number) => {
    if (!currentBatch) return;
    const taskId = currentBatch.tasks[idx].id;
    taskCancelRef.current[taskId] = true;

    setCurrentBatch(prev => {
      if (!prev) return prev;
      const newTasks = [...prev.tasks];
      newTasks[idx] = { ...newTasks[idx], status: 'idle', isCancelled: true };
      return { ...prev, tasks: newTasks };
    });
  };

  const handleRetryTask = (idx: number) => {
    if (!currentBatch) return;
    runSingleTask(idx, currentBatch);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const isBatchLoading = currentBatch?.tasks.some(t => t.status === 'loading') || false;

  const downloadImage = (url: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const link = document.createElement('a');
    link.href = url;
    link.download = `nft-${Date.now()}.png`;
    link.click();
  };

  const updateQuantity = (delta: number) => {
    setParams(prev => ({ ...prev, quantity: Math.max(1, Math.min(9, prev.quantity + delta)) }));
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#F0F0F0] text-[#1A1A1A] flex flex-col font-sans selection:bg-black selection:text-white">
      <header className="h-16 px-8 flex items-center border-b border-black/5 bg-white/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center shadow-lg shadow-black/10">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-black tracking-tight text-xl italic uppercase">Mint <span className="text-black/30">Lab</span></span>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-8 lg:p-16 pb-64 space-y-20">
        {currentBatch && (
          <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-700">
             <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-xl ring-4 ring-white shrink-0">
                  <img src={currentBatch.uploadedImage} className="w-full h-full object-cover" alt="Source" />
                </div>
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black/20">Now Minting</span>
                    {isBatchLoading && <div className="h-2 w-2 rounded-full bg-accentGreen animate-pulse shadow-[0_0_10px_#c6ff33]"></div>}
                  </div>
                  <p className="text-xl font-black italic">{currentBatch.params.theme || "新铸造系列作品"}</p>
                </div>
             </div>

             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {currentBatch.tasks.map((task, idx) => (
                  <div key={idx} className="relative aspect-square group">
                    {task.status === 'success' && task.result ? (
                      <div className="w-full h-full rounded-3xl overflow-hidden bg-white shadow-xl shadow-black/5 cursor-zoom-in transition-all duration-500 hover:scale-[1.03] active:scale-95" onClick={() => setZoomIndex(idx)}>
                        <img src={task.result.url} className="w-full h-full object-cover" alt="Result" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <button onClick={(e) => downloadImage(task.result!.url, e)} className="p-4 bg-white text-black rounded-full shadow-2xl hover:scale-110 active:scale-90 transition-all">
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeWidth={2.5}/></svg>
                           </button>
                        </div>
                      </div>
                    ) : task.status === 'loading' ? (
                      <div className="w-full h-full rounded-3xl border border-black/5 bg-white shadow-lg flex flex-col items-center justify-center space-y-4">
                        <div className="w-10 h-10 border-4 border-black/5 border-t-black rounded-full animate-spin"></div>
                        <div className="text-center space-y-2 px-4">
                          <span className="text-[10px] font-black text-black/20 uppercase tracking-[0.3em] block">生成中...</span>
                          <button 
                            onClick={() => handleCancelTask(idx)}
                            className="text-[10px] font-black px-4 py-1.5 bg-black/[0.03] hover:bg-black/10 rounded-full transition-colors"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    ) : task.status === 'error' ? (
                      <div className="w-full h-full rounded-3xl border border-red-100 bg-white flex flex-col items-center justify-center p-4 space-y-3">
                        <div className="text-center">
                          <span className="text-red-500 text-[11px] font-black block mb-1">{task.error}</span>
                          <span className="text-[9px] text-black/20 uppercase tracking-widest block">Error Occurred</span>
                        </div>
                        <button 
                          onClick={() => handleRetryTask(idx)}
                          className="bg-black text-white text-[10px] font-black px-5 py-2 rounded-xl active:scale-95 transition-all"
                        >
                          重新生成
                        </button>
                      </div>
                    ) : (
                      <div className="w-full h-full rounded-3xl border border-black/5 bg-black/[0.02] flex items-center justify-center">
                        <div className="text-center space-y-3">
                           <span className="text-black/5 font-black text-3xl italic block">#{idx + 1}</span>
                           {task.isCancelled && (
                             <button 
                                onClick={() => handleRetryTask(idx)}
                                className="text-[10px] font-black px-5 py-2 bg-black text-white rounded-xl active:scale-95 transition-all"
                             >
                               重新开始
                             </button>
                           )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
             </div>
          </div>
        )}

        <section className="space-y-10">
           <div className="flex items-center gap-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-black/20">Previous Vault</h2>
              <div className="h-[1px] flex-1 bg-black/5"></div>
           </div>
           
           {history.length === 0 && !currentBatch ? (
             <div className="h-64 flex flex-col items-center justify-center text-center space-y-6 opacity-30">
               <div className="w-20 h-20 border-2 border-dashed border-black/10 rounded-full flex items-center justify-center">
                 <svg className="w-8 h-8 text-black/20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
               </div>
               <p className="font-black italic uppercase text-xs tracking-widest">还没有开始任何铸造</p>
             </div>
           ) : (
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {history.map((item) => (
                  <div key={item.id} className="group relative aspect-square rounded-2xl overflow-hidden bg-white shadow-sm border border-black/5 cursor-zoom-in hover:shadow-2xl transition-all duration-500 active:scale-95">
                    <img src={item.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={item.theme} />
                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform flex flex-col">
                      <p className="text-[10px] font-black text-white truncate uppercase italic">{item.theme}</p>
                      <span className="text-[8px] text-white/40 font-bold uppercase mt-1">Minted @ {formatTime(item.timestamp)}</span>
                    </div>
                  </div>
                ))}
             </div>
           )}
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-8 lg:p-12 z-50 pointer-events-none">
        <div className="max-w-3xl mx-auto w-full pointer-events-auto" ref={settingsRef}>
          <div className="bg-white shadow-[0_40px_100px_rgba(0,0,0,0.15)] rounded-[2.5rem] p-3 border border-black/5 ring-1 ring-black/5 overflow-hidden">
             
             <div className={`px-5 transition-all duration-500 ease-in-out ${showSettings ? 'max-h-[600px] opacity-100 py-6 mb-2 border-b border-black/5' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-xs font-black uppercase tracking-widest italic">艺术偏好配置 Settings</h3>
                   <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-black/5 rounded-full transition-colors">
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2.5}/></svg>
                   </button>
                </div>
                <ControlPanel params={params} setParams={setParams} isLoading={isBatchLoading} />
             </div>

             <div className="flex items-center gap-4">
                <div 
                  className={`relative w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all cursor-pointer overflow-hidden ${uploadedImage ? 'ring-2 ring-black/5 shadow-inner' : 'bg-black/[0.03] border-2 border-dashed border-black/5 hover:bg-black/[0.05]'}`}
                  onClick={() => document.getElementById('fileUpload')?.click()}
                >
                  {uploadedImage ? (
                    <img src={uploadedImage} className="w-full h-full object-cover" alt="Source Preview" />
                  ) : (
                    <svg className="w-6 h-6 text-black/10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" strokeWidth={2.5}/></svg>
                  )}
                  <input id="fileUpload" type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                </div>

                <div className="flex-1 px-1">
                  <input 
                    type="text" 
                    placeholder="输入本系列的核心主题（如：赛博朋克 2077...）" 
                    className="w-full bg-transparent border-none focus:ring-0 text-[15px] font-bold text-[#111] placeholder:text-black/10 py-1"
                    value={params.theme || ""}
                    onFocus={() => setShowSettings(true)}
                    onChange={(e) => setParams(prev => ({ ...prev, theme: e.target.value }))}
                  />
                  <div className="flex items-center gap-4 mt-1.5">
                    <button 
                      onClick={() => setShowSettings(!showSettings)}
                      className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md transition-all ${showSettings ? 'bg-black text-white' : 'text-black/30 hover:text-black/60 hover:bg-black/5'}`}
                    >
                      艺术配置 Settings
                    </button>
                    <div className="h-3 w-[1px] bg-black/5"></div>
                    <div className="flex items-center gap-3">
                       <span className="text-[8px] font-black uppercase text-black/20 tracking-tighter">铸造数量</span>
                       <div className="flex items-center gap-2.5 bg-black/5 rounded-lg p-0.5">
                          <button onClick={() => updateQuantity(-1)} disabled={isBatchLoading} className="w-5 h-5 flex items-center justify-center hover:bg-white rounded-md transition-all disabled:opacity-30"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M20 12H4" strokeWidth={3}/></svg></button>
                          <span className="text-[11px] font-black w-3 text-center tabular-nums">{params.quantity}</span>
                          <button onClick={() => updateQuantity(1)} disabled={isBatchLoading} className="w-5 h-5 flex items-center justify-center hover:bg-white rounded-md transition-all disabled:opacity-30"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" strokeWidth={3}/></svg></button>
                       </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleGenerate}
                  disabled={!uploadedImage || isBatchLoading}
                  className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-300 ${
                    isBatchLoading ? 'bg-black/10 cursor-not-allowed' : 
                    (uploadedImage ? 'bg-black hover:bg-neutral-800 shadow-2xl shadow-black/20 hover:scale-105 active:scale-90' : 'bg-black/5 opacity-40 cursor-not-allowed')
                  }`}
                >
                  <svg className={`w-7 h-7 transition-colors ${uploadedImage && !isBatchLoading ? 'text-white' : 'text-black/20'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M5 10l7-7m0 0l7 7m-7-7v18" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
             </div>
          </div>
        </div>
      </div>

      {zoomIndex !== null && currentBatch?.tasks[zoomIndex]?.status === 'success' && (
        <div className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-3xl flex flex-col items-center justify-center p-8 animate-in fade-in duration-300" onClick={() => setZoomIndex(null)}>
           <div className="max-w-3xl w-full" onClick={e => e.stopPropagation()}>
              <div className="aspect-square bg-white shadow-2xl rounded-[3rem] overflow-hidden border border-black/5 mb-10 transform-gpu transition-transform duration-500 hover:scale-[1.02]">
                <img src={currentBatch.tasks[zoomIndex].result?.url} className="w-full h-full object-cover" alt="Zoom" />
              </div>
              <div className="flex items-end justify-between px-2">
                <div className="space-y-3">
                  <h3 className="text-4xl font-black italic">{currentBatch.tasks[zoomIndex].result?.theme}</h3>
                  <p className="text-black/40 text-sm max-w-lg leading-relaxed font-medium">{currentBatch.tasks[zoomIndex].result?.description}</p>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => downloadImage(currentBatch.tasks[zoomIndex].result!.url)} className="w-16 h-16 bg-black text-white rounded-3xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-xl shadow-black/20">
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeWidth={2.5}/></svg>
                  </button>
                  <button onClick={() => setZoomIndex(null)} className="w-16 h-16 bg-black/5 text-black rounded-3xl flex items-center justify-center hover:bg-black/10 transition-all">
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2.5}/></svg>
                  </button>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
