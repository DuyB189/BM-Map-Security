import React from 'react';
import { Search, Eye, EyeOff, ChevronLeft, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GISData } from '../types';
import { getIcon } from '../utils/icons';
import { useState } from 'react';

interface SidebarProps {
  isMenuOpen: boolean;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  data: GISData;
  activeMenu: string | null;
  setActiveMenu: (val: string | null) => void;
  hiddenLayers: string[];
  setHiddenLayers: React.Dispatch<React.SetStateAction<string[]>>;
  visibleCounts: Record<string, number>;
  getFilteredData: (type: string) => any[];
  handleItemHover: (id: string | number, category: string, isHovering: boolean) => void;
  handleItemClick: (item: any) => void;
  handleDelete: (id: string | number, category: string) => void;
}

export default function Sidebar({
  isMenuOpen,
  searchQuery, setSearchQuery,
  data, activeMenu, setActiveMenu,
  hiddenLayers, setHiddenLayers,
  visibleCounts, getFilteredData,
  handleItemHover, handleItemClick, handleDelete
}: SidebarProps) {
  
  const [timeFilter, setTimeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const activeMenuObj = data.menu.find(m => m.id === activeMenu);
  let activeListData = activeMenuObj ? getFilteredData(activeMenuObj.target) : [];
  
  // UC-INC-03: Tra cứu & Lọc vụ việc
  if (activeMenu === 'menu-vuviec') {
    if (statusFilter) {
      activeListData = activeListData.filter(item => item.trangthai === statusFilter);
    }
    // Lọc theo thời gian giả định cho UC-INC-03 (tuần/tháng/năm)
    if (timeFilter === 'today') {
      const today = new Date().toISOString().slice(0, 10);
      activeListData = activeListData.filter(item => item.thoigian?.startsWith(today));
    } else if (timeFilter === '2023') {
      activeListData = activeListData.filter(item => item.thoigian?.includes('2023'));
    }
  }

  const filteredActiveList = activeListData.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <motion.div 
      initial={false}
      animate={{ x: isMenuOpen ? 0 : -340 }}
      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      style={{ height: 'calc(100vh - 120px)' }}
      className="absolute top-24 left-6 w-80 glass-dark border border-slate-200 z-[900] flex flex-col shadow-2xl rounded-3xl overflow-hidden"
    >
      <div className="p-5 border-b border-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tra cứu nhanh..."
            className="w-full bg-slate-100 border-none rounded-xl py-3 pl-10 pr-4 text-xs text-slate-800 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-sky-500/20 transition-all font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          {!activeMenu ? (
            <motion.div 
              key="menu"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col h-full absolute inset-0"
            >
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {data.menu.map((menu) => {
                  const listData = getFilteredData(menu.target)
                    .filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()));
                  
                  if (searchQuery && listData.length === 0) return null;

                  const isHidden = hiddenLayers.includes(menu.target);
                  const count = visibleCounts[menu.id] || 10;
                  const displayedList = listData.slice(0, count);

                  return (
                    <div key={menu.id} className="space-y-1">
                      <div 
                        className={`w-full flex items-center justify-between p-1 pr-3 rounded-xl transition-all cursor-pointer text-slate-600 hover:bg-slate-50 border border-transparent`}
                        onClick={() => setActiveMenu(menu.id)}
                      >
                        <div className="flex-1 flex items-center gap-3 p-2">
                          <div className="text-slate-400 group-hover:text-sky-500 transition-colors">
                            {getIcon(menu.icon)}
                          </div>
                          <span className="text-xs uppercase tracking-wide">{menu.title} <span className="text-[10px] opacity-70">({listData.length})</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setHiddenLayers(prev => isHidden ? prev.filter(id => id !== menu.target) : [...prev, menu.target]);
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${isHidden ? 'text-slate-300 hover:text-slate-500' : 'text-sky-500 hover:bg-sky-100'}`}
                            title={isHidden ? "Hiển thị lớp này" : "Ẩn lớp này"}
                          >
                            {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-slate-200/60 p-5 bg-white/40 backdrop-blur-md shrink-0">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-3">Thống kê nhanh</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setActiveMenu('menu-vuviec')}
                    className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex flex-col items-start hover:border-sky-300 hover:shadow-md transition-all group"
                  >
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 group-hover:text-sky-600 transition-colors">Vụ việc mới</span>
                    <span className="text-xl font-black text-sky-600 leading-none group-hover:scale-110 transition-transform origin-left">{data.vuviec.length}</span>
                  </button>
                  <button 
                    onClick={() => setActiveMenu('menu-diemnong')}
                    className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex flex-col items-start hover:border-red-300 hover:shadow-md transition-all group"
                  >
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 group-hover:text-red-500 transition-colors">Điểm nóng</span>
                    <span className="text-xl font-black text-red-500 leading-none group-hover:scale-110 transition-transform origin-left">{data.diemnong.length}</span>
                  </button>
                  <button 
                    onClick={() => setActiveMenu('menu-doituong')}
                    className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex flex-col items-start hover:border-orange-300 hover:shadow-md transition-all group"
                  >
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 group-hover:text-orange-500 transition-colors">Đối tượng</span>
                    <span className="text-xl font-black text-orange-500 leading-none group-hover:scale-110 transition-transform origin-left">{data.doituong.length}</span>
                  </button>
                  <button 
                    onClick={() => setActiveMenu('menu-cskd')}
                    className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex flex-col items-start hover:border-emerald-300 hover:shadow-md transition-all group"
                  >
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 group-hover:text-emerald-600 transition-colors">Cơ sở KD</span>
                    <span className="text-xl font-black text-emerald-600 leading-none group-hover:scale-110 transition-transform origin-left">{data.cskd.length}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="list"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col h-full absolute inset-0"
            >
              <div className="p-4 border-b border-slate-200/60 flex items-center gap-3 bg-transparent z-10">
                <button 
                  onClick={() => setActiveMenu(null)}
                  className="p-1.5 bg-white/60 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors shadow-sm"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {activeMenuObj && (
                  <div className="flex-1 overflow-hidden">
                    <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider truncate">{activeMenuObj.title}</h2>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">{filteredActiveList.length} đối tượng</p>
                  </div>
                )}
                {activeMenuObj && (
                  <div className="text-sky-600 p-1 bg-sky-50 rounded">
                    {getIcon(activeMenuObj.icon)}
                  </div>
                )}
              </div>

              {activeMenu === 'menu-vuviec' && (
                <div className="px-4 py-3 border-b border-slate-100 flex flex-col gap-2 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Bộ lọc sự kiện</span>
                    <button 
                      className="p-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded transition-colors text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                      title="Nhập liệu hàng loạt (UC-INC-05)"
                      onClick={() => window.dispatchEvent(new CustomEvent('import-incidents'))}
                    >
                      Nhập Excel
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <select 
                      className="flex-1 text-xs bg-white border border-slate-200 rounded-lg p-2 outline-none focus:ring-1 focus:ring-sky-500"
                      value={timeFilter}
                      onChange={(e) => setTimeFilter(e.target.value)}
                    >
                      <option value="">Tất cả thời gian</option>
                      <option value="today">Hôm nay</option>
                      <option value="2023">Năm 2023</option>
                    </select>
                    <select 
                      className="flex-1 text-xs bg-white border border-slate-200 rounded-lg p-2 outline-none focus:ring-1 focus:ring-sky-500"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="">Mọi trạng thái</option>
                      <option value="Mới">Mới</option>
                      <option value="Đang xử lý">Đang xử lý</option>
                      <option value="Đã giải quyết">Đã giải quyết</option>
                      <option value="Báo động giả">Báo động giả</option>
                    </select>
                  </div>
                </div>
              )}

              {(activeMenu === 'menu-camera' || activeMenu === 'menu-doituong' || activeMenu === 'menu-cskd' || activeMenu === 'menu-diemnong') && (
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Hành động danh sách</span>
                  <button 
                    className="p-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded transition-colors text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                    title="Nhập liệu hàng loạt bằng Excel"
                    onClick={() => window.dispatchEvent(new CustomEvent('import-incidents'))}
                  >
                    Nhập Excel
                  </button>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {filteredActiveList.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="group flex items-center justify-between p-3 rounded-xl bg-white/70 backdrop-blur-md border border-white/60 hover:bg-white hover:border-sky-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
                    onMouseEnter={() => handleItemHover(item.id || item.label, item.category, true)}
                    onMouseLeave={() => handleItemHover(item.id || item.label, item.category, false)}
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="flex items-center gap-3 flex-1 overflow-hidden">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${(item.mucdo === 'Rất cao' || item.category === 'vuviec-list') ? 'bg-red-500' : (item.mucdo === 'Cao' || item.mucdo === 'Trung bình') ? 'bg-orange-500' : 'bg-sky-500'}`}></div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-sm text-slate-700 font-bold truncate group-hover:text-sky-700">{item.label}</span>
                        {(item.loai || item.extra || item.trangthai || item.mucdo || item.thoigian) && (
                          <div className="flex items-center gap-1.5 mt-0.5 overflow-hidden flex-wrap">
                            {item.loai && <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 font-bold uppercase truncate">{item.loai}</span>}
                            {item.mucdo && <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase truncate ${item.mucdo === 'Rất cao' ? 'bg-red-100 text-red-600' : (item.mucdo === 'Cao' || item.mucdo === 'Trung bình') ? 'bg-orange-100 text-orange-600' : 'bg-sky-100 text-sky-600'}`}>{item.mucdo}</span>}
                            {item.trangthai && <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase truncate ${item.trangthai.includes('hoạt động') || item.trangthai === 'Đã giải quyết' ? 'bg-emerald-100 text-emerald-600' : item.trangthai === 'Đang xử lý' ? 'bg-amber-100 text-amber-600' : item.trangthai === 'Mới' ? 'bg-sky-100 text-sky-600' : 'bg-rose-100 text-rose-600'}`}>{item.trangthai}</span>}
                            {item.thoigian && <span className="text-[9px] text-slate-500 font-medium whitespace-nowrap bg-slate-50 border border-slate-100 px-1 rounded">{item.thoigian}</span>}
                            {item.extra && <span className="text-[9px] text-slate-400 font-medium truncate max-w-[120px]">{item.extra}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(item.id || item.label, item.category); }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all ml-2"
                      title="Xóa đối tượng"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {filteredActiveList.length === 0 && (
                  <div className="text-center p-8 text-slate-400 text-xs">
                    Không tìm thấy dữ liệu phù hợp
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
