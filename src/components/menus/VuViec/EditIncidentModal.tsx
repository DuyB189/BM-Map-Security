import { X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EditIncidentModalProps {
  editData: any | null;
  setEditData: (val: any | null) => void;
  handleSave: (data: any) => void;
}

export default function EditIncidentModal({ editData, setEditData, handleSave }: EditIncidentModalProps) {
  if (!editData) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[2000] flex items-center justify-center p-6">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col"
        >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Cập nhật vụ việc</h2>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-0.5">Mã: {editData.id || editData.loai}</p>
            </div>
            <button onClick={() => setEditData(null)} className="text-slate-400 hover:text-slate-600 p-2"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Loại vụ việc</label>
              <input 
                type="text" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20"
                value={editData.loai || ''}
                onChange={(e) => setEditData({...editData, loai: e.target.value})}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Mô tả</label>
              <textarea 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20 h-20 resize-none"
                value={editData.mota || ''}
                onChange={(e) => setEditData({...editData, mota: e.target.value})}
              ></textarea>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Trạng thái xử lý (UC-INC-04)</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20"
                value={editData.trangthai || 'Mới'}
                onChange={(e) => setEditData({...editData, trangthai: e.target.value})}
              >
                <option value="Mới">Mới</option>
                <option value="Đang xử lý">Đang xử lý</option>
                <option value="Đã giải quyết">Đã giải quyết</option>
                <option value="Báo động giả">Báo động giả</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Kết quả</label>
              <input 
                type="text" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20"
                value={editData.ketqua || ''}
                onChange={(e) => setEditData({...editData, ketqua: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Nhóm vụ việc / Liên kết hồ sơ (UC-INC-06)</label>
              <input 
                type="text" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20"
                value={editData.groupId || ''}
                placeholder="VD: GRP-001"
                onChange={(e) => setEditData({...editData, groupId: e.target.value})}
              />
            </div>
            </div>
            <button 
              onClick={() => handleSave(editData)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" /> Lưu cập nhật
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
