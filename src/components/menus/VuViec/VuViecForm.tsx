import React from 'react';

interface Props {
  formData: any;
  setFormData: (val: any) => void;
}

export default function VuViecForm({ formData, setFormData }: Props) {
  return (
    <div className="space-y-4 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
      
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Thời gian xảy ra</label>
        <input type="datetime-local" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none" value={formData.thoigian || ''} onChange={(e) => setFormData({...formData, thoigian: e.target.value})} />
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Trạng thái xử lý</label>
        <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none" value={formData.trangthai || 'Mới'} onChange={(e) => setFormData({...formData, trangthai: e.target.value})}>
          <option value="Mới">Mới</option><option value="Đang xử lý">Đang xử lý</option><option value="Đã giải quyết">Đã giải quyết</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Kết quả</label>
        <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none" value={formData.ketqua || ''} onChange={(e) => setFormData({...formData, ketqua: e.target.value})} />
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Group ID</label>
        <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none" value={formData.groupId || ''} onChange={(e) => setFormData({...formData, groupId: e.target.value})} />
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Ghi chú & mô tả</label>
        <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none h-20" value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})}></textarea>
      </div>

    </div>
  );
}
