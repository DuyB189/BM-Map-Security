import { X, MapPin, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GISMenu } from '../types';
import FormRenderer from './menus/FormRenderer';

interface AddFormModalProps {
  showForm: boolean;
  setShowForm: (val: boolean) => void;
  formData: any;
  setFormData: (val: any) => void;
  menu: GISMenu[];
  selectedCoords: [number, number] | null;
  setSelectedCoords?: (val: [number, number] | null) => void;
  onPickOnMap?: () => void;
  handleAdd: () => void;
  routeCoordinates?: [number, number][];
  setRouteCoordinates?: (val: any) => void;
  doituongList: any[];
  onAddNewDoiTuong: (dt: any) => void;
}

export default function AddFormModal({
  showForm,
  setShowForm,
  formData,
  setFormData,
  menu,
  selectedCoords,
  setSelectedCoords,
  onPickOnMap,
  handleAdd,
  routeCoordinates,
  setRouteCoordinates,
  doituongList,
  onAddNewDoiTuong
}: AddFormModalProps) {
  const isRouteMode = formData.category === 'tuyenduong-list';

  const handleCloseModal = () => {
    setFormData({
      title: '',
      category: 'vuviec-list',
      description: '',
      loai: '',
      mucdo: 'Trung bình',
      radius: 300,
      xaphuong: 'Phường Bình Minh',
      diachi: '',
      thoigian: '',
      trangthai: 'Mới',
      ketqua: '',
      groupId: '',
      cccd: '',
      sdt: '',
      hinh_anh: '',
      nhom_nhan: [],
      lich_su_hoat_dong: [],
      chu_camera: '',
      sdt_chu: '',
      mst: '',
      loai_hinh_kd: 'Hộ kinh doanh cá thể',
      giay_phep: '',
      giay_phep_antt: {},
      giay_phep_pccc: {},
      lich_su_kiem_tra: [],
      chu_co_so: '',
      chu_ngaysinh: '',
      chu_cccd: '',
      chu_sdt: '',
      chu_diachi: '',
      quan_ly: '',
      quan_ly_ngaysinh: '',
      quan_ly_cccd: '',
      quan_ly_sdt: '',
      quan_ly_diachi: '',
      suspectIds: [],
    });
    if (setRouteCoordinates) setRouteCoordinates([]);
    if (setSelectedCoords) setSelectedCoords(null);
    setShowForm(false);
  };

  return (
    <AnimatePresence>
      {showForm && (
        <div className={isRouteMode 
          ? "fixed inset-0 z-[1000] pointer-events-none flex items-start justify-start pt-[86px] pl-4 pr-4 pb-4" 
          : "fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[2000] flex items-center justify-center p-6"
        }>
          <motion.div 
            initial={isRouteMode ? { x: -400, opacity: 0 } : { scale: 0.9, opacity: 0 }}
            animate={isRouteMode ? { x: 0, opacity: 1 } : { scale: 1, opacity: 1 }}
            exit={isRouteMode ? { x: -400, opacity: 0 } : { scale: 0.9, opacity: 0 }}
            transition={isRouteMode ? { type: 'spring', damping: 25, stiffness: 200 } : undefined}
            className={isRouteMode 
              ? "bg-white rounded-3xl w-[380px] shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[calc(100vh-120px)] pointer-events-auto shrink-0"
              : "bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col"
            }
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  {isRouteMode ? 'Vẽ tuyến đường mới' : 'Ghim vị trí mới'}
                </h2>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-0.5">
                  {isRouteMode ? 'Nhấp trên bản đồ để thêm các điểm' : 'Thêm dữ liệu GIS vào bản đồ'}
                </p>
              </div>
              <button onClick={handleCloseModal} title="Đóng hộp thoại" className="text-slate-400 hover:text-slate-600 p-2 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <div className={isRouteMode ? "space-y-5 mb-5 flex flex-col" : "grid grid-cols-1 md:grid-cols-2 gap-5 mb-5"}>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Phân loại dữ liệu</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20 animate-none"
                    value={formData.category}
                    onChange={(e) => {
                      const cat = e.target.value;
                      let defaultStatus = 'Đang hoạt động';
                      if (cat === 'camera-list') {
                        defaultStatus = 'Hoạt động';
                      } else if (cat === 'vuviec-list') {
                        defaultStatus = 'Mới';
                      }
                      setFormData({...formData, category: cat, title: '', description: '', loai: '', thoigian: '', ketqua: '', groupId: '', trangthai: defaultStatus});
                    }}
                  >
                    {menu.map(m => <option key={m.id} value={m.target}>{m.title}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                    {formData.category === 'vuviec-list' ? 'Tên vụ việc' : 
                     formData.category === 'doituong-list' ? 'Họ và tên' : 
                     formData.category === 'camera-list' ? 'Tên camera' : 
                     formData.category === 'tuyenduong-list' ? 'Tên tuyến đường' : 'Tên đối tượng hiển thị'}
                  </label>
                  <input 
                    type="text" 
                    placeholder="Nhập tên..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>

                <FormRenderer 
                  formData={formData} 
                  setFormData={setFormData} 
                  routeCoordinates={routeCoordinates} 
                  setRouteCoordinates={setRouteCoordinates} 
                  doituongList={doituongList}
                  onAddNewDoiTuong={onAddNewDoiTuong}
                  selectedCoords={selectedCoords}
                />
              </div>

              {!isRouteMode ? (
                <div className="bg-sky-50 p-4 rounded-2xl border border-sky-100 mb-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sky-800 font-bold text-xs">
                      <MapPin className="w-4 h-4 text-sky-600" />
                      <span>Tọa độ ghim (do người dùng chọn)</span>
                    </div>
                    {onPickOnMap && (
                      <button
                        type="button"
                        onClick={onPickOnMap}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Chọn vị trí trên bản đồ</span>
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Kinh độ (LNG) *</label>
                      <input 
                        type="number" 
                        step="any"
                        placeholder="Nhập hoặc chọn trên bản đồ..."
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 font-mono outline-none focus:ring-2 focus:ring-sky-500/20"
                        value={selectedCoords && Number.isFinite(selectedCoords[0]) ? selectedCoords[0] : ''}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const val = raw === '' ? NaN : parseFloat(raw);
                          if (setSelectedCoords) {
                            const prevLat = selectedCoords ? selectedCoords[1] : NaN;
                            if (isNaN(val) && isNaN(prevLat)) {
                              setSelectedCoords(null);
                            } else {
                              setSelectedCoords([val, prevLat]);
                            }
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Vĩ độ (LAT) *</label>
                      <input 
                        type="number" 
                        step="any"
                        placeholder="Nhập hoặc chọn trên bản đồ..."
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 font-mono outline-none focus:ring-2 focus:ring-sky-500/20"
                        value={selectedCoords && Number.isFinite(selectedCoords[1]) ? selectedCoords[1] : ''}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const val = raw === '' ? NaN : parseFloat(raw);
                          if (setSelectedCoords) {
                            const prevLng = selectedCoords ? selectedCoords[0] : NaN;
                            if (isNaN(val) && isNaN(prevLng)) {
                              setSelectedCoords(null);
                            } else {
                              setSelectedCoords([prevLng, val]);
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                  {(!selectedCoords || !Number.isFinite(selectedCoords[0]) || !Number.isFinite(selectedCoords[1])) && (
                    <p className="text-[11px] font-semibold text-amber-700">
                      Vui lòng bấm &ldquo;Chọn vị trí trên bản đồ&rdquo; hoặc nhập đầy đủ Kinh độ &amp; Vĩ độ.
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-emerald-50 p-3 rounded-2xl border border-emerald-100 mb-4">
                  <MapPin className="w-5 h-5 text-emerald-600 animate-bounce" />
                  <div className="text-[10px] text-emerald-800 font-mono leading-relaxed">
                    <span className="font-bold uppercase tracking-wider block text-[8px] text-emerald-600">Đang vẽ tuyến đường</span>
                    <span className="font-bold">Đã chọn:</span> {routeCoordinates?.length || 0} điểm tọa độ (yêu cầu &ge; 2)
                  </div>
                </div>
              )}

              <button 
                onClick={handleAdd}
                disabled={
                  !formData.title ||
                  (isRouteMode
                    ? !routeCoordinates || routeCoordinates.length < 2
                    : !selectedCoords || !Number.isFinite(selectedCoords[0]) || !Number.isFinite(selectedCoords[1]))
                }
                className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-4 rounded-2xl shadow-lg shadow-sky-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-5 h-5" /> {isRouteMode ? 'Lưu tuyến đường' : 'Xác nhận lưu ghim'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
