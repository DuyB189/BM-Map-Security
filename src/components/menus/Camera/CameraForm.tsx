import React from 'react';

interface Props {
  formData: any;
  setFormData: (val: any) => void;
}

export default function CameraForm({ formData, setFormData }: Props) {
  return (
    <>
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Chủ sở hữu Camera</label>
        <input 
          type="text" 
          placeholder="Nhập tên chủ camera..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20"
          value={formData.chu_camera || ''}
          onChange={(e) => setFormData({...formData, chu_camera: e.target.value})}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Số điện thoại</label>
        <input 
          type="text" 
          placeholder="Nhập số điện thoại..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20"
          value={formData.sdt_chu || ''}
          onChange={(e) => setFormData({...formData, sdt_chu: e.target.value})}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Trạng thái hoạt động</label>
        <select 
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20"
          value={formData.trangthai || 'Hoạt động'}
          onChange={(e) => setFormData({...formData, trangthai: e.target.value})}
        >
          <option value="Hoạt động">Hoạt động</option>
          <option value="Tạm ngưng">Tạm ngưng</option>
        </select>
      </div>

      <div className="space-y-1.5 md:col-span-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Địa chỉ lắp đặt</label>
        <input 
          type="text" 
          placeholder="phường Bình Minh" 
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20" 
          value={formData.diachi || ''} 
          onChange={(e) => setFormData({...formData, diachi: e.target.value})} 
        />
      </div>

      <div className="space-y-1.5 md:col-span-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Mô tả chi tiết</label>
        <textarea 
          placeholder="Nhập mô tả vị trí lắp đặt, hướng quay,..."
          rows={3}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20 resize-none"
          value={formData.description || ''}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
        />
      </div>
    </>
  );
}
