import React from 'react';
import { X, MapPin, Calendar, CheckSquare, Info, ShieldAlert, AlignLeft, Link, Compass, Edit2, Shield } from 'lucide-react';

interface Props {
  details: any;
  onClose: () => void;
}

export default function VuViecDetails({ details, onClose }: Props) {
  // Render status badge with premium solid high-contrast light tailored themes
  const renderStatusBadge = (status: string) => {
    let bgTheme = 'bg-rose-600 text-white';
    let dotColor = 'bg-rose-300';
    let label = status || 'Mới';

    if (label === 'Mới') {
      bgTheme = 'bg-sky-600 text-white';
      dotColor = 'bg-sky-300';
    } else if (label === 'Đang xử lý') {
      bgTheme = 'bg-amber-600 text-white';
      dotColor = 'bg-amber-300';
    } else if (label === 'Đã giải quyết') {
      bgTheme = 'bg-emerald-600 text-white';
      dotColor = 'bg-emerald-300';
    }

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-sm ${label === 'Mới' || label === 'Đang xử lý' ? 'animate-pulse' : ''} ${bgTheme}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
        {label}
      </span>
    );
  };

  // Helper to format date strings cleanly
  const formatDate = (dateStr: string) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 font-sans selection:bg-rose-100 selection:text-rose-950">
      {/* Header Banner - Premium Light White Banner with Zero Pastel */}
      <div className="relative overflow-hidden px-6 pt-7 pb-6 bg-white border-b border-slate-200/80 shadow-sm">
        {/* Subtle geometric grid overlay */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
        <div className="absolute -right-10 -bottom-10 opacity-5 transform rotate-12 pointer-events-none">
          <ShieldAlert className="w-40 h-40 text-slate-350" />
        </div>

        <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-md shadow-slate-100/50 shrink-0">
              <ShieldAlert className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              {renderStatusBadge(details.trangthai)}
              <h3 className="text-base font-black text-slate-800 mt-1.5 leading-snug tracking-wide uppercase flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-slate-500 shrink-0" />
                {details.loai || 'Incident Profile'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('edit-incident', { detail: details }))}
              className="p-2.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-slate-650 transition-all duration-300 hover:scale-105 shadow-sm flex items-center justify-center"
              title="Cập nhật thông tin"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button 
              onClick={onClose} 
              className="p-2.5 bg-white hover:bg-red-50 hover:text-red-500 border border-slate-200 rounded-xl text-slate-400 transition-all duration-300 flex items-center justify-center shadow-sm"
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
          
          {/* Incident Time Card */}
          {details.thoigian && (
            <div className="group p-4 bg-white rounded-2xl hover:shadow-md hover:shadow-slate-100 transition-all duration-300 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-white text-rose-500 border border-slate-200 rounded-xl shrink-0 shadow-sm">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Thời gian phát hiện</span>
                  <h4 className="text-sm font-bold text-slate-700 mt-0.5 leading-snug">
                    {formatDate(details.thoigian)}
                  </h4>
                </div>
              </div>
            </div>
          )}

          {/* Description Card */}
          {details.mota && (
            <div className="group p-4 bg-white rounded-2xl hover:shadow-md hover:shadow-slate-100 transition-all duration-300 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-white text-sky-650 border border-slate-200 rounded-xl shrink-0 shadow-sm">
                  <AlignLeft className="w-4 h-4" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ghi chú & Mô tả chi tiết</span>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed whitespace-pre-wrap">{details.mota}</p>
                </div>
              </div>
            </div>
          )}

          {/* Incident Outcome / Results Card */}
          {details.ketqua && (
            <div className="group p-4 bg-white rounded-2xl hover:shadow-md hover:shadow-slate-100 transition-all duration-300 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-white text-emerald-600 border border-slate-200 rounded-xl shrink-0 shadow-sm">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Kết quả xử lý vụ việc</span>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{details.ketqua}</p>
                </div>
              </div>
            </div>
          )}

          {/* Linkage / Group ID Card */}
          {details.groupId && (
            <div className="group p-4 bg-white rounded-2xl hover:shadow-md hover:shadow-slate-100 transition-all duration-300 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-white text-purple-650 border border-slate-200 rounded-xl shrink-0 shadow-sm">
                  <Link className="w-4 h-4" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Nhóm vụ việc / Liên kết hồ sơ</span>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="font-mono text-xs font-bold text-purple-700 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-sm">
                      {details.groupId}
                    </span>
                  </div>
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
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tọa độ GIS Hiện trường</span>
                <div className="flex items-center gap-1.5 mt-1.5 bg-slate-100 px-3.5 py-2.5 rounded-xl border border-slate-200/60 max-w-fit font-mono text-xs font-bold text-rose-600 shadow-inner">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 animate-bounce" />
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
