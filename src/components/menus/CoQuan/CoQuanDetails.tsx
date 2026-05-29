import React from 'react';
import { X, MapPin, Building2, Tag, Edit2, Trash2, Compass } from 'lucide-react';

interface Props {
  details: any;
  onClose: () => void;
}

export default function CoQuanDetails({ details, onClose }: Props) {
  const handleDelete = () => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa cơ quan "${details.ten}" khỏi bản đồ?`)) {
      window.dispatchEvent(new CustomEvent('delete-gis', { detail: { id: details.ten, category: 'coquan-list' } }));
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 font-sans selection:bg-slate-200 selection:text-slate-900">
      {/* Header Banner - Premium Light White Banner with Zero Pastel */}
      <div className="relative overflow-hidden px-6 pt-7 pb-6 bg-white border-b border-slate-200/80 shadow-sm">
        {/* Subtle geometric grid overlay */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
        <div className="absolute -right-10 -bottom-10 opacity-5 transform rotate-12 pointer-events-none">
          <Building2 className="w-40 h-40 text-slate-250" />
        </div>

        <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-md shadow-slate-100/50 shrink-0">
              <Building2 className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              {/* Permanent premium agency badge */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-slate-700 text-white shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse"></span>
                CƠ QUAN NHÀ NƯỚC
              </span>

              <h3 className="text-base font-black text-slate-800 mt-1.5 leading-snug tracking-wide uppercase">
                {details.ten || 'Chưa rõ tên cơ quan'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('edit-coquan', { detail: { ...details, _originalTen: details.ten } }))}
              className="p-2.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-slate-650 transition-all duration-300 hover:scale-105 shadow-sm flex items-center justify-center cursor-pointer"
              title="Cập nhật thông tin"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-400 transition-all duration-300 flex items-center justify-center shadow-sm cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Details Body - Scrollable */}
      <div className="flex-1 p-6 space-y-5 overflow-y-auto custom-scrollbar bg-slate-50/40">

        {/* Info Grid Cards */}
        <div className="space-y-4">

          {/* Loai Co Quan Card */}
          {details.loai && (
            <div className="group p-4 bg-white rounded-2xl hover:shadow-md hover:shadow-slate-100 transition-all duration-300 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-white text-slate-600 border border-slate-200 rounded-xl shrink-0 shadow-sm">
                  <Tag className="w-4 h-4" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Loại hình cơ quan</span>
                  <h4 className="text-sm font-bold text-slate-700 mt-0.5 leading-snug">{details.loai}</h4>
                </div>
              </div>
            </div>
          )}

          {/* Dia Ban Card */}
          {details.xaphuong && (
            <div className="group p-4 bg-white rounded-2xl hover:shadow-md hover:shadow-slate-100 transition-all duration-300 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-white text-emerald-600 border border-slate-200 rounded-xl shrink-0 shadow-sm">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Địa bàn / Phường xã</span>
                  <h4 className="text-sm font-bold text-slate-700 mt-0.5 leading-snug">{details.xaphuong}</h4>
                </div>
              </div>
            </div>
          )}

          {/* Coordinates Card */}
          <div className="group p-4 bg-white rounded-2xl hover:shadow-md hover:shadow-slate-100 transition-all duration-300 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-white text-slate-500 border border-slate-200 rounded-xl shrink-0 shadow-sm">
                <Compass className="w-4 h-4 animate-spin-slow" />
              </div>
              <div className="flex-1 overflow-hidden">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tọa độ Bản đồ</span>
                <div className="flex items-center gap-1.5 mt-1.5 bg-slate-100 px-3.5 py-2.5 rounded-xl border border-slate-200/60 max-w-fit font-mono text-xs font-bold text-slate-650 shadow-inner">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 animate-bounce" />
                  <span>
                    {(details.lng?.toFixed(6) || details.coordinates?.[0]?.[0]?.toFixed(6))},
                    {(details.lat?.toFixed(6) || details.coordinates?.[0]?.[1]?.toFixed(6))}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
