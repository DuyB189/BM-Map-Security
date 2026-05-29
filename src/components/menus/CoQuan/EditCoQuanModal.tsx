import React from 'react';
import { X, Check, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EditCoQuanModalProps {
  editData: any | null;
  setEditData: (val: any | null) => void;
  handleSave: (data: any) => void;
}

export default function EditCoQuanModal({ editData, setEditData, handleSave }: EditCoQuanModalProps) {
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

            <div className="pt-2">
              <button
                onClick={() => handleSave(editData)}
                disabled={!editData.ten}
                className="w-full bg-slate-700 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-slate-100 hover:shadow-slate-200/50 transition-all flex items-center justify-center gap-2"
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
