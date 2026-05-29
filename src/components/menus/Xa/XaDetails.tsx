import React from 'react';
import { X, MapPin, Info, Tag } from 'lucide-react';

interface Props {
  details: any;
  onClose: () => void;
}

export default function XaDetails({ details, onClose }: Props) {
  const renderField = (label: string, value: any) => (
    value ? (
      <div className="px-5 py-3.5 flex flex-col gap-1 hover:bg-slate-50/50 transition-colors">
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{label}</span>
        <span className="text-sm font-semibold text-slate-700 leading-relaxed whitespace-pre-wrap">{value}</span>
      </div>
    ) : null
  );

  return (
    <>
      <div className="p-5 border-b border-slate-100 bg-slate-50/80 backdrop-blur-md flex items-center justify-between">
        <h2 className="text-sm font-black text-slate-800 flex items-center gap-2 uppercase tracking-wider">
          <Info className="w-5 h-5 text-sky-500" />
          Hồ sơ chi tiết
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 p-6 space-y-5 overflow-y-auto custom-scrollbar">
        <div className="flex items-center gap-4 mb-2">
           <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0 shadow-sm border border-sky-200/50">
             <Tag className="w-6 h-6" />
           </div>
           <div>
             <h3 className="text-lg font-bold text-slate-800">{details.ten_xa || 'Phường/Xã'}</h3>
             <p className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">Phường/Xã</p>
           </div>
        </div>
        
        <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {renderField('Loại hình', details.loai)}
          </div>
        </div>

        <div className="px-5 py-4 bg-sky-50/50 rounded-2xl border border-sky-100/50 flex items-center gap-4">
           <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100">
             <MapPin className="w-5 h-5 text-sky-500" />
           </div>
           <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-sky-600 tracking-wider">Tọa độ Bản đồ</span>
              <span className="text-sm font-mono font-bold text-slate-700">
                {details.lng?.toFixed(6) || details.coordinates?.[0]?.[0]?.toFixed(6)}, 
                {details.lat?.toFixed(6) || details.coordinates?.[0]?.[1]?.toFixed(6)}
              </span>
           </div>
        </div>
      </div>
    </>
  );
}
