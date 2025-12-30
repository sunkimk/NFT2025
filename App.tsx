import React, { useState, useRef, useEffect } from 'react';
import { GenerationParams, AvatarStyle, Accessory, Clothing, Background, GeneratedResult } from './types';
import { transformImage } from './services/geminiService';
import { saveToHistory, getAllHistory } from './services/dbService';
import ControlPanel from './components/ControlPanel';
import HistoryGallery from './components/HistoryGallery';

const App: React.FC = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [results, setResults] = useState<GeneratedResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoomIndex, setZoomIndex] = useState<number | null>(null);
  const [currentExpectedCount, setCurrentExpectedCount] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);
  
  const isCancelledRef = useRef(false);
  
  const initialParams: GenerationParams = {
    style: AvatarStyle.MATTE_CLAY,
    accessory: Accessory.SUNGLASSES,
    clothing: Clothing.HOODIE,
    background: Background.PASTEL_RAINBOW,
    intensity: 75,
    theme: '',
    isRandom: false,
    randomizeTheme: false,
    quantity: 1
  };

  const [params, setParams] = useState<GenerationParams>(initialParams);

  // 初始化加载历史数量
  useEffect(() => {
    const updateCount = async () => {
      const items = await getAllHistory();
      setHistoryCount(items.length);
    };
    updateCount();
  }, [showGallery, results]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setResults([]);
        setError(null);
        setCurrentExpectedCount(0);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!uploadedImage) return;
    setIsLoading(true);
    setError(null);
    setResults([]);
    isCancelledRef.current = false;
    setCurrentExpectedCount(params.quantity);

    const totalCount = params.quantity;
    let completedCount = 0;
    let successCount = 0;
    
    Array.from({ length: totalCount }).forEach(async (_, index) => {
      try {
        const res = await transformImage(uploadedImage, params, index, totalCount);
        if (!isCancelledRef.current) {
          setResults(prev => [...prev, res]);
          successCount++;
          // 自动保存到历史记录
          await saveToHistory(res);
        }
      } catch (err: any) {
        console.error(`Task ${index} failed:`, err);
      } finally {
        completedCount++;
        if (completedCount === totalCount) {
          setIsLoading(false);
          if (successCount === 0 && !isCancelledRef.current) {
            setError("铸造失败：模型未能生成图像，请尝试调整参数或重试。");
          }
        }
      }
    });
  };

  const handleStopTask = () => {
    isCancelledRef.current = true;
    setIsLoading(false);
    setError("任务已由用户手动终止。");
  };

  const downloadImage = (url: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const link = document.createElement('a');
    link.href = url;
    link.download = `nft-avatar-${Date.now()}.png`;
    link.click();
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (zoomIndex !== null) {
      setZoomIndex((zoomIndex + 1) % results.length);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (zoomIndex !== null) {
      setZoomIndex((zoomIndex - 1 + results.length) % results.length);
    }
  };

  const getGridCols = () => {
    const target = currentExpectedCount || params.quantity;
    if (target === 1) return 'grid-cols-1';
    if (target <= 2) return 'grid-cols-2';
    if (target <= 4) return 'grid-cols-2';
    return 'grid-cols-3';
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-accentGreen selection:text-black bg-black">
      {/* 历史记录画廊 Overlay */}
      {showGallery && <HistoryGallery onClose={() => setShowGallery(false)} />}

      {/* 全屏预览 Modal */}
      {zoomIndex !== null && results[zoomIndex] && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-3xl flex flex-col items-center justify-center animate-in fade-in duration-500 ease-out cursor-pointer"
          onClick={() => setZoomIndex(null)}
        >
          <button className="absolute top-8 right-8 text-white/20 hover:text-white transition-all p-2 z-[110] hover:rotate-90 duration-300">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {results.length > 1 && (
            <>
              <button onClick={prevImage} className="absolute left-8 top-1/2 -translate-y-1/2 p-5 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all z-[110] group">
                <svg className="w-10 h-10 transform group-active:scale-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button onClick={nextImage} className="absolute right-8 top-1/2 -translate-y-1/2 p-5 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all z-[110] group">
                <svg className="w-10 h-10 transform group-active:scale-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          <div className="relative flex flex-col items-center max-w-7xl w-full px-12 animate-in zoom-in-95 fade-in duration-500 ease-out cursor-default">
            <div className="w-full max-w-4xl mb-12 text-center" onClick={e => e.stopPropagation()}>
               <h3 className="text-accentGreen font-black text-5xl lg:text-6xl uppercase tracking-tighter mb-6 drop-shadow-[0_4px_30px_rgba(198,255,51,0.5)] italic">{results[zoomIndex].theme}</h3>
               <p className="text-white/70 text-xl font-medium leading-relaxed max-w-2xl mx-auto tracking-wide">{results[zoomIndex].description}</p>
            </div>

            <div className="relative flex items-center justify-center">
              <div 
                className="relative shadow-[0_20px_100px_rgba(0,0,0,0.9)] rounded-[2.5rem] overflow-hidden bg-black/40 border border-white/10 ring-1 ring-white/10 transition-transform duration-700 hover:scale-[1.02]"
                onClick={e => e.stopPropagation()}
              >
                <img src={results[zoomIndex].url} alt="Zoomed NFT" className="w-auto max-w-full max-h-[55vh] object-contain" />
              </div>

              <div className="absolute left-[calc(100%+2.5rem)] bottom-0 flex flex-col items-center gap-4 animate-in slide-in-from-left-8 duration-700 delay-150" onClick={e => e.stopPropagation()}>
                <button 
                  onClick={() => downloadImage(results[zoomIndex].url)} 
                  className="bg-accentGreen text-black p-7 rounded-3xl shadow-[0_15px_50px_rgba(198,255,51,0.4)] hover:scale-115 active:scale-90 transition-all hover:bg-white hover:rotate-3 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/40 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  <svg className="w-10 h-10 relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <div className="flex flex-col items-center space-y-1">
                  <span className="text-[11px] font-black text-accentGreen uppercase tracking-[0.2em] whitespace-nowrap opacity-80">Download</span>
                  <span className="text-[10px] font-bold text-white/20 uppercase tracking-tighter">{zoomIndex + 1} / {results.length}</span>
                </div>
              </div>
            </div>
          </div>

          {results.length > 1 && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-5 p-4 bg-white/5 rounded-[2rem] backdrop-blur-2xl border border-white/10 shadow-2xl animate-in slide-in-from-bottom-8 duration-500 delay-200" onClick={e => e.stopPropagation()}>
              {results.map((res, idx) => (
                <button 
                  key={idx} 
                  onClick={(e) => { e.stopPropagation(); setZoomIndex(idx); }} 
                  className={`h-20 aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-300 hover:scale-110 ${zoomIndex === idx ? 'border-accentGreen shadow-[0_0_25px_rgba(198,255,51,0.6)]' : 'border-transparent opacity-30 hover:opacity-100'}`}
                >
                  <img src={res.url} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Navigation Header */}
      <nav className="h-16 border-b border-appBorder bg-appDark/80 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-accentGreen flex items-center justify-center rounded-sm">
            <span className="text-black font-black text-[10px]">AG</span>
          </div>
          <span className="font-black text-sm tracking-[0.2em] uppercase">AI NFT Generator</span>
        </div>
        
        <button 
          onClick={() => setShowGallery(true)}
          className="flex items-center gap-3 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all group"
        >
          <span className="text-[10px] font-black uppercase tracking-widest text-appGray group-hover:text-white">画廊 History</span>
          <div className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-accentGreen rounded text-[10px] font-black text-black">
            {historyCount}
          </div>
        </button>
      </nav>

      <main className="flex-1 max-w-[1500px] mx-auto w-full p-8 lg:p-12">
        <div className="mb-12">
            <div className="flex gap-2 mb-6">
              <span className="bg-white/5 text-accentGreen text-[10px] px-3 py-1 rounded font-bold uppercase tracking-widest border border-accentGreen/20">AI 跨维重塑引擎</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black mb-8 leading-[1.3] tracking-tighter uppercase italic">
              打破次元 <span className="text-accentGreen">重塑艺术</span><br/>
              铸造 <span className="bg-accentGreen text-black px-2 lg:px-4 py-1 inline-block -mt-1 lg:-mt-2 italic">限量数字收藏</span>
            </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-5 space-y-8">
            <section className="bg-appCard border border-appBorder rounded-lg p-6 lg:p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black uppercase italic tracking-tighter">01. 素材上传</h2>
                <span className="text-[10px] text-appGray font-bold uppercase tracking-widest">Source</span>
              </div>
              <div 
                className={`relative aspect-[16/10] rounded border border-dashed transition-all flex flex-col items-center justify-center overflow-hidden bg-black/40 ${
                  uploadedImage ? 'border-accentGreen/40' : 'border-appBorder hover:border-accentGreen/60 cursor-pointer'
                }`}
                onClick={() => !uploadedImage && document.getElementById('fileInput')?.click()}
              >
                {uploadedImage ? (
                  <div className="w-full h-full group relative">
                    <img src={uploadedImage} alt="Uploaded" className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                      <button onClick={(e) => { e.stopPropagation(); document.getElementById('fileInput')?.click(); }} className="bg-white text-black px-4 py-2 rounded-sm font-black text-[10px] uppercase tracking-tighter">更换</button>
                      <button onClick={(e) => { e.stopPropagation(); setUploadedImage(null); setResults([]); setCurrentExpectedCount(0); }} className="bg-red-500 text-white px-4 py-2 rounded-sm font-black text-[10px] uppercase tracking-tighter">删除</button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <div className="w-10 h-10 bg-white/5 rounded flex items-center justify-center mx-auto mb-4 border border-appBorder">
                       <svg className="w-5 h-5 text-accentGreen" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                         <path d="M12 4v16m8-8H4" strokeLinecap="round" />
                       </svg>
                    </div>
                    <p className="text-white font-bold text-[12px] tracking-widest uppercase">点击上传角色</p>
                  </div>
                )}
                <input id="fileInput" type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
              </div>
            </section>

            <section className="bg-appCard border border-appBorder rounded-lg p-6 lg:p-8">
               <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-black uppercase italic tracking-tighter">02. 参数配置</h2>
                  <span className="text-[10px] text-appGray font-bold uppercase tracking-widest">Config</span>
               </div>
               <ControlPanel params={params} setParams={setParams} onGenerate={handleGenerate} isLoading={isLoading} disabled={!uploadedImage} />
            </section>
          </div>

          <div className="lg:col-span-7 space-y-8">
            <section className="bg-appCard border border-appBorder rounded-xl overflow-hidden flex flex-col shadow-2xl relative min-h-[500px]">
              <div className="p-4 border-b border-appBorder flex justify-between items-center bg-white/5">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">当前铸造进度 Preview</span>
                  {results.length > 0 && <span className="text-[10px] bg-accentGreen/10 text-accentGreen px-2 py-0.5 rounded font-black">{results.length} / {currentExpectedCount || params.quantity}</span>}
                </div>
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500/20"></div>
                  <div className="w-2 h-2 rounded-full bg-yellow-500/20"></div>
                  <div className="w-2 h-2 rounded-full bg-green-500/20"></div>
                </div>
              </div>
              
              <div className="flex-1 bg-neutral-950 p-6">
                {(results.length > 0 || isLoading) ? (
                  <div className={`grid gap-4 h-full ${getGridCols()}`}>
                    {Array.from({ length: currentExpectedCount || params.quantity }).map((_, idx) => {
                      const result = results[idx];
                      if (result) {
                        return (
                          <div 
                            key={`res-${idx}`}
                            className="relative aspect-square cursor-zoom-in overflow-hidden group/item bg-black border border-white/5 rounded-2xl animate-in fade-in zoom-in-95 duration-700" 
                            onClick={() => setZoomIndex(idx)}
                          >
                            <img src={result.url} alt={`NFT Result ${idx}`} className="w-full h-full object-contain transition-transform duration-700 group-hover/item:scale-105" />
                            {/* Hover 下载按钮 - 调整至右下角 */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-end justify-end p-4">
                               <button onClick={(e) => downloadImage(result.url, e)} className="bg-accentGreen text-black p-3 rounded-xl shadow-2xl hover:bg-white transition-all hover:scale-110 active:scale-90">
                                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                               </button>
                            </div>
                          </div>
                        );
                      } else if (isLoading) {
                        return (
                          <div key={`loading-${idx}`} className="relative aspect-square border border-dashed border-white/10 rounded-2xl bg-white/[0.02] flex flex-col items-center justify-center overflow-hidden">
                             <div className="absolute inset-0 bg-gradient-to-br from-accentGreen/5 to-transparent animate-pulse"></div>
                             <div className="w-10 h-10 border-2 border-white/5 border-t-accentGreen rounded-full animate-spin mb-4"></div>
                             <span className="text-[10px] font-black text-accentGreen/40 uppercase tracking-[0.2em] animate-pulse">Minting...</span>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center space-y-8 py-20">
                    <div className="relative">
                      <div className="w-20 h-20 bg-white/5 border border-appBorder rounded-2xl flex items-center justify-center opacity-30">
                        <svg className="w-10 h-10 text-appGray" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                          <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round"/>
                        </svg>
                      </div>
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-appGray text-sm font-black uppercase tracking-[0.4em]">Ready to Re-Build</p>
                      <p className="text-appGray/30 text-[10px] uppercase tracking-widest">设置参数后点击下方铸造按钮即可开始创作</p>
                    </div>
                  </div>
                )}
              </div>

              {isLoading && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
                  <button onClick={handleStopTask} className="px-8 py-3 bg-black/60 backdrop-blur-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-all text-[10px] font-black uppercase tracking-widest rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.5)] active:scale-95">
                    终止当前铸造任务
                  </button>
                </div>
              )}
            </section>

            {/* 恢复并优化产品功能介绍区块 (在预览图下方展示) */}
            {results.length > 0 && !isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-6 duration-700">
                <div className="bg-accentGreen/5 border border-accentGreen/20 rounded-xl p-6 space-y-4 shadow-[0_10px_40px_rgba(198,255,51,0.05)]">
                  <h3 className="text-[10px] font-black text-accentGreen uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-accentGreen rounded-full animate-pulse"></span>
                    Collection Theme
                  </h3>
                  <p className="text-white text-2xl font-black italic uppercase tracking-tighter">{results[results.length-1].theme}</p>
                </div>
                <div className="bg-white/5 border border-appBorder rounded-xl p-6 space-y-4 shadow-xl">
                  <h3 className="text-[10px] font-black text-appGray uppercase tracking-widest">AI Creation Log</h3>
                  <p className="text-white/70 text-sm font-medium leading-relaxed italic">{results[results.length-1].description}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-12 p-6 bg-red-500/10 border border-red-500/20 text-red-500 text-[12px] font-black rounded-xl uppercase tracking-widest text-center animate-in fade-in slide-in-from-top-4">
            Warning: {error}
          </div>
        )}
      </main>

      <footer className="mt-20 border-t border-appBorder py-12 px-8 opacity-50">
        <div className="max-w-[1400px] mx-auto flex flex-col items-center justify-center gap-2">
          <span className="text-appGray text-[10px] font-black uppercase tracking-widest">© 2024 Sunkim AI Multi-Verse Engine</span>
        </div>
      </footer>
    </div>
  );
};

export default App;