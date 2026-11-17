import { useEffect, useMemo, useState } from "react";
import {
	X,
	History,
	Search,
	RefreshCw,
	CheckCircle2,
	AlertTriangle,
	ShieldAlert,
	KeyRound,
	LogOut,
	Database,
	Clock,
	User,
	PlusCircle,
	Pencil,
	Trash2,
	Eye,
	FileSpreadsheet,
	Download,
	SlidersHorizontal,
	RotateCcw,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
	authService,
	CATEGORY_LABELS,
	getCategoryDisplayName,
	SystemAuditLog,
} from "../utils/authService";

interface SystemHistoryModalProps {
	show: boolean;
	onClose: () => void;
}

type LogFilterCategory =
	| "all"
	| "crud"
	| "excel"
	| "auth_session"
	| "security_alerts"
	| "system";

const formatFullTimestamp = (iso: string): string => {
	if (!iso) return "";
	try {
		const d = new Date(iso);
		if (isNaN(d.getTime())) return iso;
		const hh = String(d.getHours()).padStart(2, "0");
		const mm = String(d.getMinutes()).padStart(2, "0");
		const ss = String(d.getSeconds()).padStart(2, "0");
		const dd = String(d.getDate()).padStart(2, "0");
		const mo = String(d.getMonth() + 1).padStart(2, "0");
		const yyyy = d.getFullYear();
		return `${hh}:${mm}:${ss} - ${dd}/${mo}/${yyyy}`;
	} catch {
		return iso;
	}
};

const getEventMeta = (eventType: SystemAuditLog["eventType"]) => {
	switch (eventType) {
		case "DATA_CREATED":
			return {
				label: "Thêm mới dữ liệu",
				badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
				iconBg: "bg-emerald-50 text-emerald-600",
				icon: <PlusCircle className="w-4 h-4" />,
			};
		case "DATA_UPDATED":
			return {
				label: "Cập nhật dữ liệu",
				badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
				iconBg: "bg-sky-50 text-sky-600",
				icon: <Pencil className="w-4 h-4" />,
			};
		case "DATA_DELETED":
			return {
				label: "Xóa dữ liệu",
				badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
				iconBg: "bg-rose-50 text-rose-600",
				icon: <Trash2 className="w-4 h-4" />,
			};
		case "DATA_VIEWED":
			return {
				label: "Xem hồ sơ",
				badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
				iconBg: "bg-slate-100 text-slate-600",
				icon: <Eye className="w-4 h-4" />,
			};
		case "DATA_IMPORTED":
			return {
				label: "Nhập Excel hàng loạt",
				badgeClass: "bg-teal-50 text-teal-700 border-teal-200",
				iconBg: "bg-teal-50 text-teal-600",
				icon: <FileSpreadsheet className="w-4 h-4" />,
			};
		case "TEMPLATE_DOWNLOADED":
			return {
				label: "Tải file Excel mẫu",
				badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-200",
				iconBg: "bg-cyan-50 text-cyan-600",
				icon: <Download className="w-4 h-4" />,
			};
		case "DB_RESET":
			return {
				label: "Khôi phục CSDL gốc",
				badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
				iconBg: "bg-rose-100 text-rose-700",
				icon: <RotateCcw className="w-4 h-4" />,
			};
		case "SYSTEM_ACTION":
			return {
				label: "Thao tác hệ thống",
				badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
				iconBg: "bg-slate-100 text-slate-600",
				icon: <SlidersHorizontal className="w-4 h-4" />,
			};
		case "LOGIN_SUCCESS":
			return {
				label: "Đăng nhập thành công",
				badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
				iconBg: "bg-emerald-50 text-emerald-600",
				icon: <CheckCircle2 className="w-4 h-4" />,
			};
		case "LOGIN_FAILED":
			return {
				label: "Đăng nhập thất bại",
				badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
				iconBg: "bg-amber-50 text-amber-600",
				icon: <AlertTriangle className="w-4 h-4" />,
			};
		case "ACCOUNT_LOCKED":
			return {
				label: "Khóa hệ thống (5 lần sai)",
				badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
				iconBg: "bg-rose-50 text-rose-600",
				icon: <ShieldAlert className="w-4 h-4" />,
			};
		case "UNLOCK_SUCCESS":
			return {
				label: "Mở khóa tài khoản",
				badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
				iconBg: "bg-sky-50 text-sky-600",
				icon: <KeyRound className="w-4 h-4" />,
			};
		case "UNLOCK_FAILED":
			return {
				label: "Sai Mã Mở Khóa",
				badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
				iconBg: "bg-rose-50 text-rose-600",
				icon: <ShieldAlert className="w-4 h-4" />,
			};
		case "PASSWORD_CHANGED":
			return {
				label: "Đổi mật khẩu",
				badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
				iconBg: "bg-indigo-50 text-indigo-600",
				icon: <KeyRound className="w-4 h-4" />,
			};
		case "RECOVERY_KEY_ROTATED":
			return {
				label: "Cấp mới Mã Chủ Quản",
				badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
				iconBg: "bg-purple-50 text-purple-600",
				icon: <KeyRound className="w-4 h-4" />,
			};
		case "INIT_ACCOUNT":
			return {
				label: "Khởi tạo tài khoản",
				badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
				iconBg: "bg-sky-50 text-sky-600",
				icon: <User className="w-4 h-4" />,
			};
		case "LOGOUT":
			return {
				label: "Đăng xuất",
				badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
				iconBg: "bg-slate-100 text-slate-600",
				icon: <LogOut className="w-4 h-4" />,
			};
		case "MAP_UPDATED":
			return {
				label: "Cập nhật bản đồ nền",
				badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-200",
				iconBg: "bg-cyan-50 text-cyan-600",
				icon: <Database className="w-4 h-4" />,
			};
		default:
			return {
				label: "Sự kiện hệ thống",
				badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
				iconBg: "bg-slate-100 text-slate-600",
				icon: <History className="w-4 h-4" />,
			};
	}
};

export default function SystemHistoryModal({ show, onClose }: SystemHistoryModalProps) {
	const [logs, setLogs] = useState<SystemAuditLog[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [filter, setFilter] = useState<LogFilterCategory>("all");
	const [categoryFilter, setCategoryFilter] = useState<string>("all");
	const [searchQuery, setSearchQuery] = useState("");

	const loadLogs = async () => {
		setIsLoading(true);
		try {
			const res = await authService.getLogs();
			setLogs(res.logs || []);
		} catch (err) {
			console.error("Failed to fetch system logs:", err);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (show) {
			loadLogs();
		}
	}, [show]);

	const stats = useMemo(() => {
		const crudTypes = new Set([
			"DATA_CREATED",
			"DATA_UPDATED",
			"DATA_DELETED",
			"DATA_IMPORTED",
			"DB_RESET",
		]);
		return {
			total: logs.length,
			crudCount: logs.filter((l) => crudTypes.has(l.eventType)).length,
			loginSuccess: logs.filter((l) => l.eventType === "LOGIN_SUCCESS").length,
			securityAlerts: logs.filter(
				(l) =>
					l.eventType === "LOGIN_FAILED" ||
					l.eventType === "UNLOCK_FAILED" ||
					l.eventType === "ACCOUNT_LOCKED",
			).length,
		};
	}, [logs]);

	const filteredLogs = useMemo(() => {
		return logs.filter((log) => {
			if (
				filter === "crud" &&
				log.eventType !== "DATA_CREATED" &&
				log.eventType !== "DATA_UPDATED" &&
				log.eventType !== "DATA_DELETED" &&
				log.eventType !== "DATA_VIEWED"
			) {
				return false;
			}
			if (
				filter === "excel" &&
				log.eventType !== "DATA_IMPORTED" &&
				log.eventType !== "TEMPLATE_DOWNLOADED"
			) {
				return false;
			}
			if (
				filter === "auth_session" &&
				log.eventType !== "LOGIN_SUCCESS" &&
				log.eventType !== "LOGOUT" &&
				log.eventType !== "INIT_ACCOUNT" &&
				log.eventType !== "UNLOCK_SUCCESS" &&
				log.eventType !== "PASSWORD_CHANGED" &&
				log.eventType !== "RECOVERY_KEY_ROTATED"
			) {
				return false;
			}
			if (
				filter === "security_alerts" &&
				log.eventType !== "LOGIN_FAILED" &&
				log.eventType !== "ACCOUNT_LOCKED" &&
				log.eventType !== "UNLOCK_FAILED"
			) {
				return false;
			}
			if (
				filter === "system" &&
				log.eventType !== "SYSTEM_ACTION" &&
				log.eventType !== "MAP_UPDATED" &&
				log.eventType !== "DB_RESET"
			) {
				return false;
			}

			if (categoryFilter !== "all" && log.category !== categoryFilter) {
				return false;
			}

			if (searchQuery.trim()) {
				const q = searchQuery.toLowerCase();
				const meta = getEventMeta(log.eventType);
				const catName = log.category ? getCategoryDisplayName(log.category) : "";
				return (
					log.message.toLowerCase().includes(q) ||
					log.username.toLowerCase().includes(q) ||
					meta.label.toLowerCase().includes(q) ||
					catName.toLowerCase().includes(q) ||
					(log.targetName || "").toLowerCase().includes(q) ||
					formatFullTimestamp(log.timestamp).toLowerCase().includes(q)
				);
			}
			return true;
		});
	}, [logs, filter, categoryFilter, searchQuery]);

	return (
		<AnimatePresence>
			{show && (
				<div className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm z-[2200] flex items-center justify-center p-4 md:p-8">
					<motion.div
						initial={{ opacity: 0, scale: 0.96, y: 10 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.96, y: 10 }}
						transition={{ duration: 0.2 }}
						className="bg-white rounded-3xl w-full max-w-6xl h-[88vh] shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
						{/* Header */}
						<div className="px-6 py-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
							<div className="flex items-center gap-3.5">
								<div className="w-11 h-11 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-200">
									<History className="w-5 h-5" />
								</div>
								<div>
									<h2 className="text-base font-extrabold text-slate-800 uppercase tracking-wide">
										Lịch sử Hệ thống & Nhật ký Thao tác Nghiệp vụ
									</h2>
									<p className="text-[11px] font-semibold text-slate-500 mt-0.5">
										Lưu vết đầy đủ lịch sử đăng nhập, cảnh báo sai mật khẩu và toàn bộ thao tác Thêm / Sửa / Xóa / Nhập Excel trên mọi danh mục
									</p>
								</div>
							</div>

							<div className="flex items-center gap-2">
								<button
									onClick={loadLogs}
									disabled={isLoading}
									title="Làm mới nhật ký"
									className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer">
									<RefreshCw
										className={`w-3.5 h-3.5 text-sky-600 ${isLoading ? "animate-spin" : ""}`}
									/>
									<span>Làm mới</span>
								</button>
								<button
									onClick={onClose}
									className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
									<X className="w-5 h-5" />
								</button>
							</div>
						</div>

						{/* Summary KPI Cards */}
						<div className="px-6 pt-5 pb-4 grid grid-cols-2 md:grid-cols-4 gap-3.5 shrink-0 bg-white">
							<div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
								<div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
									Tổng nhật ký lưu vết
								</div>
								<div className="text-2xl font-black text-slate-800 mt-1">
									{stats.total}
								</div>
							</div>

							<div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100">
								<div className="text-[10px] font-bold uppercase tracking-wider text-sky-700">
									Thêm / Sửa / Xóa / Import
								</div>
								<div className="text-2xl font-black text-sky-600 mt-1">
									{stats.crudCount}
								</div>
							</div>

							<div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
								<div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
									Đăng nhập thành công
								</div>
								<div className="text-2xl font-black text-emerald-600 mt-1">
									{stats.loginSuccess}
								</div>
							</div>

							<div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-100">
								<div className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
									Cảnh báo sai MK & Khóa
								</div>
								<div className="text-2xl font-black text-rose-600 mt-1">
									{stats.securityAlerts}
								</div>
							</div>
						</div>

						{/* Filter & Search Toolbar */}
						<div className="px-6 pb-4 border-b border-slate-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shrink-0">
							<div className="flex items-center gap-1.5 flex-wrap">
								{[
									{ id: "all", label: "Tất cả" },
									{ id: "crud", label: "Thêm / Sửa / Xóa / Xem" },
									{ id: "excel", label: "Nhập / Mẫu Excel" },
									{ id: "auth_session", label: "Đăng nhập & Bảo mật" },
									{ id: "security_alerts", label: "Sai mật khẩu & Khóa" },
									{ id: "system", label: "Bản đồ & Hệ thống" },
								].map((tab) => (
									<button
										key={tab.id}
										onClick={() => setFilter(tab.id as LogFilterCategory)}
										className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
											filter === tab.id
												? "bg-sky-600 text-white shadow-sm"
												: "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
										}`}>
										{tab.label}
									</button>
								))}
							</div>

							<div className="flex items-center gap-2.5">
								<select
									value={categoryFilter}
									onChange={(e) => setCategoryFilter(e.target.value)}
									className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-sky-500 cursor-pointer">
									<option value="all">Mọi danh mục nghiệp vụ</option>
									{Object.entries(CATEGORY_LABELS).map(([key, label]) => (
										<option key={key} value={key}>
											Danh mục: {label}
										</option>
									))}
								</select>

								<div className="relative flex-1 lg:w-64">
									<Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
									<input
										type="text"
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										placeholder="Tìm đối tượng, nội dung, thời gian..."
										className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-sky-500"
									/>
								</div>
							</div>
						</div>

						{/* Logs Timeline */}
						<div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50/40">
							{filteredLogs.length === 0 ? (
								<div className="h-full flex flex-col items-center justify-center text-slate-400 py-16 space-y-2">
									<History className="w-10 h-10 opacity-40" />
									<p className="text-xs font-bold">
										Không có bản ghi nhật ký nào khớp với bộ lọc hiện tại
									</p>
								</div>
							) : (
								<div className="space-y-2.5">
									{filteredLogs.map((log) => {
										const meta = getEventMeta(log.eventType);
										return (
											<div
												key={log.id}
												className="bg-white rounded-2xl p-4 border border-slate-200/75 shadow-xs hover:border-sky-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
												<div className="flex items-start gap-3.5 min-w-0">
													<div
														className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${meta.iconBg}`}>
														{meta.icon}
													</div>
													<div className="space-y-1 min-w-0">
														<div className="flex items-center gap-2 flex-wrap">
															<span
																className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border ${meta.badgeClass}`}>
																{meta.label}
															</span>
															{log.category && (
																<span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-100 text-[10px] font-bold uppercase tracking-wide">
																	{getCategoryDisplayName(log.category)}
																</span>
															)}
															<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold font-mono">
																<User className="w-3 h-3 text-slate-400" />
																{log.username}
															</span>
														</div>
														<p className="text-xs font-semibold text-slate-700 leading-relaxed break-words">
															{log.message}
														</p>
													</div>
												</div>

												<div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 shrink-0 self-start sm:self-center">
													<Clock className="w-3.5 h-3.5 text-slate-400" />
													<span>{formatFullTimestamp(log.timestamp)}</span>
												</div>
											</div>
										);
									})}
								</div>
							)}
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
}
