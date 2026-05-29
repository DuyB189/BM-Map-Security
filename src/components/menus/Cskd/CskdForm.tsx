import React from 'react';

interface Props {
  formData: any;
  setFormData: (val: any) => void;
}

export default function CskdForm({ formData, setFormData }: Props) {
  return (
    <div className="space-y-6 md:col-span-2">
      
      {/* SECTION 1: LEGAL & IDENTIFICATION */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-1.5 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
          1. Thông tin Định danh & Pháp lý
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Mã số thuế / Doanh nghiệp</label>
            <input 
              type="text" 
              placeholder="Nhập mã số thuế..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20 transition-all" 
              value={formData.mst || ''} 
              onChange={(e) => setFormData({...formData, mst: e.target.value})} 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Loại hình kinh doanh</label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20 transition-all" 
              value={formData.loai_hinh_kd || 'Hộ kinh doanh cá thể'} 
              onChange={(e) => setFormData({...formData, loai_hinh_kd: e.target.value})}
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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20 transition-all" 
              value={formData.loai || ''} 
              onChange={(e) => setFormData({...formData, loai: e.target.value})} 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Trạng thái hoạt động</label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20 transition-all" 
              value={formData.trangthai || 'Đang hoạt động'} 
              onChange={(e) => setFormData({...formData, trangthai: e.target.value})}
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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20 transition-all" 
              value={formData.giay_phep || ''} 
              onChange={(e) => setFormData({...formData, giay_phep: e.target.value})} 
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: LEGAL REPRESENTATIVE (OWNER) */}
      <div className="space-y-4 pt-2">
        <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-1.5 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
          2. Người Đại diện Pháp luật (Chủ cơ sở)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Họ và tên chủ</label>
            <input 
              type="text" 
              placeholder="Nhập họ tên chủ cơ sở..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20 transition-all" 
              value={formData.chu_co_so || ''} 
              onChange={(e) => setFormData({...formData, chu_co_so: e.target.value})} 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Ngày sinh chủ</label>
            <input 
              type="text" 
              placeholder="Ngày/Tháng/Năm sinh..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20 transition-all" 
              value={formData.chu_ngaysinh || ''} 
              onChange={(e) => setFormData({...formData, chu_ngaysinh: e.target.value})} 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Số CCCD / Hộ chiếu chủ</label>
            <input 
              type="text" 
              placeholder="Nhập số CCCD..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20 transition-all" 
              value={formData.chu_cccd || ''} 
              onChange={(e) => setFormData({...formData, chu_cccd: e.target.value})} 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Số điện thoại liên hệ chủ</label>
            <input 
              type="text" 
              placeholder="Nhập số điện thoại chủ..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20 transition-all" 
              value={formData.chu_sdt || ''} 
              onChange={(e) => setFormData({...formData, chu_sdt: e.target.value})} 
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Địa chỉ thường trú / Tạm trú chủ</label>
            <input 
              type="text" 
              placeholder="Nhập địa chỉ cư trú của chủ..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20 transition-all" 
              value={formData.chu_diachi || ''} 
              onChange={(e) => setFormData({...formData, chu_diachi: e.target.value})} 
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: PRACTICAL MANAGER */}
      <div className="space-y-4 pt-2">
        <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-1.5 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
          3. Người quản lý thực tế (nếu có)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Họ và tên người quản lý</label>
            <input 
              type="text" 
              placeholder="Nhập họ tên người quản lý..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20 transition-all" 
              value={formData.quan_ly || ''} 
              onChange={(e) => setFormData({...formData, quan_ly: e.target.value})} 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Ngày sinh quản lý</label>
            <input 
              type="text" 
              placeholder="Ngày/Tháng/Năm sinh..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20 transition-all" 
              value={formData.quan_ly_ngaysinh || ''} 
              onChange={(e) => setFormData({...formData, quan_ly_ngaysinh: e.target.value})} 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Số CCCD / Hộ chiếu quản lý</label>
            <input 
              type="text" 
              placeholder="Nhập số CCCD..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20 transition-all" 
              value={formData.quan_ly_cccd || ''} 
              onChange={(e) => setFormData({...formData, quan_ly_cccd: e.target.value})} 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Số điện thoại liên hệ quản lý</label>
            <input 
              type="text" 
              placeholder="Nhập số điện thoại quản lý..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20 transition-all" 
              value={formData.quan_ly_sdt || ''} 
              onChange={(e) => setFormData({...formData, quan_ly_sdt: e.target.value})} 
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Địa chỉ thường trú / Tạm trú quản lý</label>
            <input 
              type="text" 
              placeholder="Nhập địa chỉ cư trú của quản lý..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20 transition-all" 
              value={formData.quan_ly_diachi || ''} 
              onChange={(e) => setFormData({...formData, quan_ly_diachi: e.target.value})} 
            />
          </div>
        </div>
      </div>

    </div>
  );
}
