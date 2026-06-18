import React from 'react';
import { X, Check, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EditCoQuanModalProps {
  editData: any | null;
  setEditData: (val: any | null) => void;
  handleSave: (data: any) => void;
  onPickLocationOnMap?: (category: string, currentData: any) => void;
}

export default function EditCoQuanModal({ editData, setEditData, handleSave, onPickLocationOnMap }: EditCoQuanModalProps) {
  if (!editData) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[2000] flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-700 text-white rounded-xl shadow-md shadow-slate-200">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-800 uppercase tracking-wide">Cập nhật Cơ quan</h2>
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
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                Tên Cơ quan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Nhập tên cơ quan nhà nước..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all"
                value={editData.ten || ''}
                onChange={(e) => setEditData({ ...editData, ten: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                Phân loại
              </label>
              <input
                type="text"
                placeholder="Nhập loại hình (ví dụ: Công an, Bệnh viện, UBND...)..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all"
                value={editData.loai || ''}
                onChange={(e) => setEditData({ ...editData, loai: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                Địa bàn / Phường xã
              </label>
              <input
                type="text"
                placeholder="Nhập phường xã trực thuộc..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all"
                value={editData.xaphuong || ''}
                onChange={(e) => setEditData({ ...editData, xaphuong: e.target.value })}
              />
            </div>

            {/* Coordinate Edit Section */}
            <div className="space-y-3 border-t border-slate-100 pt-4 pb-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Tọa độ GIS Cơ quan</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase pl-1">Kinh độ (Lng)</label>
                  <input
                    type="number"
                    step="0.000001"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all"
                    value={editData.lng || ''}
                    onChange={(e) => setEditData({ ...editData, lng: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase pl-1">Vĩ độ (Lat)</label>
                  <input
                    type="number"
                    step="0.000001"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all"
                    value={editData.lat || ''}
                    onChange={(e) => setEditData({ ...editData, lat: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              {onPickLocationOnMap && (
                <button
                  type="button"
                  onClick={() => onPickLocationOnMap('coquan-list', editData)}
                  className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Chọn lại vị trí trên bản đồ
                </button>
              )}
            </div>

            <div className="pt-2">
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
