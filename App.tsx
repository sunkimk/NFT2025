
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GenerationParams, AvatarStyle, Accessory, Clothing, Background, GeneratedResult } from './types';
import { transformImage } from './services/geminiService';
import { saveToHistory } from './services/dbService';
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
}

const App: React.FC = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [activeBatches, setActiveBatches] = useState<GenerationBatch[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [zoomState, setZoomState] = useState<{ batchId: string; taskIndex: number } | null>(null);
  const [hasKey, setHasKey] = useState<boolean>(false);
  
  const settingsRef = useRef<HTMLDivElement>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);
  
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

  useEffect(() => {
    const checkKey = async () => {
      try {
        const selected = await (window as any).aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } catch (e) { setHasKey(false); }
    };
    checkKey();
  }, []);

  // 处理点击外部关闭设置面板
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };

    if (showSettings) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettings]);

  // 每次有新批次时，自动滚动到底部
  useEffect(() => {
    if (activeBatches.length > 0) {
      setTimeout(() => {
        scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [activeBatches.length]);

  const handleOpenKeySelector = async () => {
    await (window as any).aistudio.openSelectKey();
    setHasKey(true);
  };

  const executeBatchTask = useCallback(async (batchId: string, taskIndex: number, img: string, p: GenerationParams) => {
    setActiveBatches(prev => prev.map(b => {
      if (b.id !== batchId) return b;
      const newTasks = [...b.tasks];
      newTasks[taskIndex] = { ...newTasks[taskIndex], status: 'loading' };
      return { ...b, tasks: newTasks };
    }));

    try {
      const res = await transformImage(img, p, taskIndex, p.quantity);
      
      setActiveBatches(prev => prev.map(b => {
        if (b.id !== batchId) return b;
        const newTasks = [...b.tasks];
        newTasks[taskIndex] = { ...newTasks[taskIndex], status: 'success', result: res };
        return { ...b, tasks: newTasks };
      }));
      
      await saveToHistory(res);
    } catch (err: any) {
      setActiveBatches(prev => prev.map(b => {
        if (b.id !== batchId) return b;
        const newTasks = [...b.tasks];
        newTasks[taskIndex] = { ...newTasks[taskIndex], status: 'error', error: "生成失败" };
        return { ...b, tasks: newTasks };
      }));
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
    
    setActiveBatches(prev => [...prev, newBatch]);

    // 并行启动批次中的每个任务
    tasks.forEach((_, i) => {
      executeBatchTask(batchId, i, uploadedImage, { ...params });
    });
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  };

  const currentZoomBatch = zoomState ? activeBatches.find(b => b.id === zoomState.batchId) : null;
  const currentZoomTask = currentZoomBatch ? currentZoomBatch.tasks[zoomState!.taskIndex] : null;

  return (
    <div className="min-h-screen bg-[#F0F0F0] text-[#1A1A1A] flex flex-col font-sans selection:bg-black selection:text-white relative overflow-hidden">
      
      {/* 悬浮 LOGO - 固定左上角 */}
      <div className="fixed top-10 left-10 z-50 flex items-center gap-4 pointer-events-none">
        <div className="w-12 h-12 bg-black rounded-3xl flex items-center justify-center shadow-2xl pointer-events-auto">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="flex flex-col pointer-events-auto">
          <span className="font-black tracking-tighter text-2xl italic uppercase leading-none">AI NFT <span className="text-black/20">Minter</span></span>
        </div>
      </div>

      {/* 密钥状态 - 固定右上角 */}
      <div className="fixed top-10 right-10 z-50">
        <button 
          onClick={handleOpenKeySelector}
          className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl border backdrop-blur-xl transition-all ${hasKey ? 'bg-white/40 border-black/5 text-black/30' : 'bg-black text-white shadow-2xl scale-110'}`}
        >
          <div className={`w-2 h-2 rounded-full ${hasKey ? 'bg-green-500' : 'bg-white animate-pulse'}`}></div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">{hasKey ? 'API Connected' : 'Set API Key'}</span>
        </button>
      </div>

      {/* 滚动生成流 (Timeline) */}
      <main className="flex-1 overflow-y-auto pt-40 pb-72 px-8">
        <div className="max-w-2xl mx-auto space-y-24">
          
          {activeBatches.length === 0 && (
            <div className="h-[40vh] flex flex-col items-center justify-center space-y-6 opacity-10">
               <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth={1} />
               </svg>
               <p className="font-black uppercase tracking-[0.5em] text-xs">Waiting for prompt</p>
            </div>
          )}

          {activeBatches.map((batch) => (
            <div key={batch.id} className="space-y-8 animate-in slide-in-from-bottom-12 duration-1000">
              {/* 批次头部信息 (蓝框风格) */}
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg ring-[5px] ring-white shrink-0">
                  <img src={batch.uploadedImage} className="w-full h-full object-cover" alt="Source" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 mb-0.5">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-black/20">Now Minting</span>
                    <span className="text-[10px] font-bold text-black/10 tabular-nums">{formatTime(batch.timestamp)}</span>
                  </div>
                  <h3 className="font-black italic text-2xl tracking-tighter leading-tight text-[#111]">{batch.params.theme || "New Collection Project"}</h3>
                </div>
              </div>

              {/* 生成结果宫格 - 始终保持宫格布局，防止出现超级大图 */}
              <div className="grid grid-cols-2 gap-5 md:gap-8">
                {batch.tasks.map((task, idx) => (
                  <div 
                    key={task.id} 
                    className={`relative aspect-square rounded-[3.5rem] overflow-hidden bg-white border border-black/[0.03] shadow-2xl shadow-black/[0.02] transition-all duration-700 ${task.status === 'success' ? 'cursor-zoom-in hover:scale-[1.05] hover:shadow-black/[0.05]' : ''}`}
                    onClick={() => task.status === 'success' && setZoomState({ batchId: batch.id, taskIndex: idx })}
                  >
                    {task.status === 'success' && task.result ? (
                      <img src={task.result.url} className="w-full h-full object-cover" alt="Result" />
                    ) : task.status === 'loading' ? (
                      <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                         <div className="w-12 h-12 border-[5px] border-black/5 border-t-black rounded-full animate-spin"></div>
                         <span className="text-[11px] font-black uppercase text-black/20 tracking-[0.3em]">Rendering</span>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-black/5 font-black text-5xl italic tracking-tighter">#{idx + 1}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div ref={scrollEndRef} className="h-40" />
        </div>
      </main>

      {/* 精致悬浮输入栏 */}
      <div className="fixed bottom-0 left-0 right-0 p-10 lg:p-14 z-40 pointer-events-none">
        <div className="max-w-2xl mx-auto w-full pointer-events-auto" ref={settingsRef}>
          <div className="bg-white/95 backdrop-blur-2xl shadow-[0_50px_120px_rgba(0,0,0,0.12)] rounded-[3rem] p-4 border border-black/[0.03] ring-1 ring-black/[0.02]">
             <div className={`px-6 transition-all duration-700 ease-in-out ${showSettings ? 'max-h-[500px] opacity-100 py-8 mb-4 border-b border-black/5' : 'max-h-0 opacity-0 pointer-events-none overflow-hidden'}`}>
                <ControlPanel params={params} setParams={setParams} isLoading={false} />
             </div>

             <div className="flex items-center gap-5">
                {/* 头像上传 */}
                <div 
                  className={`relative w-16 h-16 rounded-3xl flex items-center justify-center transition-all cursor-pointer overflow-hidden ${uploadedImage ? 'ring-2 ring-black/10 shadow-inner' : 'bg-black/[0.03] border-2 border-dashed border-black/5 hover:bg-black/5'}`} 
                  onClick={() => document.getElementById('mainUpload')?.click()}
                >
                  {uploadedImage ? <img src={uploadedImage} className="w-full h-full object-cover" /> : <svg className="w-7 h-7 text-black/10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" strokeWidth={3}/></svg>}
                  <input id="mainUpload" type="file" className="hidden" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => setUploadedImage(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }} />
                </div>

                <div className="flex-1 px-1">
                  <input 
                    type="text" 
                    placeholder="输入本系列的核心主题..." 
                    className="w-full bg-transparent border-none focus:ring-0 text-lg font-black text-[#111] placeholder:text-black/10 py-1"
                    value={params.theme || ""}
                    onFocus={() => setShowSettings(true)}
                    onChange={(e) => setParams(prev => ({ ...prev, theme: e.target.value }))}
                  />
                  <div className="flex items-center gap-5 mt-1.5">
                    <button onClick={() => setShowSettings(!showSettings)} className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all ${showSettings ? 'bg-black text-white' : 'text-black/30 hover:text-black/60 hover:bg-black/5'}`}>艺术配置 SETTINGS</button>
                    <div className="h-4 w-[1px] bg-black/10"></div>
                    <div className="flex items-center gap-3.5">
                       <span className="text-[9px] font-black uppercase text-black/20 tracking-widest">数量</span>
                       <div className="flex items-center gap-3 bg-black/[0.03] rounded-xl px-2.5 py-0.5">
                          <button onClick={() => setParams(p => ({...p, quantity: Math.max(1, p.quantity-1)}))} className="text-[14px] font-black text-black/20 hover:text-black transition-colors">-</button>
                          <span className="text-[13px] font-black w-4 text-center tabular-nums">{params.quantity}</span>
                          <button onClick={() => setParams(p => ({...p, quantity: Math.min(6, p.quantity+1)}))} className="text-[14px] font-black text-black/20 hover:text-black transition-colors">+</button>
                       </div>
                    </div>
                  </div>
                </div>

                {/* 生成按钮 */}
                <button 
                  onClick={handleGenerate} 
                  disabled={!uploadedImage} 
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${uploadedImage ? 'bg-black text-white shadow-2xl hover:scale-105 active:scale-90' : 'bg-black/5 text-black/5 cursor-not-allowed'}`}
                >
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M5 10l7-7m0 0l7 7m-7-7v18" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* 高级大图浏览器 */}
      {zoomState && currentZoomBatch && currentZoomTask && currentZoomTask.result && (
        <div 
          className="fixed inset-0 z-[100] bg-white/40 backdrop-blur-3xl flex flex-col animate-in fade-in duration-500 cursor-default" 
          onClick={() => setZoomState(null)}
        >
           {/* Header */}
           <div className="h-28 px-12 flex items-center justify-between shrink-0" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-8">
                <button onClick={() => setZoomState(null)} className="p-4 hover:bg-black/5 rounded-3xl transition-all"><svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3}/></svg></button>
                <div className="h-8 w-[1px] bg-black/10"></div>
                <div>
                  <h4 className="text-base font-black uppercase italic tracking-widest">{currentZoomTask.result.theme}</h4>
                  <p className="text-[11px] font-black text-black/20 uppercase mt-0.5 tracking-wider">Minted at {formatTime(currentZoomBatch.timestamp)}</p>
                </div>
              </div>
              <button onClick={() => { const link = document.createElement('a'); link.href = currentZoomTask.result!.url; link.download = "minted-nft.png"; link.click(); }} className="bg-black text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all">Download Artwork</button>
           </div>

           {/* 预览中心 */}
           <div className="flex-1 flex flex-col items-center justify-center p-10 overflow-hidden">
              <div 
                className="w-full max-w-2xl aspect-square bg-white shadow-[0_60px_150px_rgba(0,0,0,0.18)] rounded-[5rem] overflow-hidden border border-white/60 ring-1 ring-black/5 animate-in zoom-in-95 duration-500" 
                onClick={(e) => e.stopPropagation()}
              >
                 <img key={currentZoomTask.id} src={currentZoomTask.result.url} className="w-full h-full object-cover animate-in fade-in duration-300" />
              </div>
              <div className="mt-14 text-center max-w-xl space-y-4 animate-in slide-in-from-bottom-6 duration-700" onClick={(e) => e.stopPropagation()}>
                 <h3 className="text-5xl font-black italic tracking-tighter leading-none">{currentZoomTask.result.theme}</h3>
                 <p className="text-black/50 text-base font-medium leading-relaxed px-10">{currentZoomTask.result.description}</p>
              </div>
           </div>

           {/* 批次缩略图导航 */}
           {currentZoomBatch.tasks.length > 1 && (
             <div className="h-48 flex items-center justify-center px-12" onClick={(e) => e.stopPropagation()}>
                <div className="max-w-4xl w-full flex items-center justify-center gap-8 overflow-x-auto custom-scrollbar h-full py-8">
                   {currentZoomBatch.tasks.map((task, idx) => (
                     <div 
                      key={task.id}
                      className={`h-28 aspect-square rounded-[2.5rem] overflow-hidden shrink-0 transition-all duration-300 cursor-pointer p-1.5 ${zoomState.taskIndex === idx ? 'scale-115' : 'opacity-25 hover:opacity-100 hover:scale-105'}`}
                      onClick={() => task.status === 'success' && setZoomState({ ...zoomState, taskIndex: idx })}
                     >
                        <div className={`w-full h-full rounded-[2.2rem] overflow-hidden transition-all duration-300 ${zoomState.taskIndex === idx ? 'ring-[6px] ring-black ring-offset-4 shadow-2xl' : ''}`}>
                          {task.status === 'success' ? (
                            <img src={task.result?.url} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-black/5 flex items-center justify-center text-[11px] font-black text-black/10">UNIT {idx + 1}</div>
                          )}
                        </div>
                     </div>
                   ))}
                </div>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default App;
