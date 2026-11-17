import { MapPin, MapIcon, ChevronDown, Plus, X, Menu, Table2 } from "lucide-react";
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
	onOpenCatalog?: () => void;
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
	onOpenCatalog,
}: TopBarProps) {
	return (
		<>
			<button
				onClick={() => setIsMenuOpen(!isMenuOpen)}
				className={`absolute top-4 left-6 h-16 w-16 glass rounded-2xl z-[1000] flex items-center justify-center shadow-xl border border-white/40 transition-all ${isMenuOpen ? "bg-sky-50 text-sky-600 border-sky-200" : "text-slate-600 hover:bg-white"}`}>
				<Menu className="w-6 h-6" />
			</button>

			<div
				style={{ width: "690px", maxWidth: "calc(100vw - 380px)" }}
				className="absolute top-4 left-1/2 -translate-x-1/2 h-16 glass rounded-2xl z-[1000] flex items-center justify-between px-6 shadow-xl border border-white/40 gap-3">
				<div className="flex items-center gap-3 min-w-0">
					<div className="min-w-0">
						<h1 className="text-sm md:text-base font-bold tracking-wider text-slate-800 uppercase leading-none truncate">
							BẢN ĐỒ AN NINH TRẬT TỰ PHƯỜNG BÌNH MINH
						</h1>
						<p className="text-[9px] text-slate-500 uppercase tracking-widest mt-1 font-bold truncate">
							Quản trị an ninh & trật tự
						</p>
					</div>
				</div>

				<div className="flex items-center gap-2 shrink-0">
					{onOpenCatalog && (
						<button
							type="button"
							onClick={onOpenCatalog}
							className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white/90 hover:bg-slate-900 text-slate-700 hover:text-white border border-slate-200 hover:border-slate-900 shadow-xs transition-all cursor-pointer"
							title="Mở Bảng quản lý danh mục & dữ liệu lớn (Ctrl+K)">
							<Table2 className="w-4 h-4 shrink-0" />
							<span className="hidden lg:inline">Bảng dữ liệu</span>
						</button>
					)}

					<button
						onClick={() => {
							setIsAdding(!isAdding);
							setSelectedCoords(null);
						}}
						className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all border cursor-pointer ${
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
