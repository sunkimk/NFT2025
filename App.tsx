
import React, { useState, useRef, useEffect } from 'react';
import { GenerationParams, AvatarStyle, Accessory, Clothing, Background, GeneratedResult } from './types';
import { transformImage } from './services/geminiService';
import ControlPanel from './components/ControlPanel';

// Fix: Redefine the global AIStudio interface and extend the Window object correctly
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio: AIStudio;
  }
}

const App: React.FC = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [results, setResults] = useState<GeneratedResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoomIndex, setZoomIndex] = useState<number | null>(null);
  const [hasKey, setHasKey] = useState<boolean>(false);
  
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

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeyDialog = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // According to guidelines, assume selection was successful after triggering the dialog.
      setHasKey(true);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setResults([]);
        setError(null);
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
    
    try {
      const promises = Array.from({ length: params.quantity }).map(() => 
        transformImage(uploadedImage, params)
      );
      
      const res = await Promise.all(promises);
      
      if (!isCancelledRef.current) {
        setResults(res);
      }
    } catch (err: any) {
      if (!isCancelledRef.current) {
        const errorMsg = err.message || '铸造过程中发生错误。';
        setError(errorMsg);
        
        // If the request fails with this specific message, prompt for key selection again.
        if (errorMsg.includes("Requested entity was not found.")) {
          setHasKey(false);
          setError("API Key 已失效或未找到。请重新点击右上角按钮进行配置。");
          handleOpenKeyDialog();
        }
      }
    } finally {
      if (!isCancelledRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleStopTask = () => {
    isCancelledRef.current = true;
    setIsLoading(false);
    setResults([]);
    setError("生成任务已终止。");
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

  const getGridCols = (count: number) => {
    if (count === 1) return 'grid-cols-1';
    if (count <= 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    return 'grid-cols-3';
  };

  const seriesMetadata = results.length > 0 ? results[0] : null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* 全屏放大预览 Modal */}
      {zoomIndex !== null && results[zoomIndex] && (
        <div 
          className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-2xl flex flex-col items-center justify-center animate-in fade-in duration-300"
          onClick={() => setZoomIndex(null)}
        >
          <button 
            className="absolute top-8 right-8 text-white/40 hover:text-white transition-all p-2 z-[110] hover:rotate-90"
            onClick={() => setZoomIndex(null)}
          >
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {results.length > 1 && (
            <>
              <button 
                onClick={prevImage}
                className="absolute left-8 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all z-[110]"
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button 
                onClick={nextImage}
                className="absolute right-8 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all z-[110]"
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          <div className="relative flex flex-col items-center justify-center w-full max-w-6xl px-12" onClick={e => e.stopPropagation()}>
            <div className="w-full max-w-2xl mb-8 text-center animate-in slide-in-from-top-4 duration-500">
               <h3 className="text-accentGreen font-black text-3xl uppercase tracking-tighter mb-3 drop-shadow-[0_2px_10px_rgba(198,255,51,0.3)]">{results[zoomIndex].theme}</h3>
               <p className="text-white/90 text-base font-medium leading-relaxed max-w-xl mx-auto">{results[zoomIndex].description}</p>
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="relative shadow-[0_0_80px_rgba(0,0,0,0.6)] rounded-2xl overflow-hidden bg-black/20 border border-white/5 max-w-2xl">
                <img 
                  src={results[zoomIndex].url} 
                  alt="Zoomed NFT" 
                  className="w-full max-h-[55vh] object-contain cursor-default"
                />
              </div>
              
              <div className="flex flex-col items-center gap-6 py-4 min-w-[100px]">
                <button 
                  onClick={() => downloadImage(results[zoomIndex].url)}
                  className="bg-accentGreen text-black p-5 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all group"
                  title="下载原图"
                >
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-black text-accentGreen uppercase tracking-widest">下载图片</span>
                  <span className="text-[9px] font-bold text-white/40 uppercase tracking-tighter mt-1">{zoomIndex + 1} / {results.length}</span>
                </div>
              </div>
            </div>
          </div>

          {results.length > 1 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 p-3 bg-white/5 rounded-2xl backdrop-blur-md border border-white/10">
              {results.map((res, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setZoomIndex(idx); }}
                  className={`h-14 aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${zoomIndex === idx ? 'border-accentGreen' : 'border-transparent opacity-40 hover:opacity-100'}`}
                >
                  <img src={res.url} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <nav className="h-16 border-b border-appBorder bg-appDark flex items-center px-8 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-accentGreen flex items-center justify-center rounded-sm">
            <span className="text-black font-black text-[10px]">NC</span>
          </div>
          <span className="font-black text-sm tracking-[0.2em] uppercase">NFT Crafter</span>
        </div>
        
        <div className="ml-auto flex items-center gap-4 lg:gap-8">
          <div className="hidden md:flex gap-6 text-[11px] font-bold text-appGray tracking-widest uppercase items-center">
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="hover:text-accentGreen transition-colors text-[9px] opacity-60">计费说明</a>
            <a href="#" className="hover:text-white transition-colors">画廊</a>
            <a href="#" className="text-white">创作者中心</a>
          </div>

          {/* API Key 配置按钮 */}
          <button 
            onClick={handleOpenKeyDialog}
            className={`px-4 py-2 border rounded-sm text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
              hasKey 
                ? 'bg-white/5 border-accentGreen/30 text-accentGreen' 
                : 'bg-accentGreen text-black border-accentGreen shadow-[0_0_20px_rgba(198,255,51,0.2)] hover:scale-105'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
               <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {hasKey ? 'API KEY 已配置' : '配置 API KEY'}
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-[1500px] mx-auto w-full p-8 lg:p-12">
        <div className="mb-16 max-w-4xl">
          <div className="flex gap-2 mb-6">
            <span className="bg-white/5 text-accentGreen text-[10px] px-3 py-1 rounded font-bold uppercase tracking-widest border border-accentGreen/20">AI 跨维联想</span>
            <span className="bg-white/5 text-appGray text-[10px] px-3 py-1 rounded font-bold uppercase tracking-widest border border-appBorder">v2.5 FLASH PRO</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-black mb-8 leading-[1.1] tracking-tighter uppercase italic">
            打破次元 <span className="text-accentGreen">重塑艺术</span><br/>铸造多元艺术 NFT
          </h1>
          <p className="text-appGray text-lg max-w-2xl font-medium leading-relaxed">
            支持 2D 矢量、二次元、像素及 3D 渲染等多种艺术风格。输入关键词，AI 将自动跨越次元，为您重构极具收藏价值的数字资产。
          </p>
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
                      <button 
                        onClick={(e) => { e.stopPropagation(); document.getElementById('fileInput')?.click(); }}
                        className="bg-white text-black px-4 py-2 rounded-sm font-black text-[10px] uppercase tracking-tighter"
                      >
                        更换
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setUploadedImage(null); setResults([]); }}
                        className="bg-red-500 text-white px-4 py-2 rounded-sm font-black text-[10px] uppercase tracking-tighter"
                      >
                        删除
                      </button>
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
               <ControlPanel 
                  params={params} 
                  setParams={setParams} 
                  onGenerate={handleGenerate} 
                  isLoading={isLoading} 
                  disabled={!uploadedImage}
               />
            </section>
          </div>

          <div className="lg:col-span-7 space-y-8">
            <section className="bg-appCard border border-appBorder rounded-lg overflow-hidden flex flex-col shadow-2xl">
              <div className="p-4 border-b border-appBorder flex justify-between items-center bg-white/5">
                <span className="text-[10px] font-black uppercase tracking-widest text-white">铸造预览 {results.length > 0 ? `(${results.length})` : ''}</span>
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500/20"></div>
                  <div className="w-2 h-2 rounded-full bg-yellow-500/20"></div>
                  <div className="w-2 h-2 rounded-full bg-green-500/20"></div>
                </div>
              </div>
              
              <div className="aspect-[4/3] lg:aspect-video bg-black p-2 group flex items-center justify-center">
                {results.length > 0 ? (
                  <div className={`grid h-full w-full gap-2 ${getGridCols(results.length)}`}>
                    {results.map((res, idx) => (
                      <div 
                        key={idx}
                        className="relative cursor-zoom-in overflow-hidden group/item bg-neutral-900 flex items-center justify-center border border-white/5 rounded"
                        onClick={() => setZoomIndex(idx)}
                      >
                        <img 
                          src={res.url} 
                          alt={`NFT Result ${idx + 1}`} 
                          className="w-full h-full object-contain transition-transform duration-500 group-hover/item:scale-105" 
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none">
                          <button 
                            onClick={(e) => downloadImage(res.url, e)}
                            className="absolute bottom-3 right-3 bg-accentGreen text-black p-2.5 rounded-full shadow-2xl hover:bg-white transition-all hover:scale-110 active:scale-90 pointer-events-auto"
                          >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : isLoading ? (
                  <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-20 h-20 mb-8 relative">
                      <div className="absolute inset-0 border-[4px] border-appBorder rounded-full"></div>
                      <div className="absolute inset-0 border-t-[4px] border-accentGreen rounded-full animate-spin"></div>
                    </div>
                    <p className="text-sm font-black text-accentGreen uppercase tracking-[0.2em] animate-pulse">AI 正在进行艺术跨维重塑 ({params.quantity}张)...</p>
                    
                    <button 
                      onClick={handleStopTask}
                      className="mt-10 px-8 py-3 border border-white/10 text-white/40 hover:border-red-500/50 hover:text-red-500 hover:bg-red-500/5 transition-all text-[10px] font-black uppercase tracking-widest rounded bg-white/5 active:scale-95"
                    >
                      取消生成
                    </button>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center space-y-6 px-12">
                    <div className="w-16 h-16 bg-white/5 border border-appBorder rounded-xl flex items-center justify-center mx-auto opacity-30">
                      <svg className="w-8 h-8 text-appGray" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-appGray text-xs font-black uppercase tracking-[0.3em] font-black">准备就绪</p>
                      <p className="text-appGray/40 text-[10px] uppercase mt-2">选择您心仪的艺术次元开始创作</p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {results.length > 0 && seriesMetadata && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-accentGreen/5 border border-accentGreen/20 rounded-lg p-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="text-[10px] font-black text-accentGreen uppercase tracking-widest">系列主题</h3>
                  <p className="text-white text-2xl font-black italic uppercase tracking-tighter">{seriesMetadata.theme}</p>
                  <div className="flex gap-4 pt-2 border-t border-accentGreen/10">
                    <div className="flex-1">
                      <span className="text-[9px] font-black text-accentGreen/40 uppercase block mb-1">铸造数量</span>
                      <span className="text-white text-xs font-bold">{params.quantity} 件资产</span>
                    </div>
                    <div className="flex-1">
                      <span className="text-[9px] font-black text-accentGreen/40 uppercase block mb-1">风格等级</span>
                      <span className="text-accentGreen text-xs font-bold">LEGENDARY</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/5 border border-appBorder rounded-lg p-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <h3 className="text-[10px] font-black text-appGray uppercase tracking-widest">设计描述</h3>
                  <p className="text-white/70 text-sm font-medium leading-relaxed">{seriesMetadata.description}</p>
                </div>
              </div>
            )}

            <div className="bg-appCard border border-appBorder rounded-lg p-6 lg:p-8">
              <h3 className="text-[10px] font-black text-appGray uppercase tracking-[0.2em] mb-6 italic border-b border-appBorder pb-3">NFT CRAFTER 核心优势</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="w-1.5 h-1.5 bg-accentGreen rounded-full mb-3"></div>
                  <h4 className="text-xs font-black text-white uppercase">次元跨越</h4>
                  <p className="text-[10px] text-appGray leading-relaxed font-medium">在 2D 与 3D 之间自由切换，探索多种视觉边界</p>
                </div>
                <div className="space-y-2">
                  <div className="w-1.5 h-1.5 bg-appGray rounded-full mb-3"></div>
                  <h4 className="text-xs font-black text-white uppercase">无限联想</h4>
                  <p className="text-[10px] text-appGray leading-relaxed font-medium">AI 深度理解关键词，自动补充极具美感的视觉细节</p>
                </div>
                <div className="space-y-2">
                  <div className="w-1.5 h-1.5 bg-appGray rounded-full mb-3"></div>
                  <h4 className="text-xs font-black text-white uppercase">专属铸造</h4>
                  <p className="text-[10px] text-appGray leading-relaxed font-medium">支持批量生成高一致性系列，打造您的专属收藏库</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-12 p-5 bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] font-bold rounded uppercase tracking-widest text-center animate-bounce">
            错误提示: {error}
          </div>
        )}
      </main>

      <footer className="mt-20 border-t border-appBorder py-12 px-8 bg-black">
        <div className="max-w-[1400px] mx-auto flex flex-col items-center justify-center gap-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <span className="text-appGray text-[10px] font-black uppercase tracking-widest text-center">© 2024 NFT Crafter Studio</span>
            <div className="hidden md:block h-4 w-[1px] bg-appBorder"></div>
            <span className="text-appGray text-[10px] font-black uppercase tracking-widest text-center">Powered by Gemini AI Engine</span>
            <div className="hidden md:block h-4 w-[1px] bg-appBorder"></div>
            <span className="text-appGray text-[10px] font-black uppercase tracking-widest text-center">Design by Sunkim</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
