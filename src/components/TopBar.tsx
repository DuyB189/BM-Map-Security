import { MapPin, MapIcon, ChevronDown, Plus, X, Menu } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GISData } from "../types";

interface TopBarProps {
	isMenuOpen: boolean;
	setIsMenuOpen: (val: boolean) => void;
	isLocationMenuOpen: boolean;
	setIsLocationMenuOpen: (val: boolean) => void;
	selectedLocation: string;
	setSelectedLocation: (val: string) => void;
	data: GISData;
	flyTo: (lng: number, lat: number, zoom: number) => void;
	isAdding: boolean;
	setIsAdding: (val: boolean) => void;
	setSelectedCoords: (val: [number, number] | null) => void;
	setShowForm?: (val: boolean) => void;
}

export default function TopBar({
	isMenuOpen,
	setIsMenuOpen,
	isLocationMenuOpen,
	setIsLocationMenuOpen,
	selectedLocation,
	setSelectedLocation,
	data,
	flyTo,
	isAdding,
	setIsAdding,
	setSelectedCoords,
	setShowForm,
}: TopBarProps) {
	return (
		<>
			<button
				onClick={() => setIsMenuOpen(!isMenuOpen)}
				className={`absolute top-4 left-6 h-16 w-16 glass rounded-2xl z-[1000] flex items-center justify-center shadow-xl border border-white/40 transition-all ${isMenuOpen ? "bg-sky-50 text-sky-600 border-sky-200" : "text-slate-600 hover:bg-white"}`}>
				<Menu className="w-6 h-6" />
			</button>

			<div
				style={{ width: "640px" }}
				className="absolute top-4 left-1/2 -translate-x-1/2 h-16 glass rounded-2xl z-[1000] flex items-center justify-between px-6 shadow-xl border border-white/40">
				<div className="flex items-center gap-3">
					<div>
						<h1 className="text-base md:text-lg font-bold tracking-wider text-slate-800 uppercase leading-none">
							BẢN ĐỒ AN NINH TRẬT TỰ PHƯỜNG BÌNH MINH
						</h1>
						<p className="text-[9px] text-slate-500 uppercase tracking-widest mt-1 font-bold">
							Quản trị an ninh & trật tự
						</p>
					</div>
				</div>

				<div className="flex items-center gap-3">
					{/* <div className="relative">
            <button 
              onClick={() => setIsLocationMenuOpen(!isLocationMenuOpen)}
              className="bg-white/90 hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-sky-500/50 cursor-pointer shadow-sm min-w-[160px] flex items-center justify-between transition-colors gap-3"
            >
              <div className="flex items-center gap-2">
                {selectedLocation ? <MapPin className="w-4 h-4 text-sky-600" /> : <MapIcon className="w-4 h-4 text-slate-500" />}
                <span>{selectedLocation || 'Tất cả'}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isLocationMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isLocationMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-[2000]"
                >
                  <div className="max-h-64 overflow-y-auto custom-scrollbar flex flex-col p-1">
                    <button 
                      className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold text-left transition-colors ${!selectedLocation ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:bg-slate-50'}`}
                      onClick={() => {
                        setSelectedLocation('');
                        setIsLocationMenuOpen(false);
                        flyTo(106.132, 11.305, 12);
                      }}
                    >
                      <MapIcon className="w-4 h-4 shrink-0" /> Tất cả
                    </button>
                    <div className="h-px bg-slate-100 my-1 mx-2"></div>
                    {data.xaphuong.map(x => (
                      <button 
                        key={x.ten_xa}
                        className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold text-left transition-colors ${selectedLocation === x.ten_xa ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:bg-slate-50'}`}
                        onClick={() => {
                          setSelectedLocation(x.ten_xa);
                          setIsLocationMenuOpen(false);
                          flyTo(x.lng, x.lat, 14);
                        }}
                      >
                        <MapPin className="w-4 h-4 shrink-0" /> {x.ten_xa}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div> */}

					<button
						onClick={() => {
							setIsAdding(!isAdding);
							setSelectedCoords(null);
						}}
						className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all border ${
							isAdding
								? "bg-red-500 border-red-500 text-white animate-pulse shadow-red-200"
								: "bg-sky-600 border-sky-600 hover:bg-sky-700 hover:border-sky-700 text-white shadow-sky-100"
						}`}>
						{isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
						<span className="hidden sm:inline">
							{isAdding ? "Hủy thêm" : "Thêm vị trí"}
						</span>
					</button>
				</div>
			</div>

			{/* Adding instruction */}
			<AnimatePresence>
				{isAdding && (
					<motion.div
						initial={{ y: -20, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						exit={{ y: -20, opacity: 0 }}
						className="absolute top-24 left-1/2 -translate-x-1/2 z-[1000] bg-white px-6 py-4 rounded-2xl shadow-2xl text-slate-800 text-sm font-bold flex flex-col sm:flex-row items-center gap-3 border border-sky-400 border-dashed">
						<div className="flex items-center gap-3">
							<div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center animate-bounce shrink-0">
								<MapIcon className="w-5 h-5" />
							</div>
							<span className="whitespace-nowrap">Nhấn vào bất kỳ điểm nào trên bản đồ để đặt ghim mới</span>
						</div>
						{setShowForm && (
							<>
								<div className="hidden sm:block h-6 w-px bg-slate-200" />
								<button
									onClick={() => {
										setSelectedCoords([106.1183077, 11.3387817]);
										setShowForm(true);
										setIsAdding(false);
									}}
									className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap"
								>
									Nhập tọa độ thủ công
								</button>
							</>
						)}
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
}
