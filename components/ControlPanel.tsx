
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

  const labelClass = "text-[10px] font-black uppercase tracking-[0.2em] text-black/40 block";
  
  const selectClass = (isDisabled: boolean) => 
    `w-full bg-white border ${isDisabled ? 'border-transparent opacity-20 cursor-not-allowed' : 'border-black/5 hover:border-black/20 focus:border-black focus:ring-4 focus:ring-black/5'} rounded-2xl p-4 text-[13px] font-bold transition-all outline-none appearance-none cursor-pointer shadow-sm`;

  const SelectWrapper = ({ label, children, isDisabled = false }: { label: string, children: React.ReactNode, isDisabled?: boolean }) => (
    <div className="relative group">
      <span className="absolute left-4 top-[-8px] bg-white px-2 text-[9px] font-black text-black/20 group-hover:text-black/40 uppercase z-10 transition-colors tracking-widest">
        {label}
      </span>
      {children}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-black/20">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M19 9l-7 7-7-7" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 py-2">
      {/* 核心风格配置区域 */}
      <div className="space-y-8">
        <div className="flex items-center justify-between mb-2">
          <label className={labelClass}>核心艺术配置 Core Style</label>
          <div className="flex items-center gap-2 px-2 py-0.5 bg-black/[0.03] rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-accentGreen animate-pulse"></div>
            <span className="text-[8px] font-bold text-black/30 uppercase italic">Referenced by Deer Case</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SelectWrapper label="艺术材质 Style">
            <select 
              className={selectClass(false)} 
              value={params.style} 
              onChange={(e) => handleChange('style', e.target.value)}
            >
              {Object.values(AvatarStyle).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </SelectWrapper>

          <SelectWrapper label="场景背景 Background">
            <select 
              className={selectClass(false)} 
              value={params.background} 
              onChange={(e) => handleChange('background', e.target.value)}
            >
              {Object.values(Background).map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </SelectWrapper>
        </div>
      </div>

      {/* 细节定制 (Details) */}
      <div className="space-y-8 pt-8 border-t border-black/5">
        <div className="flex items-center justify-between">
          <label className={labelClass}>细节与穿搭 Details</label>
          <div className="flex items-center gap-3 bg-black/[0.03] px-4 py-2 rounded-2xl hover:bg-black/5 transition-all cursor-pointer group" onClick={() => handleChange('isRandom', !params.isRandom)}>
             <span className="text-[9px] font-black uppercase text-black/40 group-hover:text-black/60 transition-colors">自动随机 Auto Random</span>
             <div className={`relative w-9 h-5 rounded-full transition-colors duration-500 ${params.isRandom ? 'bg-black' : 'bg-black/10'}`}>
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-500 shadow-sm ${params.isRandom ? 'left-5' : 'left-1'}`}></div>
            </div>
          </div>
        </div>
        
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-700 ${params.isRandom ? 'opacity-30 pointer-events-none scale-[0.98]' : 'opacity-100'}`}>
          <SelectWrapper label="服装 Clothing" isDisabled={params.isRandom}>
            <select className={selectClass(params.isRandom)} value={params.clothing} onChange={(e) => handleChange('clothing', e.target.value)}>
              {Object.values(Clothing).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </SelectWrapper>

          <SelectWrapper label="配饰 Accessory" isDisabled={params.isRandom}>
            <select className={selectClass(params.isRandom)} value={params.accessory} onChange={(e) => handleChange('accessory', e.target.value)}>
              {Object.values(Accessory).map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </SelectWrapper>
        </div>
      </div>

      {/* 重构强度 (Intensity) */}
      <div className="pt-2">
        <div className="bg-black/[0.03] p-6 rounded-[2.5rem] transition-all hover:bg-black/[0.05]">
          <div className="flex items-center gap-4 mb-4">
             <div className="flex flex-col">
               <label className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40">重构强度 Intensity</label>
               <span className="text-[8px] font-bold text-black/15 uppercase mt-0.5 tracking-tighter italic">Lower maintains more of original soul</span>
             </div>
             <div className="ml-auto">
               <div className="px-4 py-1 bg-black text-white text-[12px] font-black rounded-xl tabular-nums shadow-xl shadow-black/10">
                 {params.isRandom ? 85 : params.intensity}%
               </div>
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
