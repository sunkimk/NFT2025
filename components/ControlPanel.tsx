
import React from 'react';
import { AvatarStyle, Accessory, Clothing, Background, GenerationParams } from '../types';

interface ControlPanelProps {
  params: GenerationParams;
  setParams: React.Dispatch<React.SetStateAction<GenerationParams>>;
  isLoading: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ params, setParams, isLoading }) => {
  const handleChange = (field: keyof GenerationParams, value: any) => {
    setParams(prev => ({ ...prev, [field]: value }));
  };

  const labelClass = "text-[9px] font-black uppercase tracking-[0.2em] text-black/30 mb-2 block";
  
  const selectClass = (isDisabled: boolean) => 
    `w-full bg-white border ${isDisabled ? 'border-transparent opacity-20 cursor-not-allowed' : 'border-black/5 hover:border-black/20 focus:border-black focus:ring-4 focus:ring-black/5'} rounded-xl p-2.5 text-[11px] font-bold transition-all outline-none appearance-none cursor-pointer pr-8 shadow-sm`;

  return (
    <div className="space-y-6 py-2">
      {/* 第一排：核心视觉 (Core Visuals) - 艺术材质与背景 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>艺术材质 Style</label>
          <div className="relative group">
            <select className={selectClass(false)} value={params.style} onChange={(e) => handleChange('style', e.target.value)}>
              {Object.values(AvatarStyle).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 9l-7 7-7-7" strokeWidth={3}/></svg>
            </div>
          </div>
        </div>

        <div>
          <label className={labelClass}>场景背景 Background</label>
          <div className="relative group">
            <select className={selectClass(false)} value={params.background} onChange={(e) => handleChange('background', e.target.value)}>
              {Object.values(Background).map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 9l-7 7-7-7" strokeWidth={3}/></svg>
            </div>
          </div>
        </div>
      </div>

      {/* 第二排：细节定制 (Details) - 服装与配饰 */}
      <div className="space-y-4 pt-4 border-t border-black/5">
        <div className="flex items-center justify-between">
          <label className="text-[9px] font-black uppercase tracking-[0.2em] text-black/30 block">细节定制 Details</label>
          <div className="flex items-center gap-3 bg-black/5 px-3 py-1.5 rounded-full hover:bg-black/10 transition-colors cursor-pointer" onClick={() => handleChange('isRandom', !params.isRandom)}>
             <span className="text-[8px] font-black uppercase text-black/40">自动随机 Auto Random</span>
             <div className={`relative w-8 h-4 rounded-full transition-colors duration-300 ${params.isRandom ? 'bg-black' : 'bg-black/10'}`}>
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-300 shadow-sm ${params.isRandom ? 'left-4.5' : 'left-0.5'}`}></div>
            </div>
          </div>
        </div>
        
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-500 ${params.isRandom ? 'opacity-30 pointer-events-none scale-[0.98]' : 'opacity-100'}`}>
          <div className="relative group">
            <span className="absolute left-3 top-[-6px] bg-white px-1 text-[8px] font-black text-black/20 uppercase z-10">服装 Clothing</span>
            <select className={selectClass(params.isRandom)} value={params.clothing} onChange={(e) => handleChange('clothing', e.target.value)}>
              {Object.values(Clothing).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 9l-7 7-7-7" strokeWidth={3}/></svg>
            </div>
          </div>
          <div className="relative group">
            <span className="absolute left-3 top-[-6px] bg-white px-1 text-[8px] font-black text-black/20 uppercase z-10">配饰 Accessory</span>
            <select className={selectClass(params.isRandom)} value={params.accessory} onChange={(e) => handleChange('accessory', e.target.value)}>
              {Object.values(Accessory).map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 9l-7 7-7-7" strokeWidth={3}/></svg>
            </div>
          </div>
        </div>
      </div>

      {/* 第三排：重构强度 (Intensity) - 压缩高度，整合百分比与说明 */}
      <div className="pt-2">
        <div className="bg-black/[0.03] p-4 rounded-2xl space-y-3">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-3">
               <label className="text-[9px] font-black uppercase tracking-[0.2em] text-black/30 shrink-0">重构强度 Intensity</label>
               <span className="text-[8px] font-bold text-black/20 uppercase truncate">· 保留原图特征程度</span>
             </div>
             <div className="px-2 py-0.5 bg-black text-white text-[10px] font-black rounded-md tabular-nums">
               {params.isRandom ? 85 : params.intensity}%
             </div>
          </div>
          <input 
            type="range" min="0" max="100" 
            value={params.isRandom ? 85 : params.intensity} 
            onChange={(e) => handleChange('intensity', parseInt(e.target.value))}
            disabled={params.isRandom}
            className={`w-full h-1.5 appearance-none rounded-full transition-all ${params.isRandom ? 'bg-black/5 cursor-not-allowed' : 'bg-black/10 cursor-pointer hover:bg-black/20'}`}
          />
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
