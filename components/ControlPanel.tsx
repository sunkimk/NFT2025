
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

  // 现在主题框是否禁用的逻辑仅取决于 randomizeTheme
  const isThemeDisabled = params.randomizeTheme;

  const labelClass = (isDisabled: boolean) => 
    `text-[11px] font-bold uppercase tracking-widest mb-2 block flex items-center justify-between transition-opacity duration-300 ${isDisabled ? 'text-appGray/40 opacity-40' : 'text-appGray opacity-100'}`;
  
  const selectClass = params.isRandom 
    ? "w-full bg-neutral-950/50 border border-appBorder/50 text-sm rounded-md p-3 text-appGray/40 cursor-not-allowed grayscale opacity-20 transition-all font-medium" 
    : "w-full bg-transparent border border-appBorder text-sm rounded-md p-3 text-white focus:border-accentGreen outline-none cursor-pointer hover:bg-white/5 transition-all font-medium";
  
  const inputClass = isThemeDisabled
    ? "w-full border border-appBorder/50 text-sm rounded-md p-3 text-appGray/40 bg-neutral-950/50 opacity-20 cursor-not-allowed grayscale transition-all placeholder:text-appGray/20"
    : "w-full bg-white/5 border border-appBorder text-sm rounded-md p-3 text-white focus:border-accentGreen outline-none transition-all placeholder:text-appGray/40";
    
  const sliderClass = `w-full h-[2px] appearance-none transition-all duration-300 ${params.isRandom ? 'bg-appBorder/30 cursor-not-allowed grayscale opacity-20' : 'bg-appBorder cursor-pointer'}`;

  return (
    <div className="space-y-8">
      {/* 灵感主题输入 */}
      <div className={`bg-accentGreen/5 border transition-colors duration-300 p-5 rounded-lg space-y-4 ${isThemeDisabled ? 'border-accentGreen/5 grayscale-[0.5]' : 'border-accentGreen/10'}`}>
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <label className={labelClass(isThemeDisabled)}>Creative Theme 创意主题</label>
            {/* 随机主题开关 - 默认始终展示 */}
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                className="hidden" 
                checked={params.randomizeTheme} 
                onChange={(e) => toggleRandomTheme(e.target.checked)}
              />
              <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-colors ${params.randomizeTheme ? 'bg-accentGreen border-accentGreen' : 'border-appBorder group-hover:border-accentGreen'}`}>
                {params.randomizeTheme && (
                  <svg className="w-2.5 h-2.5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="5">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${params.randomizeTheme ? 'text-accentGreen' : 'text-appGray group-hover:text-white'}`}>
                随机主题
              </span>
            </label>
          </div>
          
          <input 
            type="text" 
            placeholder={isThemeDisabled ? "AI 将自由构思惊艳的主题..." : "例如：西游记、赛博朋克、古埃及、未来机甲..."}
            className={inputClass}
            value={isThemeDisabled ? '' : (params.theme || '')}
            onChange={(e) => handleChange('theme', e.target.value)}
            disabled={isThemeDisabled}
          />
          <p className={`text-[10px] font-medium italic transition-opacity duration-300 ${isThemeDisabled ? 'text-accentGreen/20' : 'text-accentGreen/60'}`}>
            {isThemeDisabled ? '已启用“随机主题”，AI 将完全掌握创意方向' : '填写主题后，AI 将自动联想并重塑配件风格'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-appBorder pb-3">
        <h3 className="text-xs font-black uppercase tracking-widest">基础配置模式</h3>
        <label className="flex items-center gap-2 cursor-pointer group">
          <input 
            type="checkbox" 
            className="hidden" 
            checked={params.isRandom} 
            onChange={(e) => toggleRandom(e.target.checked)}
          />
          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${params.isRandom ? 'bg-accentGreen border-accentGreen' : 'border-appBorder group-hover:border-accentGreen'}`}>
            {params.isRandom && (
              <svg className="w-3 h-3 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${params.isRandom ? 'text-accentGreen' : 'text-appGray group-hover:text-white'}`}>
            开启随机生成模式
          </span>
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className={labelClass(params.isRandom)}>Material Style 材质</label>
          <select
            className={selectClass}
            value={params.style}
            onChange={(e) => handleChange('style', e.target.value)}
            disabled={params.isRandom}
          >
            {Object.values(AvatarStyle).map(s => <option key={s} value={s} className="bg-appCard">{s}</option>)}
          </select>
        </div>

        <div>
          <label className={labelClass(params.isRandom)}>Accessory 饰品</label>
          <select
            className={selectClass}
            value={params.accessory}
            onChange={(e) => handleChange('accessory', e.target.value)}
            disabled={params.isRandom}
          >
            {Object.values(Accessory).map(a => <option key={a} value={a} className="bg-appCard">{a}</option>)}
          </select>
        </div>

        <div>
          <label className={labelClass(params.isRandom)}>Clothing 服装</label>
          <select
            className={selectClass}
            value={params.clothing}
            onChange={(e) => handleChange('clothing', e.target.value)}
            disabled={params.isRandom}
          >
            {Object.values(Clothing).map(c => <option key={c} value={c} className="bg-appCard">{c}</option>)}
          </select>
        </div>

        <div>
          <label className={labelClass(params.isRandom)}>Background 背景</label>
          <select
            className={selectClass}
            value={params.background}
            onChange={(e) => handleChange('background', e.target.value)}
            disabled={params.isRandom}
          >
            {Object.values(Background).map(b => <option key={b} value={b} className="bg-appCard">{b}</option>)}
          </select>
        </div>
      </div>

      <div className="pt-2">
        <div className={`flex justify-between items-center mb-4 transition-opacity duration-300 ${params.isRandom ? 'opacity-20' : 'opacity-100'}`}>
          <label className="text-[11px] font-bold text-appGray uppercase tracking-widest block">Transformation Intensity 转化强度</label>
          <span className="text-xs font-mono text-accentGreen font-bold">{params.isRandom ? '85' : params.intensity}%</span>
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

      <div className="flex gap-4 pt-4">
        {/* Quantity Selector - Positioned to the left of the generate button */}
        <div className="flex items-center bg-appCard border border-appBorder rounded-md overflow-hidden min-w-[110px]">
          <div className="flex-1 px-3 flex flex-col items-center justify-center">
             <span className="text-[8px] font-black text-appGray uppercase tracking-tighter">Items</span>
             <span className="text-xl font-black text-white leading-none">{params.quantity}</span>
          </div>
          <div className="flex flex-col border-l border-appBorder bg-white/5">
            <button 
              onClick={() => updateQuantity(1)}
              disabled={params.quantity >= 9 || isLoading}
              className="px-2 py-1.5 hover:bg-accentGreen hover:text-black transition-colors border-b border-appBorder disabled:opacity-20 text-white"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M5 15l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button 
              onClick={() => updateQuantity(-1)}
              disabled={params.quantity <= 1 || isLoading}
              className="px-2 py-1.5 hover:bg-accentGreen hover:text-black transition-colors disabled:opacity-20 text-white"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>

        <button
          onClick={onGenerate}
          disabled={disabled || isLoading}
          className={`flex-1 py-4 rounded-md font-black uppercase tracking-tighter transition-all flex items-center justify-center gap-2 ${
            disabled || isLoading 
            ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed' 
            : 'bg-accentGreen text-black hover:scale-[1.01] active:scale-[0.98] shadow-[0_0_40px_rgba(201,255,0,0.2)]'
          }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{params.isRandom ? '正在随机铸造...' : '正在联想铸造...'}</span>
            </>
          ) : params.isRandom ? `随机铸造 (${params.quantity}张)` : `立即铸造 NFT (${params.quantity}张)`}
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
