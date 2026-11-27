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
	Users,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getRoleDisplayName, UserRole } from "../utils/authService";

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
	onOpenUserManagement: () => void;
	onReloadApp: () => void;
	onLogout: () => void;
	activeUsername?: string;
	activeUserRole?: UserRole;
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
	onOpenUserManagement,
	onReloadApp,
	onLogout,
	activeUsername = "Quản trị viên",
	activeUserRole = "owner",
}: TopBarProps) {
	const canManageUsers = activeUserRole === "owner" || activeUserRole === "admin";
	const settingsRef = useRef<HTMLDivElement>(null);

	// Đóng modal Hệ thống bằng phím ESC
	useEffect(() => {
		if (!showSettings) return;
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") setShowSettings(false);
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
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
						<div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 hidden md:flex items-center justify-center shadow-xs shrink-0 overflow-hidden p-0.5">
							<img
								src="./app-icon.png"
								alt="Logo Bản đồ ANTT"
								onError={(e) => {
									(e.currentTarget as HTMLImageElement).src = "./logo.png";
								}}
								className="w-full h-full object-contain rounded-lg"
							/>
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

					{/* 4. Nút mở Bảng điều khiển Hệ thống & Tài khoản */}
					<div ref={settingsRef} className="relative">
						<button
							type="button"
							onClick={() => setShowSettings(!showSettings)}
							className={`h-10 px-3.5 rounded-xl text-[13px] font-bold flex items-center gap-2 border transition-all cursor-pointer ${
								showSettings
									? "bg-slate-900 text-white border-slate-900 shadow-sm"
									: "bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 border-slate-200"
							}`}
							title="Mở bảng chức năng hệ thống, tài khoản, sao lưu và bản đồ nền">
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
					</div>
				</div>
			</header>

			{/* MODAL DẠNG BẢNG Ô CHỨC NĂNG HỆ THỐNG GIỮA MÀN HÌNH */}
			<AnimatePresence>
				{showSettings && (
					<div
						onClick={() => setShowSettings(false)}
						className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm z-[2100] flex items-center justify-center p-4 sm:p-6">
						<motion.div
							initial={{ opacity: 0, scale: 0.95, y: 12 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: 12 }}
							transition={{ duration: 0.18 }}
							onClick={(e) => e.stopPropagation()}
							className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
							{/* Header Modal */}
							<div className="px-6 py-4 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between gap-4">
								<div className="flex items-center gap-3 min-w-0">
									<div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center overflow-hidden p-1 shrink-0">
										<img
											src="./app-icon.png"
											alt="Logo"
											onError={(e) => {
												(e.currentTarget as HTMLImageElement).src = "./logo.png";
											}}
											className="w-full h-full object-contain rounded-xl"
										/>
									</div>
									<div className="min-w-0">
										<div className="flex items-center gap-2 flex-wrap">
											<h2 className="text-sm sm:text-base font-extrabold text-slate-800 uppercase tracking-wide">
												Quản trị &amp; Tiện ích Hệ thống
											</h2>
											<span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-700 text-[10px] font-extrabold uppercase">
												{getRoleDisplayName(activeUserRole)}
											</span>
										</div>
										<p className="text-xs text-slate-500 font-semibold mt-0.5 truncate">
											Đang đăng nhập:{" "}
											<span className="font-mono font-bold text-slate-800">
												{activeUsername}
											</span>
										</p>
									</div>
								</div>

								<button
									type="button"
									onClick={() => setShowSettings(false)}
									className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
									title="Đóng (ESC)">
									<X className="w-5 h-5" />
								</button>
							</div>

							{/* Lưới bảng các ô chức năng */}
							<div className="p-6 overflow-y-auto custom-scrollbar bg-slate-50/40">
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
									{canManageUsers && (
										<>
											<button
												type="button"
												onClick={() => {
													setShowSettings(false);
													onOpenUserManagement();
												}}
												className="group bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-2xl p-4 text-left flex flex-col justify-between gap-3 shadow-xs hover:shadow-md transition-all cursor-pointer">
												<div className="flex items-start justify-between gap-2">
													<div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
														<Users className="w-5 h-5" />
													</div>
													<ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
												</div>
												<div>
													<div className="text-[13px] font-extrabold text-slate-800 group-hover:text-blue-700 leading-snug">
														Quản lý tài khoản người dùng
													</div>
													<div className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">
														Tạo tài khoản, phân vai trò &amp; giới hạn danh mục cho cán bộ
													</div>
												</div>
											</button>

											<button
												type="button"
												onClick={() => {
													setShowSettings(false);
													onOpenBackupRestore();
												}}
												className="group bg-white hover:bg-teal-50/50 border border-slate-200 hover:border-teal-300 rounded-2xl p-4 text-left flex flex-col justify-between gap-3 shadow-xs hover:shadow-md transition-all cursor-pointer">
												<div className="flex items-start justify-between gap-2">
													<div className="w-11 h-11 rounded-2xl bg-teal-100 text-teal-700 group-hover:bg-teal-600 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
														<HardDriveDownload className="w-5 h-5" />
													</div>
													<ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
												</div>
												<div>
													<div className="text-[13px] font-extrabold text-slate-800 group-hover:text-teal-700 leading-snug">
														Sao lưu &amp; Chuyển máy
													</div>
													<div className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">
														Lưu dự phòng mã hóa ra USB hoặc khôi phục sang máy mới
													</div>
												</div>
											</button>

											<button
												type="button"
												onClick={() => {
													setShowSettings(false);
													onOpenOfflineMap();
												}}
												className="group bg-white hover:bg-sky-50/50 border border-slate-200 hover:border-sky-300 rounded-2xl p-4 text-left flex flex-col justify-between gap-3 shadow-xs hover:shadow-md transition-all cursor-pointer">
												<div className="flex items-start justify-between gap-2">
													<div className="w-11 h-11 rounded-2xl bg-sky-100 text-sky-600 group-hover:bg-sky-600 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
														<Database className="w-5 h-5" />
													</div>
													<ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
												</div>
												<div>
													<div className="text-[13px] font-extrabold text-slate-800 group-hover:text-sky-700 leading-snug">
														Bản đồ nền ngoại tuyến
													</div>
													<div className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">
														Kiểm tra trạng thái &amp; cập nhật tệp bản đồ địa bàn (.mbtiles)
													</div>
												</div>
											</button>
										</>
									)}

									<button
										type="button"
										onClick={() => {
											setShowSettings(false);
											onOpenSystemHistory();
										}}
										className="group bg-white hover:bg-amber-50/50 border border-slate-200 hover:border-amber-300 rounded-2xl p-4 text-left flex flex-col justify-between gap-3 shadow-xs hover:shadow-md transition-all cursor-pointer">
										<div className="flex items-start justify-between gap-2">
											<div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-600 group-hover:bg-amber-600 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
												<History className="w-5 h-5" />
											</div>
											<ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
										</div>
										<div>
											<div className="text-[13px] font-extrabold text-slate-800 group-hover:text-amber-700 leading-snug">
												Lịch sử hoạt động hệ thống
											</div>
											<div className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">
												Theo dõi nhật ký đăng nhập &amp; toàn bộ thao tác Thêm/Sửa/Xóa
											</div>
										</div>
									</button>

									<button
										type="button"
										onClick={() => {
											setShowSettings(false);
											onOpenChangePassword();
										}}
										className="group bg-white hover:bg-cyan-50/50 border border-slate-200 hover:border-cyan-300 rounded-2xl p-4 text-left flex flex-col justify-between gap-3 shadow-xs hover:shadow-md transition-all cursor-pointer">
										<div className="flex items-start justify-between gap-2">
											<div className="w-11 h-11 rounded-2xl bg-cyan-100 text-cyan-700 group-hover:bg-cyan-600 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
												<KeyRound className="w-5 h-5" />
											</div>
											<ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-cyan-600 group-hover:translate-x-0.5 transition-all" />
										</div>
										<div>
											<div className="text-[13px] font-extrabold text-slate-800 group-hover:text-cyan-700 leading-snug">
												Bảo mật &amp; Đổi mật khẩu
											</div>
											<div className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">
												Thay đổi mật khẩu đăng nhập &amp; tạo lại Mã Chủ Quản
											</div>
										</div>
									</button>

									<button
										type="button"
										onClick={() => {
											setShowSettings(false);
											onReloadApp();
										}}
										className="group bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 rounded-2xl p-4 text-left flex flex-col justify-between gap-3 shadow-xs hover:shadow-md transition-all cursor-pointer">
										<div className="flex items-start justify-between gap-2">
											<div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
												<RefreshCw className="w-5 h-5" />
											</div>
											<ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
										</div>
										<div>
											<div className="text-[13px] font-extrabold text-slate-800 group-hover:text-emerald-700 leading-snug">
												Làm mới bản đồ
											</div>
											<div className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">
												Tải lại toàn bộ giao diện, lớp ghim &amp; bộ nhớ hiển thị
											</div>
										</div>
									</button>
								</div>
							</div>

							{/* Footer Modal: Đăng xuất */}
							<div className="px-6 py-4 bg-white border-t border-slate-200/80 flex items-center justify-between gap-3">
								<span className="text-[11px] font-semibold text-slate-400">
									Hệ thống Bản đồ An ninh Trật tự • Vận hành ngoại tuyến nội bộ
								</span>
								<button
									type="button"
									onClick={() => {
										setShowSettings(false);
										onLogout();
									}}
									className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 text-xs font-bold transition-all cursor-pointer shrink-0">
									<LogOut className="w-4 h-4" />
									<span>Đăng xuất khỏi hệ thống</span>
								</button>
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>

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
										setSelectedCoords(null);
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
