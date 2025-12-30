
import React from 'react';
import { AvatarStyle, Accessory, Clothing, Background, GenerationParams } from '../types';

interface ControlPanelProps {
  params: GenerationParams;
  setParams: React.Dispatch<React.SetStateAction<GenerationParams>>;
  onGenerate: () => void;
  isLoading: boolean;
  disabled: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ params, setParams, onGenerate, isLoading, disabled }) => {
  const handleChange = (field: keyof GenerationParams, value: any) => {
    setParams(prev => ({ ...prev, [field]: value }));
  };

  const toggleRandom = (checked: boolean) => {
    setParams(prev => ({ ...prev, isRandom: checked }));
  };

  const toggleRandomTheme = (checked: boolean) => {
    setParams(prev => ({ ...prev, randomizeTheme: checked }));
  };

  const updateQuantity = (delta: number) => {
    const nextVal = Math.max(1, Math.min(9, params.quantity + delta));
    handleChange('quantity', nextVal);
  };

  const isThemeDisabled = params.randomizeTheme;

  const sectionTitleClass = "text-[10px] font-black uppercase tracking-[0.2em] text-accentGreen/60 mb-3 flex items-center gap-2";
  
  const labelClass = (isDisabled: boolean) => 
    `text-[9px] font-bold uppercase tracking-widest mb-1.5 block transition-opacity duration-300 ${isDisabled ? 'text-appGray/40' : 'text-appGray'}`;
  
  const selectClass = (isDisabled: boolean) => 
    isDisabled 
    ? "w-full bg-neutral-950/30 border border-appBorder/50 text-[13px] rounded p-2.5 text-appGray/20 cursor-not-allowed opacity-40 transition-all" 
    : "w-full bg-black/40 border border-appBorder text-[13px] rounded p-2.5 text-white focus:border-accentGreen outline-none cursor-pointer hover:bg-white/5 transition-all";
  
  const inputClass = isThemeDisabled
    ? "w-full border border-appBorder/50 text-[13px] rounded p-2.5 text-appGray/20 bg-neutral-950/30 opacity-40 cursor-not-allowed transition-all"
    : "w-full bg-white/5 border border-appBorder text-[13px] rounded p-2.5 text-white focus:border-accentGreen outline-none transition-all placeholder:text-appGray/30";
    
  const sliderClass = `w-full h-[2px] appearance-none transition-all duration-300 ${params.isRandom ? 'bg-appBorder/30 cursor-not-allowed opacity-20' : 'bg-appBorder cursor-pointer'}`;

  return (
    <div className="space-y-5">
      {/* 01. 创意灵感 - 紧凑型 */}
      <div className="bg-appCard/40 border border-appBorder p-3.5 rounded-lg transition-all">
        <div className="flex justify-between items-center mb-2.5">
          <h3 className={sectionTitleClass}>
            <span className="w-1 h-1 bg-accentGreen rounded-full"></span>
            Theme Concept
          </h3>
          <label className="flex items-center gap-1.5 cursor-pointer group">
            <input type="checkbox" className="hidden" checked={params.randomizeTheme} onChange={(e) => toggleRandomTheme(e.target.checked)} />
            <div className={`w-3 h-3 rounded-sm border transition-colors ${params.randomizeTheme ? 'bg-accentGreen border-accentGreen' : 'border-appBorder group-hover:border-accentGreen'}`}>
              {params.randomizeTheme && <svg className="w-2.5 h-2.5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="5"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-tighter ${params.randomizeTheme ? 'text-accentGreen' : 'text-appGray'}`}>AI 随机主题</span>
          </label>
        </div>
        <input 
          type="text" 
          placeholder={isThemeDisabled ? "AI 将自由构思惊艳的主题..." : "输入关键词（如：赛博、西游、废土...）"}
          className={inputClass}
          value={isThemeDisabled ? '' : (params.theme || '')}
          onChange={(e) => handleChange('theme', e.target.value)}
          disabled={isThemeDisabled}
        />
      </div>

      {/* 02. 艺术风格与背景 - 并排布局以节省高度 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-appCard/40 border border-appBorder p-3.5 rounded-lg">
          <label className={labelClass(false)}>材质风格 Material</label>
          <select
            className={selectClass(false)}
            value={params.style}
            onChange={(e) => handleChange('style', e.target.value)}
          >
            {Object.values(AvatarStyle).map(s => <option key={s} value={s} className="bg-appCard">{s}</option>)}
          </select>
        </div>
        <div className="bg-appCard/40 border border-appBorder p-3.5 rounded-lg">
          <label className={labelClass(false)}>场景背景 Env</label>
          <select
            className={selectClass(false)}
            value={params.background}
            onChange={(e) => handleChange('background', e.target.value)}
          >
            {Object.values(Background).map(b => <option key={b} value={b} className="bg-appCard">{b}</option>)}
          </select>
        </div>
      </div>

      {/* 03. 核心配饰 - 全随机仅影响此模块 */}
      <div className="bg-appCard/60 border border-accentGreen/10 p-4 rounded-lg space-y-4">
        <div className="flex justify-between items-center border-b border-appBorder pb-2.5">
          <h3 className={sectionTitleClass}>Details & Config</h3>
          <label className="flex items-center gap-1.5 cursor-pointer group">
            <input type="checkbox" className="hidden" checked={params.isRandom} onChange={(e) => toggleRandom(e.target.checked)} />
            <div className={`w-3.5 h-3.5 rounded-sm border transition-colors ${params.isRandom ? 'bg-accentGreen border-accentGreen' : 'border-appBorder group-hover:border-accentGreen'}`}>
              {params.isRandom && <svg className="w-2.5 h-2.5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="5"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-tighter ${params.isRandom ? 'text-accentGreen' : 'text-appGray'}`}>细节随机</span>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass(params.isRandom)}>饰品配件</label>
            <select
              className={selectClass(params.isRandom)}
              value={params.accessory}
              onChange={(e) => handleChange('accessory', e.target.value)}
              disabled={params.isRandom}
            >
              {Object.values(Accessory).map(a => <option key={a} value={a} className="bg-appCard">{a}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass(params.isRandom)}>服装款式</label>
            <select
              className={selectClass(params.isRandom)}
              value={params.clothing}
              onChange={(e) => handleChange('clothing', e.target.value)}
              disabled={params.isRandom}
            >
              {Object.values(Clothing).map(c => <option key={c} value={c} className="bg-appCard">{c}</option>)}
            </select>
          </div>
        </div>

        <div className="pt-1">
          <div className={`flex justify-between items-end mb-2 transition-opacity ${params.isRandom ? 'opacity-20' : 'opacity-100'}`}>
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-appGray uppercase tracking-widest">重构强度</label>
              <span className="text-[8px] text-appGray/50 uppercase font-medium">调整 AI 偏离原图的创意自由度</span>
            </div>
            <span className="text-[10px] font-mono text-accentGreen font-bold">{params.isRandom ? '85' : params.intensity}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={params.isRandom ? 85 : params.intensity}
            onChange={(e) => handleChange('intensity', parseInt(e.target.value))}
            disabled={params.isRandom}
            className={sliderClass}
          />
        </div>
      </div>

      {/* 铸造控制台 */}
      <div className="flex gap-3 pt-1">
        <div className="flex items-center bg-black/40 border border-appBorder rounded-md overflow-hidden h-14">
          <div className="px-3 flex flex-col items-center justify-center min-w-[50px]">
             <span className="text-[7px] font-black text-appGray uppercase">QTY</span>
             <span className="text-lg font-black text-white leading-none">{params.quantity}</span>
          </div>
          <div className="flex flex-col border-l border-appBorder h-full">
            <button onClick={() => updateQuantity(1)} disabled={params.quantity >= 9 || isLoading} className="flex-1 px-3 hover:bg-accentGreen hover:text-black transition-colors border-b border-appBorder disabled:opacity-20 text-white flex items-center">
              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M5 15l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button onClick={() => updateQuantity(-1)} disabled={params.quantity <= 1 || isLoading} className="flex-1 px-3 hover:bg-accentGreen hover:text-black transition-colors disabled:opacity-20 text-white flex items-center">
              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>

        <button
          onClick={onGenerate}
          disabled={disabled || isLoading}
          className={`flex-1 rounded-md font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 h-14 ${
            disabled || isLoading 
            ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed' 
            : 'bg-accentGreen text-black hover:brightness-110 active:scale-[0.98] shadow-lg shadow-accentGreen/10'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-xs">铸造中...</span>
            </div>
          ) : <span className="text-sm">铸造 NFT ({params.quantity})</span>}
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
