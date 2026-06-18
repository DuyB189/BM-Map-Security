import React from 'react';
import { X, Check, Store } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EditCskdModalProps {
  editData: any | null;
  setEditData: (val: any | null) => void;
  handleSave: (data: any) => void;
  onPickLocationOnMap?: (category: string, currentData: any) => void;
}

export default function EditCskdModal({ editData, setEditData, handleSave, onPickLocationOnMap }: EditCskdModalProps) {
  if (!editData) return null;

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
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Giấy phép liên quan (GPKD, ANTT, PCCC...)</label>
                  <input 
                    type="text" 
                    placeholder="Số giấy phép, ngày cấp, cơ quan cấp..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
                    value={editData.giay_phep || ''}
                    onChange={(e) => setEditData({...editData, giay_phep: e.target.value})}
                  />
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
