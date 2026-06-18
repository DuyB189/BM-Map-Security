import React, { useState } from 'react';
import { Search, Plus, Trash2, UserPlus, AlertCircle } from 'lucide-react';

interface Props {
  formData: any;
  setFormData: (val: any) => void;
  doituongList: any[];
  onAddNewDoiTuong: (dt: any) => void;
  coords?: [number, number] | null;
}

export default function VuViecForm({ formData, setFormData, doituongList, onAddNewDoiTuong, coords }: Props) {
  const [searchText, setSearchText] = useState('');
  const [showAddQuick, setShowAddQuick] = useState(false);

  // New suspect form state
  const [newHoten, setNewHoten] = useState('');
  const [newCccd, setNewCccd] = useState('');
  const [newSdt, setNewSdt] = useState('');
  const [newDiachi, setNewDiachi] = useState('');
  const [newLoai, setNewLoai] = useState('Trộm cắp tài sản');
  const [newMota, setNewMota] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const selectedSuspects = (formData.suspectIds || []).map((id: any) => 
    doituongList.find(dt => String(dt.id) === String(id))
  ).filter(Boolean);

  const filteredDoiTuong = doituongList.filter(dt => {
    if (formData.suspectIds && formData.suspectIds.includes(dt.id)) return false;
    const nameMatch = (dt.hoten || '').toLowerCase().includes(searchText.toLowerCase());
    const cccdMatch = (dt.cccd || '').toLowerCase().includes(searchText.toLowerCase());
    return nameMatch || cccdMatch;
  });

  const handleSelectSuspect = (id: any) => {
    const current = formData.suspectIds || [];
    if (!current.includes(id)) {
      setFormData({ ...formData, suspectIds: [...current, id] });
    }
    setSearchText('');
  };

  const handleRemoveSuspect = (id: any) => {
    const current = formData.suspectIds || [];
    setFormData({ ...formData, suspectIds: current.filter((x: any) => x !== id) });
  };

  const handleCreateQuickSuspect = (e: React.MouseEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!newHoten.trim()) {
      setErrorMsg('Vui lòng nhập họ và tên đối tượng.');
      return;
    }

    const newId = "DT-" + Date.now();
    const finalCoords = coords || [106.101234, 11.314567];

    const newPerson = {
      id: newId,
      hoten: newHoten.trim(),
      cccd: newCccd.trim(),
      sdt: newSdt.trim(),
      diachi: newDiachi.trim() || 'phường Bình Minh',
      loai: newLoai,
      mota: newMota.trim(),
      lng: finalCoords[0],
      lat: finalCoords[1],
      ngay_tao: new Date().toISOString().split('T')[0]
    };

    // Add to global state
    onAddNewDoiTuong(newPerson);

    // Automatically link to current incident
    const current = formData.suspectIds || [];
    setFormData({ ...formData, suspectIds: [...current, newId] });

    // Reset form
    setNewHoten('');
    setNewCccd('');
    setNewSdt('');
    setNewDiachi('');
    setNewMota('');
    setShowAddQuick(false);
  };

  return (
    <div className="space-y-4 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
      
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Thời gian xảy ra</label>
        <input type="datetime-local" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none" value={formData.thoigian || ''} onChange={(e) => setFormData({...formData, thoigian: e.target.value})} />
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Trạng thái xử lý</label>
        <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none" value={formData.trangthai || 'Mới'} onChange={(e) => setFormData({...formData, trangthai: e.target.value})}>
          <option value="Mới">Mới</option>
          <option value="Đang xử lý">Đang xử lý</option>
          <option value="Đã giải quyết">Đã giải quyết</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Kết quả</label>
        <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none" value={formData.ketqua || ''} onChange={(e) => setFormData({...formData, ketqua: e.target.value})} />
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Nhóm vụ việc / Liên kết hồ sơ</label>
        <input type="text" placeholder="VD: GRP-001" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none" value={formData.groupId || ''} onChange={(e) => setFormData({...formData, groupId: e.target.value})} />
      </div>

      <div className="space-y-1.5 md:col-span-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Địa chỉ vụ việc</label>
        <input 
          type="text" 
          placeholder="phường Bình Minh" 
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none" 
          value={formData.diachi || ''} 
          onChange={(e) => setFormData({...formData, diachi: e.target.value})} 
        />
      </div>

      {/* SUSPECT LINKAGE SECTION */}
      <div className="space-y-2 md:col-span-2 border-t border-slate-100 pt-4">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Đối tượng tình nghi liên quan</label>
        
        {/* Selected suspect list */}
        {selectedSuspects.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 pl-1">
            {selectedSuspects.map((dt: any) => (
              <span key={dt.id} className="inline-flex items-center gap-1.5 bg-purple-555/10 text-purple-700 border border-purple-200/50 py-1.5 px-3 rounded-xl text-xs font-bold shadow-sm">
                <span>{dt.hoten} ({dt.loai})</span>
                <button type="button" onClick={() => handleRemoveSuspect(dt.id)} className="text-purple-400 hover:text-purple-650 cursor-pointer font-bold shrink-0">×</button>
              </span>
            ))}
          </div>
        )}

        {/* Suspect search and select */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input 
            type="text"
            placeholder="Tìm kiếm đối tượng theo tên hoặc CCCD..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 pl-9 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />

          {searchText.trim() !== '' && (
            <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto custom-scrollbar">
              {filteredDoiTuong.length > 0 ? (
                filteredDoiTuong.map(dt => (
                  <div 
                    key={dt.id}
                    onClick={() => handleSelectSuspect(dt.id)}
                    className="p-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 cursor-pointer flex justify-between items-center"
                  >
                    <div>
                      <div className="text-sm font-bold text-slate-700">{dt.hoten}</div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">{dt.loai} {dt.cccd ? `| CCCD: ${dt.cccd}` : ''}</div>
                    </div>
                    <Plus className="w-4 h-4 text-purple-600 shrink-0" />
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-xs text-slate-400">Không tìm thấy đối tượng nào trùng khớp.</div>
              )}
            </div>
          )}
        </div>

        {/* Quick add suspect form toggle */}
        <div className="pt-1 pl-1">
          <button
            type="button"
            onClick={() => {
              setShowAddQuick(!showAddQuick);
              setErrorMsg('');
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-700 transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            {showAddQuick ? 'Đóng form thêm nhanh' : 'Thêm nhanh đối tượng tình nghi mới'}
          </button>
        </div>

        {/* Quick add suspect sub-form */}
        {showAddQuick && (
          <div className="bg-purple-50/30 border border-purple-100/50 p-4 rounded-2xl space-y-3 mt-2 animate-none">
            <h5 className="text-[10px] font-bold text-purple-700 uppercase tracking-widest pl-1">Tạo đối tượng tình nghi mới</h5>
            
            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2 text-rose-700 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-1">Họ và tên *</label>
                <input 
                  type="text" 
                  placeholder="Nhập tên đối tượng..."
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 outline-none"
                  value={newHoten}
                  onChange={(e) => setNewHoten(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-1">Số CCCD</label>
                <input 
                  type="text" 
                  placeholder="Nhập CCCD..."
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 outline-none"
                  value={newCccd}
                  onChange={(e) => setNewCccd(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-1">Số điện thoại</label>
                <input 
                  type="text" 
                  placeholder="Nhập SĐT..."
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 outline-none"
                  value={newSdt}
                  onChange={(e) => setNewSdt(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-1">Loại đối tượng</label>
                <select 
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 outline-none"
                  value={newLoai}
                  onChange={(e) => setNewLoai(e.target.value)}
                >
                  <option value="Trộm cắp tài sản">Trộm cắp tài sản</option>
                  <option value="Tội phạm ma túy">Tội phạm ma túy</option>
                  <option value="Cướp giật tài sản">Cướp giật tài sản</option>
                  <option value="Gây rối trật tự công cộng">Gây rối trật tự công cộng</option>
                  <option value="Cố ý gây thương tích">Cố ý gây thương tích</option>
                  <option value="Đối tượng nghi vấn">Đối tượng nghi vấn</option>
                  <option value="Khác">Khác / Chưa phân loại</option>
                </select>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-1">Địa chỉ</label>
                <input 
                  type="text" 
                  placeholder="Ví dụ: phường Bình Minh"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 outline-none"
                  value={newDiachi}
                  onChange={(e) => setNewDiachi(e.target.value)}
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-1">Mô tả hành vi & Đặc điểm</label>
                <textarea 
                  placeholder="Nhập mô tả nhận dạng..."
                  rows={2}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 outline-none resize-none"
                  value={newMota}
                  onChange={(e) => setNewMota(e.target.value)}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleCreateQuickSuspect}
              className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-purple-100"
            >
              Thêm & Chọn đối tượng này
            </button>
          </div>
        )}
      </div>

      <div className="space-y-1.5 md:col-span-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Ghi chú & mô tả</label>
        <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none h-20" value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})}></textarea>
      </div>

    </div>
  );
}
