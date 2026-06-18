import React, { useState } from 'react';
import { X, MapPin, User, Phone, AlignLeft, Compass, Video, Clipboard, Check, Edit2 } from 'lucide-react';

interface Props {
  details: any;
  onClose: () => void;
}

export default function CameraDetails({ details, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderStatusBadge = (status: string) => {
    const isSuspended = status === 'Tạm ngưng';
    const bgTheme = isSuspended ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white';
    const dotColor = isSuspended ? 'bg-rose-300' : 'bg-emerald-300';
    const label = status || 'Hoạt động';

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shadow-sm ${isSuspended ? '' : 'animate-pulse'} ${bgTheme}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span> {label}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 font-sans selection:bg-slate-200 selection:text-slate-900">
      {/* Header Banner - Premium Light White Banner with Zero Pastel */}
      <div className="relative overflow-hidden px-6 pt-7 pb-6 bg-white border-b border-slate-200/80 shadow-sm">
        {/* Subtle geometric grid overlay */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
        <div className="absolute -right-10 -bottom-10 opacity-5 transform rotate-12 pointer-events-none">
          <Video className="w-40 h-40 text-slate-350" />
        </div>

        <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-md shadow-slate-100/50 shrink-0">
              <Video className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              {renderStatusBadge(details.trangthai)}
              <h3 className="text-base font-black text-slate-800 mt-1.5 leading-snug tracking-wide uppercase">
                {details.ten || 'CCTV Camera'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('edit-camera', { detail: details }))}
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
          
          {/* Owner Info Card */}
          {details.chu_camera && (
            <div className="group p-4 bg-white rounded-2xl hover:shadow-md hover:shadow-slate-100 transition-all duration-300 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-white text-orange-650 border border-slate-200 rounded-xl shrink-0 shadow-sm">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Chủ sở hữu camera</span>
                  <h4 className="text-sm font-bold text-slate-700 mt-0.5 leading-snug">{details.chu_camera}</h4>
                </div>
              </div>
            </div>
          )}

          {/* Address Info Card */}
          {details.diachi && (
            <div className="group p-4 bg-white rounded-2xl hover:shadow-md hover:shadow-slate-100 transition-all duration-300 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-white text-sky-600 border border-slate-200 rounded-xl shrink-0 shadow-sm">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Địa chỉ lắp đặt</span>
                  <h4 className="text-sm font-bold text-slate-700 mt-0.5 leading-snug">
                    {details.diachi}
                  </h4>
                </div>
              </div>
            </div>
          )}

          {/* Phone Info Card */}
          {details.sdt_chu && (
            <div className="group p-4 bg-white rounded-2xl hover:shadow-md hover:shadow-slate-100 transition-all duration-300 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-white text-amber-600 border border-slate-200 rounded-xl shrink-0 shadow-sm">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Số điện thoại liên hệ</span>
                    <h4 className="text-sm font-mono font-bold text-slate-700 mt-0.5 tracking-wider">{details.sdt_chu}</h4>
                  </div>
                </div>
                <button 
                  onClick={() => copyToClipboard(details.sdt_chu)}
                  className={`p-2 rounded-lg transition-all duration-200 shrink-0 border ${copied ? 'bg-emerald-50 text-emerald-600 border-emerald-250 shadow-sm shadow-emerald-50' : 'bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 border-slate-200/50'}`}
                  title="Sao chép số điện thoại"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Clipboard className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}

          {/* Description Card */}
          {details.description && (
            <div className="group p-4 bg-white rounded-2xl hover:shadow-md hover:shadow-slate-100 transition-all duration-300 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-white text-sky-650 border border-slate-200 rounded-xl shrink-0 shadow-sm">
                  <AlignLeft className="w-4 h-4" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Mô tả vị trí & Hướng quay</span>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed whitespace-pre-wrap">{details.description}</p>
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
                <div className="flex items-center gap-1.5 mt-1.5 bg-slate-100 px-3.5 py-2.5 rounded-xl border border-slate-200/60 max-w-fit font-mono text-xs font-bold text-orange-600 shadow-inner">
                  <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0 animate-bounce" />
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
