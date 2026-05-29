import React from 'react';
import { X, MapPin, Tag, Edit2, Trash2, Map, Compass, AlertTriangle } from 'lucide-react';

interface Props {
  details: any;
  onClose: () => void;
}

export default function TuyenDuongDetails({ details, onClose }: Props) {
  const handleDelete = () => {
    const identifier = details.id || details.ten;
    if (window.confirm(`Bạn có chắc chắn muốn xóa tuyến đường "${details.ten}" khỏi bản đồ?`)) {
      window.dispatchEvent(
        new CustomEvent('delete-gis', {
          detail: { id: identifier, category: 'tuyenduong-list' }
        })
      );
      onClose();
    }
  };

  const renderSeverityBadge = (level: string) => {
    let bgTheme = 'bg-sky-600 text-white';
    let dotColor = 'bg-sky-300';
    let label = level || 'Trung bình';

    if (label === 'Rất cao') {
      bgTheme = 'bg-rose-600 text-white';
      dotColor = 'bg-rose-300';
    } else if (label === 'Cao' || label === 'Trung bình') {
      bgTheme = 'bg-orange-600 text-white';
      dotColor = 'bg-orange-300';
    }

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-sm animate-pulse ${bgTheme}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span> Mức độ: {label}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 font-sans selection:bg-rose-100 selection:text-rose-950">
      {/* Header Banner - Premium Light White Banner with Grid Overlay */}
      <div className="relative overflow-hidden px-6 pt-7 pb-6 bg-white border-b border-slate-200/80 shadow-sm">
        {/* Subtle geometric grid overlay */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
        <div className="absolute -right-10 -bottom-10 opacity-5 transform rotate-12 pointer-events-none">
          <Map className="w-40 h-40 text-slate-350" />
        </div>

        <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-3 mr-2 overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-md shadow-slate-100/50 shrink-0">
              <Map className="w-6 h-6 text-sky-600" />
            </div>
            <div className="overflow-hidden">
              <h3 className="text-base font-black text-slate-800 leading-snug tracking-wide uppercase flex items-center gap-1.5 break-words">
                {'Tuyến đường an ninh'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('edit-tuyenduong', { detail: { ...details, _originalTen: details.ten } }))}
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
        <div className="space-y-4">

          {/* Route Name Card */}
          <div className="group p-4 bg-white rounded-2xl hover:shadow-md hover:shadow-slate-100 transition-all duration-300 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-white text-sky-650 border border-slate-200 rounded-xl shrink-0 shadow-sm">
                <Map className="w-4 h-4" />
              </div>
              <div className="flex-1 overflow-hidden">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tên tuyến đường</span>
                <h4 className="text-sm font-bold text-slate-700 mt-0.5 leading-snug break-words">
                  {details.ten || 'Tuyến đường'}
                </h4>
              </div>
            </div>
          </div>

          {/* Classification/Type Card */}
          {details.loai && (
            <div className="group p-4 bg-white rounded-2xl hover:shadow-md hover:shadow-slate-100 transition-all duration-300 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-white text-rose-500 border border-slate-200 rounded-xl shrink-0 shadow-sm">
                  <Tag className="w-4 h-4" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Phân loại / Tuyến tuần tra</span>
                  <h4 className="text-sm font-bold text-slate-700 mt-0.5 leading-snug break-words">
                    {details.loai}
                  </h4>
                </div>
              </div>
            </div>
          )}

          {/* Severity / Warning Level Card */}
          {details.mucdo && (
            <div className="group p-4 bg-white rounded-2xl hover:shadow-md hover:shadow-slate-100 transition-all duration-300 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-white text-amber-500 border border-slate-200 rounded-xl shrink-0 shadow-sm">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Mức độ cảnh báo</span>
                  <div className="mt-1.5">
                    {renderSeverityBadge(details.mucdo)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* GIS Coordinates / Vertices Card */}
          {details.type === 'line' && details.coordinates ? (
            <div className="group p-4 bg-white rounded-2xl hover:shadow-md hover:shadow-slate-100 transition-all duration-300 shadow-sm">
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-white text-sky-500 border border-slate-200 rounded-xl shrink-0 shadow-sm animate-pulse">
                    <MapPin className="w-4 h-4 shrink-0" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tuyến đường</span>
                    <span className="text-xs font-semibold text-slate-650">Gồm {details.coordinates.length} điểm tọa độ</span>
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-200/60 pt-3 text-[10px] font-mono leading-relaxed">
                  <div className="flex items-center justify-between text-emerald-800 bg-emerald-50/40 p-2 rounded-lg border border-emerald-100/50">
                    <span className="font-bold uppercase text-[8px] tracking-wider bg-emerald-500 text-white px-1.5 py-0.5 rounded shrink-0">Điểm đầu</span>
                    <span className="font-bold">{details.coordinates[0][0].toFixed(6)}, {details.coordinates[0][1].toFixed(6)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sky-850 bg-sky-50/40 p-2 rounded-lg border border-sky-100/50">
                    <span className="font-bold uppercase text-[8px] tracking-wider bg-sky-500 text-white px-1.5 py-0.5 rounded shrink-0">Điểm cuối</span>
                    <span className="font-bold">{details.coordinates[details.coordinates.length - 1][0].toFixed(6)}, {details.coordinates[details.coordinates.length - 1][1].toFixed(6)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
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
          )}

        </div>
      </div>
    </div>
  );
}
