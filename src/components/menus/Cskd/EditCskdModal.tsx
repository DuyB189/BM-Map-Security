import React, { useState } from 'react';
import { X, Check, Store, ShieldCheck, Flame, ClipboardCheck, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BusinessInspectionRecord } from '../../../types';
import { INSPECTION_RESULT_OPTIONS } from '../../../utils/gisHelpers';

interface EditCskdModalProps {
  editData: any | null;
  setEditData: (val: any | null) => void;
  handleSave: (data: any) => void;
  onPickLocationOnMap?: (category: string, currentData: any) => void;
}

export default function EditCskdModal({ editData, setEditData, handleSave, onPickLocationOnMap }: EditCskdModalProps) {
  const [inspDate, setInspDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [inspUnit, setInspUnit] = useState('');
  const [inspResult, setInspResult] = useState('Đạt');
  const [inspNote, setInspNote] = useState('');

  if (!editData) return null;

  const antt = editData.giay_phep_antt || {};
  const pccc = editData.giay_phep_pccc || {};
  const inspections: BusinessInspectionRecord[] = Array.isArray(editData.lich_su_kiem_tra)
    ? editData.lich_su_kiem_tra
    : [];

  const updateAntt = (patch: Record<string, string>) =>
    setEditData({ ...editData, giay_phep_antt: { ...antt, ...patch } });

  const updatePccc = (patch: Record<string, string>) =>
    setEditData({ ...editData, giay_phep_pccc: { ...pccc, ...patch } });

  const handleAddInspection = () => {
    if (!inspDate && !inspNote.trim()) return;
    const item: BusinessInspectionRecord = {
      id: `INSP-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ngay_kiem_tra: inspDate || new Date().toISOString().slice(0, 10),
      don_vi_kiem_tra: inspUnit.trim() || 'Công an Phường',
      ket_qua: inspResult,
      noi_dung: inspNote.trim(),
    };
    setEditData({
      ...editData,
      lich_su_kiem_tra: [item, ...inspections],
    });
    setInspNote('');
  };

  const handleRemoveInspection = (id: string) => {
    setEditData({
      ...editData,
      lich_su_kiem_tra: inspections.filter((x) => x.id !== id),
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[2000] flex items-center justify-center p-6">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-650 text-white rounded-xl shadow-md shadow-pink-100">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-800 uppercase tracking-wide">Cập nhật Cơ sở Kinh doanh</h2>
                <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mt-0.5">
                  Tên gốc: {editData.ten || 'Chưa định danh'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setEditData(null)} 
              className="text-slate-400 hover:text-slate-650 p-2 hover:bg-slate-100 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
            
            {/* SUB-SECTION 1: LEGAL & IDENTIFICATION */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                1. Thông tin Định danh & Pháp lý
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                    Tên Cơ sở <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    placeholder="Nhập tên cơ sở kinh doanh..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
                    value={editData.ten || ''}
                    onChange={(e) => setEditData({...editData, ten: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Mã số thuế / Doanh nghiệp</label>
                  <input 
                    type="text" 
                    placeholder="Nhập mã số thuế..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
                    value={editData.mst || ''}
                    onChange={(e) => setEditData({...editData, mst: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Loại hình kinh doanh</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
                    value={editData.loai_hinh_kd || 'Hộ kinh doanh cá thể'}
                    onChange={(e) => setEditData({...editData, loai_hinh_kd: e.target.value})}
                  >
                    <option value="Hộ kinh doanh cá thể">Hộ kinh doanh cá thể</option>
                    <option value="Công ty TNHH">Công ty TNHH</option>
                    <option value="Công ty Cổ phần">Công ty Cổ phần</option>
                    <option value="Hợp tác xã">Hợp tác xã</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Ngành nghề kinh doanh chính</label>
                  <input 
                    type="text" 
                    placeholder="Nhập ngành nghề (ví dụ: Karaoke, Internet...)..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
                    value={editData.loai || ''}
                    onChange={(e) => setEditData({...editData, loai: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Trạng thái hoạt động</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
                    value={editData.trangthai || 'Đang hoạt động'}
                    onChange={(e) => setEditData({...editData, trangthai: e.target.value})}
                  >
                    <option value="Đang hoạt động">Đang hoạt động</option>
                    <option value="Tạm ngưng">Tạm ngưng</option>
                    <option value="Đang giải thể">Đang giải thể</option>
                    <option value="Bị đình chỉ">Bị đình chỉ</option>
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Giấy phép khác / Ghi chú pháp lý chung</label>
                  <input 
                    type="text" 
                    placeholder="GPKD số..., cơ quan cấp..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
                    value={editData.giay_phep || ''}
                    onChange={(e) => setEditData({...editData, giay_phep: e.target.value})}
                  />
                </div>

                {/* Giấy phép ANTT */}
                <div className="md:col-span-2 bg-sky-50/50 border border-sky-200/70 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-sky-800 uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                    Giấy chứng nhận đủ điều kiện ANTT
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                    <input
                      type="text"
                      placeholder="Số giấy phép ANTT..."
                      value={antt.so_giay_phep || ''}
                      onChange={(e) => updateAntt({ so_giay_phep: e.target.value })}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-sky-500"
                    />
                    <input
                      type="date"
                      title="Ngày cấp ANTT"
                      value={antt.ngay_cap || ''}
                      onChange={(e) => updateAntt({ ngay_cap: e.target.value })}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-sky-500"
                    />
                    <input
                      type="date"
                      title="Ngày hết hạn ANTT"
                      value={antt.ngay_het_han || ''}
                      onChange={(e) => updateAntt({ ngay_het_han: e.target.value })}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-sky-500"
                    />
                    <select
                      value={antt.trang_thai || 'Còn hạn'}
                      onChange={(e) => updateAntt({ trang_thai: e.target.value })}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-sky-500"
                    >
                      <option value="Còn hạn">Còn hạn</option>
                      <option value="Sắp hết hạn">Sắp hết hạn</option>
                      <option value="Hết hạn">Hết hạn</option>
                      <option value="Chưa có">Chưa có</option>
                    </select>
                  </div>
                </div>

                {/* Giấy phép PCCC */}
                <div className="md:col-span-2 bg-orange-50/50 border border-orange-200/70 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-orange-800 uppercase tracking-wider">
                    <Flame className="w-3.5 h-3.5 text-orange-600" />
                    Giấy phép / Biên bản thẩm duyệt PCCC
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                    <input
                      type="text"
                      placeholder="Số giấy phép PCCC..."
                      value={pccc.so_giay_phep || ''}
                      onChange={(e) => updatePccc({ so_giay_phep: e.target.value })}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-orange-500"
                    />
                    <input
                      type="date"
                      title="Ngày cấp PCCC"
                      value={pccc.ngay_cap || ''}
                      onChange={(e) => updatePccc({ ngay_cap: e.target.value })}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-orange-500"
                    />
                    <input
                      type="date"
                      title="Ngày hết hạn PCCC"
                      value={pccc.ngay_het_han || ''}
                      onChange={(e) => updatePccc({ ngay_het_han: e.target.value })}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-orange-500"
                    />
                    <select
                      value={pccc.trang_thai || 'Còn hạn'}
                      onChange={(e) => updatePccc({ trang_thai: e.target.value })}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-orange-500"
                    >
                      <option value="Còn hạn">Còn hạn</option>
                      <option value="Sắp hết hạn">Sắp hết hạn</option>
                      <option value="Hết hạn">Hết hạn</option>
                      <option value="Chưa có">Chưa có</option>
                    </select>
                  </div>
                </div>

                {/* Lịch sử kiểm tra */}
                <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-700 uppercase tracking-wider">
                    <ClipboardCheck className="w-3.5 h-3.5 text-pink-600" />
                    Lịch sử kiểm tra ANTT / PCCC ({inspections.length})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="date"
                      value={inspDate}
                      onChange={(e) => setInspDate(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Đoàn / Cán bộ kiểm tra..."
                      value={inspUnit}
                      onChange={(e) => setInspUnit(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none"
                    />
                    <select
                      value={inspResult}
                      onChange={(e) => setInspResult(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none"
                    >
                      {INSPECTION_RESULT_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nội dung kiểm tra, biên bản vi phạm hoặc nhắc nhở..."
                      value={inspNote}
                      onChange={(e) => setInspNote(e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddInspection}
                      className="px-3.5 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm đợt</span>
                    </button>
                  </div>
                  {inspections.length > 0 && (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar pt-1">
                      {inspections.map((rec) => (
                        <div key={rec.id} className="flex items-start justify-between gap-2 p-2.5 bg-white rounded-xl border border-slate-200 text-xs">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono font-bold text-[10px] text-slate-500">{rec.ngay_kiem_tra}</span>
                              <span className="px-2 py-0.5 rounded-md bg-pink-50 text-pink-700 border border-pink-200 text-[10px] font-extrabold">
                                {rec.ket_qua}
                              </span>
                              {rec.don_vi_kiem_tra && (
                                <span className="text-[10px] font-semibold text-slate-500">• {rec.don_vi_kiem_tra}</span>
                              )}
                            </div>
                            {rec.noi_dung && <p className="text-xs text-slate-700 mt-1">{rec.noi_dung}</p>}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveInspection(rec.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SUB-SECTION 2: LEGAL REPRESENTATIVE (OWNER) */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                2. Người Đại diện Pháp luật (Chủ cơ sở)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Họ và tên chủ</label>
                  <input 
                    type="text" 
                    placeholder="Nhập họ tên chủ..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
                    value={editData.chu_co_so || ''}
                    onChange={(e) => setEditData({...editData, chu_co_so: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Ngày sinh chủ</label>
                  <input 
                    type="text" 
                    placeholder="Ngày/Tháng/Năm sinh..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
                    value={editData.chu_ngaysinh || ''}
                    onChange={(e) => setEditData({...editData, chu_ngaysinh: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Số CCCD / Hộ chiếu chủ</label>
                  <input 
                    type="text" 
                    placeholder="Nhập số CCCD..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
                    value={editData.chu_cccd || ''}
                    onChange={(e) => setEditData({...editData, chu_cccd: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Số điện thoại liên hệ chủ</label>
                  <input 
                    type="text" 
                    placeholder="Nhập số điện thoại..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
                    value={editData.chu_sdt || ''}
                    onChange={(e) => setEditData({...editData, chu_sdt: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Địa chỉ cư trú chủ</label>
                  <input 
                    type="text" 
                    placeholder="Nhập địa chỉ của chủ..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
                    value={editData.chu_diachi || ''}
                    onChange={(e) => setEditData({...editData, chu_diachi: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* SUB-SECTION 3: PRACTICAL MANAGER */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                3. Người quản lý thực tế (nếu có)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Họ và tên người quản lý</label>
                  <input 
                    type="text" 
                    placeholder="Nhập họ tên người quản lý..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
                    value={editData.quan_ly || ''}
                    onChange={(e) => setEditData({...editData, quan_ly: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Ngày sinh quản lý</label>
                  <input 
                    type="text" 
                    placeholder="Ngày/Tháng/Năm sinh..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
                    value={editData.quan_ly_ngaysinh || ''}
                    onChange={(e) => setEditData({...editData, quan_ly_ngaysinh: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Số CCCD / Hộ chiếu quản lý</label>
                  <input 
                    type="text" 
                    placeholder="Nhập số CCCD..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
                    value={editData.quan_ly_cccd || ''}
                    onChange={(e) => setEditData({...editData, quan_ly_cccd: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Số điện thoại liên hệ quản lý</label>
                  <input 
                    type="text" 
                    placeholder="Nhập số điện thoại..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
                    value={editData.quan_ly_sdt || ''}
                    onChange={(e) => setEditData({...editData, quan_ly_sdt: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Địa chỉ cư trú quản lý</label>
                  <input 
                    type="text" 
                    placeholder="Nhập địa chỉ của quản lý..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
                    value={editData.quan_ly_diachi || ''}
                    onChange={(e) => setEditData({...editData, quan_ly_diachi: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Coordinate Edit Section */}
            <div className="space-y-3 border-t border-slate-100 pt-4 pb-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Tọa độ GIS Cơ sở</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase pl-1">Kinh độ (Lng)</label>
                  <input
                    type="number"
                    step="0.000001"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-pink-555/20 focus:border-pink-500 transition-all"
                    value={editData.lng || ''}
                    onChange={(e) => setEditData({ ...editData, lng: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase pl-1">Vĩ độ (Lat)</label>
                  <input
                    type="number"
                    step="0.000001"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-pink-555/20 focus:border-pink-500 transition-all"
                    value={editData.lat || ''}
                    onChange={(e) => setEditData({ ...editData, lat: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              {onPickLocationOnMap && (
                <button
                  type="button"
                  onClick={() => onPickLocationOnMap('cskd-list', editData)}
                  className="w-full bg-pink-50 hover:bg-pink-100 border border-pink-200 text-pink-700 font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Chọn lại vị trí trên bản đồ
                </button>
              )}
            </div>

            <div className="pt-2 pb-2">
              <button 
                onClick={() => handleSave(editData)}
                disabled={!editData.ten}
                className="w-full bg-slate-700 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-slate-100 hover:shadow-slate-200/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-5 h-5" /> Lưu cập nhật
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
