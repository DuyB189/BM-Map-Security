import React from 'react';

interface Props {
  formData: any;
  setFormData: (val: any) => void;
}

export default function DoiTuongForm({ formData, setFormData }: Props) {
  return (
    <>
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Số CCCD / Định danh</label>
        <input 
          type="text" 
          placeholder="Nhập số CCCD (12 số)..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
          value={formData.cccd || ''}
          onChange={(e) => setFormData({...formData, cccd: e.target.value})}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Loại đối tượng / Hành vi</label>
        <select 
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
          value={formData.loai || ''}
          onChange={(e) => setFormData({...formData, loai: e.target.value})}
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
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Số điện thoại liên hệ</label>
        <input 
          type="text" 
          placeholder="Nhập số điện thoại liên hệ..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
          value={formData.sdt || ''}
          onChange={(e) => setFormData({...formData, sdt: e.target.value})}
        />
      </div>

      <div className="space-y-1.5 md:col-span-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Địa chỉ thường trú / Nơi ở hiện tại</label>
        <input 
          type="text" 
          placeholder="phường Bình Minh" 
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all" 
          value={formData.diachi || ''} 
          onChange={(e) => setFormData({...formData, diachi: e.target.value})} 
        />
      </div>

      <div className="space-y-1.5 md:col-span-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Mô tả hành vi & Đặc điểm</label>
        <textarea 
          placeholder="Mô tả đặc điểm nhận dạng, hành vi phạm tội, tiền án tiền sự..."
          rows={3}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-none"
          value={formData.description || ''}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
        />
      </div>
    </>
  );
}

