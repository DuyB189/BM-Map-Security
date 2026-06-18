import React from 'react';
import { X, Check, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EditDoiTuongModalProps {
  editData: any | null;
  setEditData: (val: any | null) => void;
  handleSave: (data: any) => void;
  onPickLocationOnMap?: (category: string, currentData: any) => void;
}

export default function EditDoiTuongModal({ editData, setEditData, handleSave, onPickLocationOnMap }: EditDoiTuongModalProps) {
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
              <div className="p-2 bg-purple-600 text-white rounded-xl shadow-md shadow-purple-100">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-800 uppercase tracking-wide">Cập nhật Đối tượng</h2>
                <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mt-0.5">
                  ID: {editData.id || 'Chưa định danh'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setEditData(null)} 
              className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                Họ và tên đối tượng <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                placeholder="Nhập họ và tên..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                value={editData.hoten || ''}
                onChange={(e) => setEditData({...editData, hoten: e.target.value})}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                Số CCCD / Định danh
              </label>
              <input 
                type="text" 
                placeholder="Nhập số CCCD (12 số)..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                value={editData.cccd || ''}
                onChange={(e) => setEditData({...editData, cccd: e.target.value})}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                Loại đối tượng / Hành vi
              </label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                value={editData.loai || ''}
                onChange={(e) => setEditData({...editData, loai: e.target.value})}
              >
                <option value="">-- Chọn phân loại đối tượng --</option>
                <option value="Trộm cắp tài sản">Trộm cắp tài sản</option>
                <option value="Tội phạm ma túy">Tội phạm ma túy</option>
                <option value="Cướp giật tài sản">Cướp giật tài sản</option>
                <option value="Gây rối trật tự công cộng">Gây rối trật tự công cộng</option>
                <option value="Cố ý gây thương tích">Cố ý gây thương tích</option>
                <option value="Đối tượng nghi vấn">Đối tượng nghi vấn</option>
                <option value="Khác">Khác / Chưa phân loại</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                Số điện thoại liên hệ
              </label>
              <input 
                type="text" 
                placeholder="Nhập số điện thoại..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                value={editData.sdt || ''}
                onChange={(e) => setEditData({...editData, sdt: e.target.value})}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                Địa chỉ thường trú / Nơi ở hiện tại
              </label>
              <input
                type="text"
                placeholder="phường Bình Minh"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                value={editData.diachi || ''}
                onChange={(e) => setEditData({ ...editData, diachi: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                Mô tả hành vi & Đặc điểm
              </label>
              <textarea 
                placeholder="Nhập đặc điểm nhận dạng, ghi chú đối tượng..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-none"
                value={editData.mota || ''}
                onChange={(e) => setEditData({...editData, mota: e.target.value})}
              />
            </div>

            {/* Coordinate Edit Section */}
            <div className="space-y-3 border-t border-slate-100 pt-4 pb-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Tọa độ GIS Đối tượng</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase pl-1">Kinh độ (Lng)</label>
                  <input
                    type="number"
                    step="0.000001"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                    value={editData.lng || ''}
                    onChange={(e) => setEditData({ ...editData, lng: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase pl-1">Vĩ độ (Lat)</label>
                  <input
                    type="number"
                    step="0.000001"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                    value={editData.lat || ''}
                    onChange={(e) => setEditData({ ...editData, lat: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              {onPickLocationOnMap && (
                <button
                  type="button"
                  onClick={() => onPickLocationOnMap('doituong-list', editData)}
                  className="w-full bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Chọn lại vị trí trên bản đồ
                </button>
              )}
            </div>

            <div className="pt-2">
              <button 
                onClick={() => handleSave(editData)}
                disabled={!editData.hoten}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-purple-100 hover:shadow-purple-200/50 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
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
