import { useEffect, useRef } from "react";
import {
	MapIcon,
	Plus,
	X,
	Table2,
	BarChart3,
	Settings,
	ChevronDown,
	ChevronRight,
	Database,
	History,
	KeyRound,
	RefreshCw,
	LogOut,
	PanelLeftClose,
	PanelLeftOpen,
	ShieldCheck,
	HardDriveDownload,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface TopBarProps {
	isMenuOpen: boolean;
	setIsMenuOpen: (val: boolean) => void;
	isAdding: boolean;
	setIsAdding: (val: boolean) => void;
	setSelectedCoords: (val: [number, number] | null) => void;
	setShowForm?: (val: boolean) => void;
	totalRecordsCount?: number;
	onOpenCatalog: () => void;
	onOpenStats: () => void;
	showSettings: boolean;
	setShowSettings: (val: boolean) => void;
	isUpdatingMap?: boolean;
	onOpenBackupRestore: () => void;
	onOpenOfflineMap: () => void;
	onOpenSystemHistory: () => void;
	onOpenChangePassword: () => void;
	onReloadApp: () => void;
	onLogout: () => void;
	activeUsername?: string;
}

export default function TopBar({
	isMenuOpen,
	setIsMenuOpen,
	isAdding,
	setIsAdding,
	setSelectedCoords,
	setShowForm,
	totalRecordsCount = 0,
	onOpenCatalog,
	onOpenStats,
	showSettings,
	setShowSettings,
	isUpdatingMap = false,
	onOpenBackupRestore,
	onOpenOfflineMap,
	onOpenSystemHistory,
	onOpenChangePassword,
	onReloadApp,
	onLogout,
	activeUsername = "Quản trị viên",
}: TopBarProps) {
	const settingsRef = useRef<HTMLDivElement>(null);

	// Tự động đóng menu Hệ thống khi bấm ra ngoài
	useEffect(() => {
		if (!showSettings) return;
		const onClickOutside = (e: MouseEvent) => {
			if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
				setShowSettings(false);
			}
		};
		document.addEventListener("mousedown", onClickOutside);
		return () => document.removeEventListener("mousedown", onClickOutside);
	}, [showSettings, setShowSettings]);

	return (
		<>
			{/* THANH ĐIỀU KHIỂN CHÍNH ĐỒNG BỘ TRÊN CÙNG */}
			<header className="absolute top-3 left-4 right-4 h-16 bg-white/95 backdrop-blur-xl rounded-2xl z-[1000] flex items-center justify-between px-3.5 sm:px-5 shadow-lg border border-slate-200/90 select-none gap-3">
				{/* Cụm Trái: Nút Ẩn/Hiện Danh Mục + Quốc huy/Biểu trưng + Tên Hệ Thống */}
				<div className="flex items-center gap-3 min-w-0">
					<button
						type="button"
						onClick={() => setIsMenuOpen(!isMenuOpen)}
						className={`h-10 px-3 rounded-xl flex items-center gap-2 text-[13px] font-bold border transition-all cursor-pointer shrink-0 ${
							isMenuOpen
								? "bg-sky-50 text-sky-700 border-sky-200 shadow-2xs"
								: "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
						}`}
						title={
							isMenuOpen
								? "Thu gọn bảng danh mục bên trái để mở rộng bản đồ"
								: "Mở bảng danh mục lớp bản đồ bên trái"
						}>
						{isMenuOpen ? (
							<PanelLeftClose className="w-4 h-4 shrink-0" />
						) : (
							<PanelLeftOpen className="w-4 h-4 shrink-0" />
						)}
						<span className="hidden sm:inline">Danh mục</span>
					</button>

					<div className="h-7 w-px bg-slate-200 hidden md:block shrink-0" />

					<div className="flex items-center gap-2.5 min-w-0">
						<div className="w-10 h-10 rounded-xl bg-sky-600 text-white hidden md:flex items-center justify-center shadow-xs shrink-0">
							<ShieldCheck className="w-5 h-5" />
						</div>
						<div className="min-w-0">
							<h1 className="text-sm lg:text-[15px] font-extrabold tracking-tight text-slate-800 uppercase leading-tight truncate">
								BẢN ĐỒ AN NINH TRẬT TỰ — PHƯỜNG BÌNH MINH
							</h1>
							<div className="flex items-center gap-1.5 mt-0.5">
								<span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
								<p className="text-[11px] text-slate-500 font-semibold truncate">
									Hệ thống Quản trị Địa bàn • Tỉnh Tây Ninh
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Cụm Phải: Các chức năng nghiệp vụ chính có nhãn Tiếng Việt rõ ràng */}
				<div className="flex items-center gap-2 shrink-0">
					{/* 1. Thêm điểm mới */}
					<button
						type="button"
						onClick={() => {
							setIsAdding(!isAdding);
							setSelectedCoords(null);
						}}
						className={`h-10 px-3.5 sm:px-4 rounded-xl text-[13px] font-bold flex items-center gap-2 border transition-all cursor-pointer ${
							isAdding
								? "bg-rose-600 hover:bg-rose-700 border-rose-600 text-white shadow-sm"
								: "bg-sky-600 hover:bg-sky-700 border-sky-600 text-white shadow-sm shadow-sky-200"
						}`}
						title="Đặt thêm điểm vụ việc, camera, đối tượng, cơ sở mới lên bản đồ">
						{isAdding ? (
							<X className="w-4 h-4 shrink-0" />
						) : (
							<Plus className="w-4 h-4 shrink-0" />
						)}
						<span>{isAdding ? "Hủy thêm điểm" : "Thêm điểm mới"}</span>
					</button>

					{/* 2. Bảng dữ liệu lớn */}
					<button
						type="button"
						onClick={onOpenCatalog}
						className="h-10 px-3.5 rounded-xl text-[13px] font-bold bg-white hover:bg-slate-50 text-slate-700 hover:text-sky-700 border border-slate-200 hover:border-sky-300 flex items-center gap-2 transition-all cursor-pointer"
						title="Mở bảng danh sách dữ liệu lớn của toàn bộ 7 danh mục (Phím tắt: Ctrl + K)">
						<Table2 className="w-4 h-4 text-sky-600 shrink-0" />
						<span className="hidden md:inline">Bảng dữ liệu</span>
					</button>

					{/* 3. Báo cáo thống kê */}
					<button
						type="button"
						onClick={onOpenStats}
						className="h-10 px-3.5 rounded-xl text-[13px] font-bold bg-white hover:bg-slate-50 text-slate-700 hover:text-sky-700 border border-slate-200 hover:border-sky-300 flex items-center gap-2 transition-all cursor-pointer"
						title="Xem biểu đồ và số liệu thống kê an ninh trật tự theo tháng, quý, năm">
						<BarChart3 className="w-4 h-4 text-emerald-600 shrink-0" />
						<span className="hidden lg:inline">Báo cáo thống kê</span>
					</button>

					<div className="h-7 w-px bg-slate-200 mx-0.5 hidden sm:block" />

					{/* 4. Menu Hệ thống & Tài khoản */}
					<div ref={settingsRef} className="relative">
						<button
							type="button"
							onClick={() => setShowSettings(!showSettings)}
							className={`h-10 px-3.5 rounded-xl text-[13px] font-bold flex items-center gap-2 border transition-all cursor-pointer ${
								showSettings
									? "bg-slate-900 text-white border-slate-900 shadow-sm"
									: "bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 border-slate-200"
							}`}
							title="Cài đặt bản đồ, lịch sử hệ thống, mật khẩu và đăng xuất">
							<Settings
								className={`w-4 h-4 shrink-0 ${isUpdatingMap ? "animate-spin" : ""}`}
							/>
							<span className="hidden xl:inline">Hệ thống</span>
							<ChevronDown
								className={`w-3.5 h-3.5 transition-transform ${
									showSettings ? "rotate-180" : ""
								}`}
							/>
						</button>

						<AnimatePresence>
							{showSettings && (
								<motion.div
									initial={{ opacity: 0, y: 8, scale: 0.97 }}
									animate={{ opacity: 1, y: 0, scale: 1 }}
									exit={{ opacity: 0, y: 8, scale: 0.97 }}
									transition={{ duration: 0.15 }}
									className="absolute right-0 top-full mt-2.5 w-80 bg-white/98 backdrop-blur-xl p-2.5 rounded-2xl z-[1200] shadow-2xl border border-slate-200 space-y-1">
									<div className="px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-100 mb-1.5">
										<div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
											Đang đăng nhập
										</div>
										<div className="text-[13px] font-extrabold text-slate-800 mt-0.5 truncate">
											Tài khoản: {activeUsername}
										</div>
									</div>

									<button
										type="button"
										onClick={() => {
											setShowSettings(false);
											onOpenBackupRestore();
										}}
										className="w-full flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-teal-50 text-left transition-colors group cursor-pointer">
										<div className="flex items-center gap-3 min-w-0">
											<div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 group-hover:bg-teal-600 group-hover:text-white transition-colors">
												<HardDriveDownload className="w-4 h-4" />
											</div>
											<div className="min-w-0">
												<div className="text-[13px] font-bold text-slate-800 group-hover:text-teal-700 truncate">
													Sao lưu & Chuyển sang máy khác
												</div>
												<div className="text-[11px] text-slate-500 truncate">
													Lưu dự phòng ra USB hoặc chuyển sang máy mới
												</div>
											</div>
										</div>
										<ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 shrink-0" />
									</button>

									<button
										type="button"
										onClick={() => {
											setShowSettings(false);
											onOpenOfflineMap();
										}}
										className="w-full flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-sky-50 text-left transition-colors group cursor-pointer">
										<div className="flex items-center gap-3 min-w-0">
											<div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0 group-hover:bg-sky-600 group-hover:text-white transition-colors">
												<Database className="w-4 h-4" />
											</div>
											<div className="min-w-0">
												<div className="text-[13px] font-bold text-slate-800 group-hover:text-sky-700 truncate">
													Bản đồ nền ngoại tuyến
												</div>
												<div className="text-[11px] text-slate-500 truncate">
													Kiểm tra & cập nhật dữ liệu bản đồ địa bàn
												</div>
											</div>
										</div>
										<ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 shrink-0" />
									</button>

									<button
										type="button"
										onClick={() => {
											setShowSettings(false);
											onOpenSystemHistory();
										}}
										className="w-full flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-amber-50 text-left transition-colors group cursor-pointer">
										<div className="flex items-center gap-3 min-w-0">
											<div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
												<History className="w-4 h-4" />
											</div>
											<div className="min-w-0">
												<div className="text-[13px] font-bold text-slate-800 group-hover:text-amber-700 truncate">
													Lịch sử hoạt động hệ thống
												</div>
												<div className="text-[11px] text-slate-500 truncate">
													Nhật ký đăng nhập & thêm/sửa/xóa
												</div>
											</div>
										</div>
										<ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 shrink-0" />
									</button>

									<button
										type="button"
										onClick={() => {
											setShowSettings(false);
											onOpenChangePassword();
										}}
										className="w-full flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-indigo-50 text-left transition-colors group cursor-pointer">
										<div className="flex items-center gap-3 min-w-0">
											<div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
												<KeyRound className="w-4 h-4" />
											</div>
											<div className="min-w-0">
												<div className="text-[13px] font-bold text-slate-800 group-hover:text-indigo-700 truncate">
													Bảo mật & Đổi mật khẩu
												</div>
												<div className="text-[11px] text-slate-500 truncate">
													Đổi mật khẩu & tạo lại Mã Chủ Quản
												</div>
											</div>
										</div>
										<ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0" />
									</button>

									<button
										type="button"
										onClick={() => {
											setShowSettings(false);
											onReloadApp();
										}}
										className="w-full flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-emerald-50 text-left transition-colors group cursor-pointer">
										<div className="flex items-center gap-3 min-w-0">
											<div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
												<RefreshCw className="w-4 h-4" />
											</div>
											<div className="min-w-0">
												<div className="text-[13px] font-bold text-slate-800 group-hover:text-emerald-700 truncate">
													Làm mới bản đồ
												</div>
												<div className="text-[11px] text-slate-500 truncate">
													Tải lại toàn bộ giao diện & lớp ghim
												</div>
											</div>
										</div>
										<ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0" />
									</button>

									<div className="h-px bg-slate-100 my-1" />

									<button
										type="button"
										onClick={() => {
											setShowSettings(false);
											onLogout();
										}}
										className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-rose-50 text-rose-600 text-left transition-colors group cursor-pointer">
										<div className="w-9 h-9 rounded-xl bg-rose-50 group-hover:bg-rose-600 text-rose-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
											<LogOut className="w-4 h-4" />
										</div>
										<div className="min-w-0">
											<div className="text-[13px] font-bold">
												Đăng xuất khỏi hệ thống
											</div>
											<div className="text-[11px] text-rose-400">
												Khóa phiên làm việc hiện tại
											</div>
										</div>
									</button>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				</div>
			</header>

			{/* THANH HƯỚNG DẪN RÕ RÀNG KHI ĐANG Ở CHẾ ĐỘ THÊM ĐIỂM MỚI */}
			<AnimatePresence>
				{isAdding && (
					<motion.div
						initial={{ y: -16, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						exit={{ y: -16, opacity: 0 }}
						className="absolute top-[86px] left-1/2 -translate-x-1/2 z-[1000] bg-white px-5 py-3.5 rounded-2xl shadow-2xl text-slate-800 text-[13px] font-bold flex flex-wrap items-center gap-3 border-2 border-sky-500">
						<div className="flex items-center gap-2.5">
							<div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
								<MapIcon className="w-4 h-4" />
							</div>
							<span>Nhấp chuột vào vị trí cần đánh dấu trên bản đồ để thêm mới</span>
						</div>
						{setShowForm && (
							<>
								<div className="hidden sm:block h-5 w-px bg-slate-200" />
								<button
									type="button"
									onClick={() => {
										setSelectedCoords([106.1183077, 11.3387817]);
										setShowForm(true);
										setIsAdding(false);
									}}
									className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer">
									Nhập tọa độ bằng số
								</button>
							</>
						)}
						<button
							type="button"
							onClick={() => setIsAdding(false)}
							className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer">
							Đóng
						</button>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
}
