import React, { useState } from 'react';
import { X, Check, Search, Plus, UserPlus, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EditIncidentModalProps {
  editData: any | null;
  setEditData: (val: any | null) => void;
  handleSave: (data: any) => void;
  doituongList: any[];
  onAddNewDoiTuong: (dt: any) => void;
  onPickLocationOnMap?: (category: string, currentData: any) => void;
}

export default function EditIncidentModal({
  editData,
  setEditData,
  handleSave,
  doituongList,
  onAddNewDoiTuong,
  onPickLocationOnMap
}: EditIncidentModalProps) {
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

  if (!editData) return null;

  const selectedSuspects = (editData.suspectIds || []).map((id: any) =>
    doituongList.find(dt => String(dt.id) === String(id))
  ).filter(Boolean);

  const filteredDoiTuong = doituongList.filter(dt => {
    if (editData.suspectIds && editData.suspectIds.includes(dt.id)) return false;
    const nameMatch = (dt.hoten || '').toLowerCase().includes(searchText.toLowerCase());
    const cccdMatch = (dt.cccd || '').toLowerCase().includes(searchText.toLowerCase());
    return nameMatch || cccdMatch;
  });

  const handleSelectSuspect = (id: any) => {
    const current = editData.suspectIds || [];
    if (!current.includes(id)) {
      setEditData({ ...editData, suspectIds: [...current, id] });
    }
    setSearchText('');
  };

  const handleRemoveSuspect = (id: any) => {
    const current = editData.suspectIds || [];
    setEditData({ ...editData, suspectIds: current.filter((x: any) => x !== id) });
  };

  const handleCreateQuickSuspect = (e: React.MouseEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!newHoten.trim()) {
      setErrorMsg('Vui lòng nhập họ và tên đối tượng.');
      return;
    }

    const newId = "DT-" + Date.now();
    const finalCoords = [editData.lng || 106.101234, editData.lat || 11.314567];

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
    const current = editData.suspectIds || [];
    setEditData({ ...editData, suspectIds: [...current, newId] });

    // Reset form
    setNewHoten('');
    setNewCccd('');
    setNewSdt('');
    setNewDiachi('');
    setNewMota('');
    setShowAddQuick(false);
  };

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
            </div>
            <button onClick={() => setEditData(null)} className="text-slate-400 hover:text-slate-600 p-2"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Tên vụ việc</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20"
                  value={editData.loai || ''}
                  onChange={(e) => setEditData({ ...editData, loai: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Thời gian xảy ra</label>
                <input
                  type="datetime-local"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20"
                  value={editData.thoigian || ''}
                  onChange={(e) => setEditData({ ...editData, thoigian: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Ghi chú & Mô tả</label>
                <textarea
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20 h-20 resize-none"
                  value={editData.mota || ''}
                  onChange={(e) => setEditData({ ...editData, mota: e.target.value })}
                ></textarea>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Địa chỉ vụ việc</label>
                <input
                  type="text"
                  placeholder="phường Bình Minh"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20"
                  value={editData.diachi || ''}
                  onChange={(e) => setEditData({ ...editData, diachi: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Trạng thái xử lý (UC-INC-04)</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20"
                  value={editData.trangthai || 'Mới'}
                  onChange={(e) => setEditData({ ...editData, trangthai: e.target.value })}
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
                  onChange={(e) => setEditData({ ...editData, ketqua: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Nhóm vụ việc / Liên kết hồ sơ</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20"
                  value={editData.groupId || ''}
                  placeholder="VD: GRP-001"
                  onChange={(e) => setEditData({ ...editData, groupId: e.target.value })}
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

              {/* Coordinate Edit Section */}
              <div className="space-y-3 border-t border-slate-100 pt-4 pb-2 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Tọa độ GIS hiện trường</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase pl-1">Kinh độ (Lng)</label>
                    <input
                      type="number"
                      step="0.000001"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                      value={editData.lng || ''}
                      onChange={(e) => setEditData({ ...editData, lng: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase pl-1">Vĩ độ (Lat)</label>
                    <input
                      type="number"
                      step="0.000001"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                      value={editData.lat || ''}
                      onChange={(e) => setEditData({ ...editData, lat: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                {onPickLocationOnMap && (
                  <button
                    type="button"
                    onClick={() => onPickLocationOnMap('vuviec-list', editData)}
                    className="w-full bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Chọn lại vị trí trên bản đồ
                  </button>
                )}
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
