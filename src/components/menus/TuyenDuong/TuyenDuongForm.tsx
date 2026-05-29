import React from 'react';
import { RotateCcw, Trash2, Map, HelpCircle } from 'lucide-react';

interface Props {
  formData: any;
  setFormData: (val: any) => void;
  routeCoordinates?: [number, number][];
  setRouteCoordinates?: (val: any) => void;
}

export default function TuyenDuongForm({ 
  formData, 
  setFormData, 
  routeCoordinates = [], 
  setRouteCoordinates 
}: Props) {

  const handleUndo = () => {
    if (setRouteCoordinates && routeCoordinates.length > 1) {
      setRouteCoordinates(routeCoordinates.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (setRouteCoordinates && routeCoordinates.length > 0) {
      // Keep only the first point as initial starting point
      setRouteCoordinates([routeCoordinates[0]]);
    }
  };

  return (
    <div className="space-y-4 md:col-span-2 flex flex-col w-full">

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 col-span-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Phân loại</label>
          <input 
            type="text" 
            placeholder="Ví dụ: Tuyến tuần tra..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20" 
            value={formData.loai || ''} 
            onChange={(e) => setFormData({ ...formData, loai: e.target.value })} 
          />
        </div>

        <div className="space-y-1.5 col-span-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Mức độ cảnh báo</label>
          <select 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20" 
            value={formData.mucdo || 'Trung bình'} 
            onChange={(e) => setFormData({ ...formData, mucdo: e.target.value })}
          >
            <option value="Trung bình">Trung bình</option>
            <option value="Cao">Cao</option>
            <option value="Rất cao">Rất cao</option>
          </select>
        </div>
      </div>

      {/* Interactive drawing guide and actions */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
        <div className="flex items-start gap-2 text-slate-500">
          <HelpCircle className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-slate-550 font-medium leading-relaxed">
            Nhấp chuột trực tiếp lên bản đồ để phác thảo tuyến đường quanh co. Đường phác thảo nét đứt màu xanh sẽ hiển thị thời gian thực.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={routeCoordinates.length <= 1}
            className="flex-1 py-2 px-3 bg-white border border-slate-200 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 text-slate-700 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Hoàn tác điểm
          </button>
          
          <button
            type="button"
            onClick={handleClear}
            disabled={routeCoordinates.length <= 1}
            className="py-2 px-3 bg-rose-50 border border-rose-100 hover:bg-rose-100/50 disabled:opacity-50 disabled:cursor-not-allowed text-rose-600 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Vẽ lại
          </button>
        </div>

        {/* Vertices coordinates list */}
        <div className="space-y-1.5 border-t border-slate-200/60 pt-3">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-1">
            <Map className="w-3 h-3 text-slate-400" />
            Tọa độ các nút ({routeCoordinates.length} điểm)
          </label>
          
          <div className="max-h-36 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
            {routeCoordinates.map((coord, idx) => (
              <div 
                key={idx}
                className={`p-2.5 rounded-lg border text-[10px] font-mono flex items-center justify-between shadow-sm transition-all ${
                  idx === 0 
                    ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800' 
                    : idx === routeCoordinates.length - 1 
                      ? 'bg-sky-50/50 border-sky-100 text-sky-800' 
                      : 'bg-white border-slate-100 text-slate-650'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 ${
                    idx === 0 
                      ? 'bg-emerald-500 text-white' 
                      : idx === routeCoordinates.length - 1 
                        ? 'bg-sky-500 text-white' 
                        : 'bg-slate-200 text-slate-600'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className="font-semibold">{coord[0].toFixed(6)}, {coord[1].toFixed(6)}</span>
                </div>
                <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 bg-white/80 border border-slate-100">
                  {idx === 0 ? 'Bắt đầu' : idx === routeCoordinates.length - 1 ? 'Kết thúc' : 'Điểm nút'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
