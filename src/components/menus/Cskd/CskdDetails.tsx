import React, { useState } from 'react';
import { X, MapPin, Store, Tag, Edit2, Trash2, Compass, Briefcase, FileText, User, Phone, CreditCard, Calendar, ShieldCheck, Clipboard, Check } from 'lucide-react';

interface Props {
  details: any;
  onClose: () => void;
}

export default function CskdDetails({ details, onClose }: Props) {
  const [copiedChu, setCopiedChu] = useState(false);
  const [copiedQl, setCopiedQl] = useState(false);

  const copyToClipboard = (text: string, type: 'chu' | 'ql') => {
    navigator.clipboard.writeText(text);
    if (type === 'chu') {
      setCopiedChu(true);
      setTimeout(() => setCopiedChu(false), 2000);
    } else {
      setCopiedQl(true);
      setTimeout(() => setCopiedQl(false), 2000);
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa cơ sở kinh doanh "${details.ten}" khỏi bản đồ?`)) {
      window.dispatchEvent(new CustomEvent('delete-gis', { detail: { id: details.ten, category: 'cskd-list' } }));
    }
  };

  const renderStatusBadge = (status: string) => {
    let bgTheme = 'bg-emerald-600 text-white';
    let dotColor = 'bg-emerald-300';
    let label = status || 'Đang hoạt động';

    if (label === 'Tạm ngưng') {
      bgTheme = 'bg-amber-600 text-white';
      dotColor = 'bg-amber-300';
    } else if (label === 'Bị đình chỉ' || label === 'Rút giấy phép') {
      bgTheme = 'bg-rose-600 text-white';
      dotColor = 'bg-rose-300';
    } else if (label === 'Đang giải thể') {
      bgTheme = 'bg-slate-600 text-white';
      dotColor = 'bg-slate-300';
    }

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shadow-sm ${label === 'Đang hoạt động' ? 'animate-pulse' : ''} ${bgTheme}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span> {label}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 font-sans selection:bg-pink-100 selection:text-pink-950">
      {/* Header Banner - Premium Light White Banner with Zero Pastel */}
      <div className="relative overflow-hidden px-6 pt-7 pb-6 bg-white border-b border-slate-200/80 shadow-sm">
        {/* Subtle geometric grid overlay */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
        <div className="absolute -right-10 -bottom-10 opacity-5 transform rotate-12 pointer-events-none">
          <Store className="w-40 h-40 text-slate-250" />
        </div>

        <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-md shadow-slate-100/50 shrink-0">
              <Store className="w-6 h-6 text-pink-600" />
            </div>
            <div>
              {renderStatusBadge(details.trangthai)}
              <h3 className="text-base font-black text-slate-800 mt-1.5 leading-snug tracking-wide uppercase">
                {details.ten || 'Cơ sở kinh doanh'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('edit-cskd', { detail: { ...details, _originalTen: details.ten } }))}
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

        {/* SECTION 1: LEGAL & IDENTIFICATION */}
        <div className="group p-4 bg-white rounded-2xl hover:shadow-md hover:shadow-slate-100 transition-all duration-300 shadow-sm space-y-3.5">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Thông tin Pháp lý & Ngành nghề
          </h4>
          <div className="grid grid-cols-1 gap-3 text-xs">
            {details.mst && (
              <div className="flex justify-between items-start gap-4 py-1">
                <span className="text-slate-400 font-medium shrink-0">Mã số thuế / Doanh nghiệp</span>
                <span className="font-mono font-bold text-slate-700 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded text-right break-all whitespace-normal">{details.mst}</span>
              </div>
            )}
            {details.loai_hinh_kd && (
              <div className="flex justify-between items-start gap-4 py-1">
                <span className="text-slate-400 font-medium shrink-0">Loại hình kinh doanh</span>
                <span className="font-bold text-slate-700 text-right break-words whitespace-normal">{details.loai_hinh_kd}</span>
              </div>
            )}
            {details.loai && (
              <div className="flex justify-between items-start gap-4 py-1">
                <span className="text-slate-400 font-medium shrink-0">Ngành nghề kinh doanh chính</span>
                <span className="font-bold text-slate-700 bg-pink-50 text-pink-700 border border-pink-100/50 px-2 py-0.5 rounded text-right break-all whitespace-normal">{details.loai}</span>
              </div>
            )}
            {details.giay_phep && (
              <div className="flex flex-col gap-1 py-0.5 border-t border-slate-50 pt-2">
                <span className="text-slate-400 font-medium">Giấy phép liên quan</span>
                <span className="font-medium text-slate-650 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-150">{details.giay_phep}</span>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: LEGAL REPRESENTATIVE (OWNER) */}
        {details.chu_co_so && (
          <div className="group p-4 bg-white rounded-2xl hover:shadow-md hover:shadow-slate-100 transition-all duration-300 shadow-sm space-y-3.5">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
              Đại diện Pháp luật (Chủ cơ sở)
            </h4>
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <User className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Họ và tên chủ</span>
                  <span className="font-bold text-slate-700 text-sm">{details.chu_co_so}</span>
                </div>
              </div>
              {details.chu_ngaysinh && (
                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Ngày sinh</span>
                    <span className="font-semibold text-slate-700">{details.chu_ngaysinh}</span>
                  </div>
                </div>
              )}
              {details.chu_cccd && (
                <div className="flex items-start gap-2.5">
                  <CreditCard className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Số CCCD / Hộ chiếu</span>
                    <span className="font-mono font-semibold text-slate-700">{details.chu_cccd}</span>
                  </div>
                </div>
              )}
              {details.chu_sdt && (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <Phone className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Số điện thoại liên hệ</span>
                      <span className="font-mono font-bold text-slate-700 text-sm break-all">{details.chu_sdt}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(details.chu_sdt, 'chu')}
                    className={`p-1.5 rounded-lg transition-all duration-200 shrink-0 border cursor-pointer ${copiedChu ? 'bg-emerald-50 text-emerald-600 border-emerald-250 shadow-sm shadow-emerald-50' : 'bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 border-slate-200'}`}
                    title="Sao chép số điện thoại"
                  >
                    {copiedChu ? <Check className="w-3 h-3" /> : <Clipboard className="w-3 h-3" />}
                  </button>
                </div>
              )}
              {details.chu_diachi && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Địa chỉ thường trú / Tạm trú</span>
                    <span className="font-medium text-slate-650 leading-relaxed block">{details.chu_diachi}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 3: PRACTICAL MANAGER */}
        {details.quan_ly && (
          <div className="group p-4 bg-white rounded-2xl hover:shadow-md hover:shadow-slate-100 transition-all duration-300 shadow-sm space-y-3.5">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
              Quản lý Thực tế (Đang điều hành)
            </h4>
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <User className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Họ và tên quản lý</span>
                  <span className="font-bold text-slate-700 text-sm">{details.quan_ly}</span>
                </div>
              </div>
              {details.quan_ly_ngaysinh && (
                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Ngày sinh</span>
                    <span className="font-semibold text-slate-700">{details.quan_ly_ngaysinh}</span>
                  </div>
                </div>
              )}
              {details.quan_ly_cccd && (
                <div className="flex items-start gap-2.5">
                  <CreditCard className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Số CCCD / Hộ chiếu</span>
                    <span className="font-mono font-semibold text-slate-700">{details.quan_ly_cccd}</span>
                  </div>
                </div>
              )}
              {details.quan_ly_sdt && (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <Phone className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Số điện thoại liên hệ</span>
                      <span className="font-mono font-bold text-slate-700 text-sm break-all">{details.quan_ly_sdt}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(details.quan_ly_sdt, 'ql')}
                    className={`p-1.5 rounded-lg transition-all duration-200 shrink-0 border cursor-pointer ${copiedQl ? 'bg-emerald-50 text-emerald-600 border-emerald-250 shadow-sm shadow-emerald-50' : 'bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 border-slate-200'}`}
                    title="Sao chép số điện thoại"
                  >
                    {copiedQl ? <Check className="w-3 h-3" /> : <Clipboard className="w-3 h-3" />}
                  </button>
                </div>
              )}
              {details.quan_ly_diachi && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Địa chỉ thường trú / Tạm trú</span>
                    <span className="font-medium text-slate-650 leading-relaxed block">{details.quan_ly_diachi}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 4: COORDINATES */}
        <div className="group p-4 bg-white rounded-2xl hover:shadow-md hover:shadow-slate-100 transition-all duration-300 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-white text-slate-500 border border-slate-200 rounded-xl shrink-0 shadow-sm">
              <Compass className="w-4 h-4 animate-spin-slow" />
            </div>
            <div className="flex-1 overflow-hidden">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tọa độ Bản đồ</span>
              <div className="flex items-center gap-1.5 mt-1.5 bg-slate-100 px-3.5 py-2.5 rounded-xl border border-slate-200/60 max-w-fit font-mono text-xs font-bold text-pink-600 shadow-inner">
                <MapPin className="w-3.5 h-3.5 text-pink-500 shrink-0 animate-bounce" />
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
  );
}
