import React from 'react';

interface Props {
  formData: any;
  setFormData: (val: any) => void;
}

export default function DiemNongForm({ formData, setFormData }: Props) {
  return (
    <div className="space-y-4 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Phân loại</label>
        <input type="text" placeholder="Ví dụ: Tụ tập cờ bạc, Đua xe..." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none" value={formData.loai || ''} onChange={(e) => setFormData({ ...formData, loai: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Địa bàn / Phường xã</label>
        <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none" value={formData.xaphuong || ''} onChange={(e) => setFormData({ ...formData, xaphuong: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Mức độ cảnh báo</label>
        <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none" value={formData.mucdo || 'Trung bình'} onChange={(e) => setFormData({ ...formData, mucdo: e.target.value })}>
          <option value="Trung bình">Trung bình</option><option value="Cao">Cao</option><option value="Rất cao">Rất cao</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Phạm vi điểm nóng (mét)</label>
        <input 
          type="number" 
          placeholder="Ví dụ: 300" 
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none" 
          value={formData.radius === undefined || formData.radius === '' ? '' : formData.radius} 
          onChange={(e) => {
            const val = e.target.value;
            setFormData({ ...formData, radius: val === '' ? '' : (parseInt(val) || 0) });
          }} 
        />
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Ghi chú & mô tả</label>
        <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none h-20" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })}></textarea>
      </div>

    </div>
  );
}
