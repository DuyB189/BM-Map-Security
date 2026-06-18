import React from 'react';
import { X, Check, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EditDiemNongModalProps {
  editData: any | null;
  setEditData: (val: any | null) => void;
  handleSave: (data: any) => void;
  onPickLocationOnMap?: (category: string, currentData: any) => void;
}

export default function EditDiemNongModal({ editData, setEditData, handleSave, onPickLocationOnMap }: EditDiemNongModalProps) {
  if (!editData) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[2000] flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-600 text-white rounded-xl shadow-md shadow-rose-100 animate-pulse">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-800 uppercase tracking-wide">Cập nhật Điểm Nóng</h2>
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
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                Tên Điểm Nóng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Nhập tên điểm nóng..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-semibold"
                value={editData.ten || ''}
                onChange={(e) => setEditData({ ...editData, ten: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Phân loại</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Tụ tập cờ bạc, Đua xe..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                  value={editData.loai || ''}
                  onChange={(e) => setEditData({ ...editData, loai: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Địa bàn / Phường xã</label>
                <input
                  type="text"
                  placeholder="Nhập phường xã quản lý..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                  value={editData.xaphuong || ''}
                  onChange={(e) => setEditData({ ...editData, xaphuong: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Mức độ cảnh báo</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                  value={editData.mucdo || 'Trung bình'}
                  onChange={(e) => setEditData({ ...editData, mucdo: e.target.value })}
                >
                  <option value="Trung bình">Trung bình</option>
                  <option value="Cao">Cao</option>
                  <option value="Rất cao">Rất cao</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Phạm vi (mét)</label>
                <input
                  type="number"
                  placeholder="Ví dụ: 300"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                  value={editData.radius === undefined || editData.radius === '' ? '' : editData.radius}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditData({ ...editData, radius: val === '' ? '' : (parseInt(val) || 0) });
                  }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Ghi chú & mô tả tình hình</label>
              <textarea
                placeholder="Mô tả cụ thể về tụ điểm, thời gian hoạt động..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all h-24 resize-none"
                value={editData.mota || ''}
                onChange={(e) => setEditData({ ...editData, mota: e.target.value })}
              />
            </div>

            {/* Coordinate Edit Section */}
            <div className="space-y-3 border-t border-slate-100 pt-4 pb-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Tọa độ GIS Điểm Nóng</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase pl-1">Kinh độ (Lng)</label>
                  <input
                    type="number"
                    step="0.000001"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-rose-555/20 focus:border-rose-500 transition-all"
                    value={editData.lng || ''}
                    onChange={(e) => setEditData({ ...editData, lng: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase pl-1">Vĩ độ (Lat)</label>
                  <input
                    type="number"
                    step="0.000001"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-rose-555/20 focus:border-rose-500 transition-all"
                    value={editData.lat || ''}
                    onChange={(e) => setEditData({ ...editData, lat: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              {onPickLocationOnMap && (
                <button
                  type="button"
                  onClick={() => onPickLocationOnMap('diemnong-list', editData)}
                  className="w-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
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
