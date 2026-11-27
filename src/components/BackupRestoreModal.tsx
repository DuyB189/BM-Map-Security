import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
	X,
	HardDriveDownload,
	HardDriveUpload,
	ShieldCheck,
	Lock,
	Eye,
	EyeOff,
	CheckCircle2,
	AlertTriangle,
	RotateCcw,
	Plus,
	FileArchive,
	Clock,
	FolderOpen,
	History,
} from "lucide-react";
import { GISData } from "../types";
import { appConfirm } from "./AppConfirmModal";

interface BackupRestoreModalProps {
	show: boolean;
	onClose: () => void;
	onDataRestored: (restoredData: GISData) => void;
}

interface SnapshotItem {
	id: string;
	createdAt: string;
	reason: "auto_daily" | "manual" | "pre_restore" | string;
	totalRecords: number;
	sizeBytes: number;
}

interface StorageInfo {
	dbSizeBytes: number;
	summary: {
		totalRecords: number;
		counts: Record<string, number>;
	};
	snapshots: SnapshotItem[];
}

interface InspectedPortableMeta {
	filePath: string;
	fileName: string;
	sizeBytes: number;
	createdAt: string;
	sourceHost: string;
	summary: {
		totalRecords: number;
		counts: Record<string, number>;
		includesAuditLogs?: boolean;
	};
}

function formatBytes(bytes: number): string {
	if (!bytes || bytes <= 0) return "0 KB";
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDateTimeVi(iso?: string): string {
	if (!iso) return "—";
	const d = new Date(iso);
	if (isNaN(d.getTime())) return iso;
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${pad(d.getHours())}:${pad(d.getMinutes())} - ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function getSnapshotReasonBadge(reason: string) {
	if (reason === "auto_daily") {
		return (
			<span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
				Tự động lưu hằng ngày
			</span>
		);
	}
	if (reason === "pre_restore") {
		return (
			<span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
				Bản giữ lại trước khi khôi phục
			</span>
		);
	}
	return (
		<span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
			Lưu thủ công
		</span>
	);
}

const COUNT_LABELS: { key: string; label: string }[] = [
	{ key: "vuviec", label: "Vụ việc" },
	{ key: "camera", label: "Camera" },
	{ key: "doituong", label: "Đối tượng" },
	{ key: "coquan", label: "Cơ quan" },
	{ key: "cskd", label: "Cơ sở KD" },
	{ key: "diemnong", label: "Điểm nóng" },
	{ key: "tuyenduong", label: "Tuyến đường" },
];

export default function BackupRestoreModal({
	show,
	onClose,
	onDataRestored,
}: BackupRestoreModalProps) {
	const [activeTab, setActiveTab] = useState<"export" | "import" | "vault">("export");
	const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
	const [loading, setLoading] = useState(false);
	const [feedback, setFeedback] = useState<{
		type: "success" | "error";
		text: string;
	} | null>(null);

	// Export states
	const [exportPass, setExportPass] = useState("");
	const [exportPassConfirm, setExportPassConfirm] = useState("");
	const [showExportPass, setShowExportPass] = useState(false);
	const [includeAuditLogs, setIncludeAuditLogs] = useState(true);

	// Import states
	const [inspectedPkg, setInspectedPkg] = useState<InspectedPortableMeta | null>(null);
	const [importPass, setImportPass] = useState("");
	const [showImportPass, setShowImportPass] = useState(false);
	const [importMode, setImportMode] = useState<"replace" | "merge">("replace");
	const [restoreLogsCheck, setRestoreLogsCheck] = useState(true);

	const refreshStorageInfo = useCallback(async () => {
		const ipc = (window as any).ipcRenderer;
		if (!ipc) return;
		try {
			const res = await ipc.invoke("backup:get-info");
			if (res?.success) {
				setStorageInfo(res);
			}
		} catch (e) {
			console.error("Failed loading backup info:", e);
		}
	}, []);

	useEffect(() => {
		if (!show) return;
		setFeedback(null);
		refreshStorageInfo();
	}, [show, refreshStorageInfo]);

	useEffect(() => {
		setFeedback(null);
	}, [activeTab]);

	if (!show) return null;

	const handleExportPortable = async () => {
		setFeedback(null);
		if (exportPass.trim().length < 6) {
			setFeedback({
				type: "error",
				text: "Mật khẩu bảo vệ tệp sao lưu phải có ít nhất 6 ký tự.",
			});
			return;
		}
		if (exportPass !== exportPassConfirm) {
			setFeedback({
				type: "error",
				text: "Mật khẩu nhập lại không trùng khớp. Vui lòng kiểm tra lại.",
			});
			return;
		}

		const ipc = (window as any).ipcRenderer;
		if (!ipc) {
			setFeedback({
				type: "error",
				text: "Chức năng này chỉ hoạt động trên phần mềm cài đặt máy tính.",
			});
			return;
		}

		setLoading(true);
		try {
			const res = await ipc.invoke("backup:export-portable", {
				passphrase: exportPass,
				includeAuditLogs,
			});
			if (res?.reason === "cancelled") {
				return;
			}
			if (res?.success) {
				setExportPass("");
				setExportPassConfirm("");
				setFeedback({
					type: "success",
					text: `Đã lưu thành công tệp "${res.fileName}" (${res.totalRecords} bản ghi). Bạn có thể chép tệp này vào USB để cất dự phòng hoặc mang sang máy tính mới.`,
				});
				refreshStorageInfo();
			} else {
				setFeedback({
					type: "error",
					text: res?.error || "Không thể lưu tệp sao lưu.",
				});
			}
		} finally {
			setLoading(false);
		}
	};

	const handleSelectPortableFile = async () => {
		setFeedback(null);
		const ipc = (window as any).ipcRenderer;
		if (!ipc) return;

		setLoading(true);
		try {
			const res = await ipc.invoke("backup:inspect-portable");
			if (res?.reason === "cancelled") return;
			if (res?.success) {
				setInspectedPkg(res);
				setImportPass("");
			} else {
				setFeedback({
					type: "error",
					text: res?.error || "Tệp không hợp lệ.",
				});
			}
		} finally {
			setLoading(false);
		}
	};

	const handleImportPortable = async () => {
		if (!inspectedPkg) return;
		setFeedback(null);

		if (!importPass.trim()) {
			setFeedback({
				type: "error",
				text: "Vui lòng nhập mật khẩu của tệp sao lưu này.",
			});
			return;
		}

		const confirmMsg =
			importMode === "replace"
				? `Xác nhận KHÔI PHỤC NGUYÊN TRẠNG từ tệp "${inspectedPkg.fileName}"?\n\n(Phần mềm sẽ tự giữ lại 1 bản dự phòng dữ liệu hiện tại của máy trước khi thực hiện).`
				: `Xác nhận GỘP THÊM dữ liệu từ tệp "${inspectedPkg.fileName}" vào dữ liệu hiện có trên máy?`;

		if (!(await appConfirm(confirmMsg, { confirmText: "Khôi phục", cancelText: "Hủy" }))) return;

		const ipc = (window as any).ipcRenderer;
		if (!ipc) return;

		setLoading(true);
		try {
			const res = await ipc.invoke("backup:import-portable", {
				filePath: inspectedPkg.filePath,
				passphrase: importPass,
				mode: importMode,
				restoreAuditLogs: restoreLogsCheck,
			});

			if (res?.success && res.data) {
				onDataRestored(res.data);
				setImportPass("");
				setInspectedPkg(null);
				await refreshStorageInfo();
				setFeedback({
					type: "success",
					text: `Đã khôi phục thành công ${res.totalRecords} bản ghi! Dữ liệu trên bản đồ đã được cập nhật ngay.`,
				});
			} else {
				setFeedback({
					type: "error",
					text: res?.error || "Mật khẩu không đúng hoặc tệp sao lưu bị lỗi.",
				});
			}
		} finally {
			setLoading(false);
		}
	};

	const handleCreateManualSnapshot = async () => {
		setFeedback(null);
		const ipc = (window as any).ipcRenderer;
		if (!ipc) return;

		setLoading(true);
		try {
			const res = await ipc.invoke("backup:create-local-snapshot");
			if (res?.success) {
				await refreshStorageInfo();
				setFeedback({
					type: "success",
					text: "Đã lưu thêm 1 mốc dự phòng mới ngay trên máy tính này.",
				});
			} else {
				setFeedback({
					type: "error",
					text: res?.error || "Không thể lưu mốc dự phòng.",
				});
			}
		} finally {
			setLoading(false);
		}
	};

	const handleRestoreLocalSnapshot = async (snap: SnapshotItem) => {
		const ok = await appConfirm(
			`Bạn muốn quay lại dữ liệu thời điểm "${formatDateTimeVi(snap.createdAt)}" (${snap.totalRecords} bản ghi)?\n\nDữ liệu hiện tại vẫn sẽ được giữ lại tự động phòng khi cần đổi ý.`,
			{ confirmText: "Quay lại mốc này", cancelText: "Hủy" },
		);
		if (!ok) {
			return;
		}

		setFeedback(null);
		const ipc = (window as any).ipcRenderer;
		if (!ipc) return;

		setLoading(true);
		try {
			const res = await ipc.invoke("backup:restore-local-snapshot", {
				snapshotId: snap.id,
			});
			if (res?.success && res.data) {
				onDataRestored(res.data);
				await refreshStorageInfo();
				setFeedback({
					type: "success",
					text: `Đã quay lại dữ liệu lúc ${formatDateTimeVi(snap.createdAt)} (${res.totalRecords} bản ghi).`,
				});
			} else {
				setFeedback({
					type: "error",
					text: res?.error || "Không thể khôi phục mốc này.",
				});
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<AnimatePresence>
			<div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-[2200] flex items-center justify-center p-4">
				<motion.div
					initial={{ opacity: 0, scale: 0.96, y: 12 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					exit={{ opacity: 0, scale: 0.96, y: 12 }}
					className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
					{/* HEADER */}
					<div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-4 shrink-0">
						<div className="flex items-center gap-3">
							<div className="w-11 h-11 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-xs shrink-0">
								<ShieldCheck className="w-5 h-5" />
							</div>
							<div>
								<h2 className="text-[15px] font-extrabold text-slate-800 uppercase tracking-tight">
									SAO LƯU DỰ PHÒNG & CHUYỂN DỮ LIỆU SANG MÁY KHÁC
								</h2>
								<p className="text-xs text-slate-500 font-medium mt-0.5">
									Lưu dữ liệu ra USB để dự phòng hoặc chuyển sang máy tính mới
								</p>
							</div>
						</div>
						<button
							type="button"
							onClick={onClose}
							className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer">
							<X className="w-5 h-5" />
						</button>
					</div>

					{/* 3 CLEAR TABS */}
					<div className="px-6 pt-3 pb-0 bg-white border-b border-slate-200 flex flex-wrap gap-2 shrink-0">
						<button
							type="button"
							onClick={() => setActiveTab("export")}
							className={`px-4 py-2.5 rounded-t-xl text-[13px] font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
								activeTab === "export"
									? "border-sky-600 text-sky-700 bg-sky-50/60"
									: "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
							}`}>
							<HardDriveDownload className="w-4 h-4" />
							<span>1. Lưu ra USB / Chuyển máy</span>
						</button>

						<button
							type="button"
							onClick={() => setActiveTab("import")}
							className={`px-4 py-2.5 rounded-t-xl text-[13px] font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
								activeTab === "import"
									? "border-emerald-600 text-emerald-700 bg-emerald-50/60"
									: "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
							}`}>
							<HardDriveUpload className="w-4 h-4" />
							<span>2. Khôi phục từ tệp sao lưu</span>
						</button>

						<button
							type="button"
							onClick={() => setActiveTab("vault")}
							className={`px-4 py-2.5 rounded-t-xl text-[13px] font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
								activeTab === "vault"
									? "border-indigo-600 text-indigo-700 bg-indigo-50/60"
									: "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
							}`}>
							<History className="w-4 h-4" />
							<span>
								3. Các bản tự lưu trên máy ({storageInfo?.snapshots.length ?? 0})
							</span>
						</button>
					</div>

					{/* CONTENT */}
					<div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
						{feedback && (
							<div
								className={`p-4 rounded-2xl border flex items-start gap-3 text-[13px] font-semibold leading-relaxed ${
									feedback.type === "success"
										? "bg-emerald-50 border-emerald-200 text-emerald-800"
										: "bg-rose-50 border-rose-200 text-rose-800"
								}`}>
								{feedback.type === "success" ? (
									<CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
								) : (
									<AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
								)}
								<span>{feedback.text}</span>
							</div>
						)}

						{/* TAB 1: EXPORT TO USB */}
						{activeTab === "export" && (
							<div className="space-y-5">
								<div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 text-[13px] text-slate-700 leading-relaxed">
									<strong className="text-sky-800">Khi nào dùng mục này:</strong>{" "}
									Khi bạn muốn{" "}
									<strong>cất dự phòng toàn bộ dữ liệu ra USB</strong> hoặc{" "}
									<strong>chuyển toàn bộ dữ liệu sang một máy tính mới</strong>.
									Tệp xuất ra được khóa bằng mật khẩu riêng do bạn đặt để người lạ
									không thể mở xem.
								</div>

								{storageInfo && (
									<div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
										<div className="flex items-center justify-between">
											<span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
												Dữ liệu hiện có trên máy sẽ được lưu
											</span>
											<span className="px-2.5 py-0.5 rounded-full bg-sky-600 text-white text-xs font-extrabold font-mono">
												Tổng:{" "}
												{storageInfo.summary.totalRecords.toLocaleString(
													"vi-VN",
												)}{" "}
												bản ghi
											</span>
										</div>
										<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
											{COUNT_LABELS.map((c) => (
												<div
													key={c.key}
													className="bg-white rounded-xl px-3 py-2 border border-slate-200/70 flex items-center justify-between text-xs">
													<span className="text-slate-500 font-semibold">
														{c.label}
													</span>
													<span className="font-mono font-extrabold text-slate-800">
														{storageInfo.summary.counts?.[c.key] ?? 0}
													</span>
												</div>
											))}
										</div>
									</div>
								)}

								<div className="space-y-4 bg-white rounded-2xl border border-slate-200 p-5">
									<div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
										<Lock className="w-4 h-4 text-sky-600" />
										<span>Đặt mật khẩu khóa bảo vệ tệp sao lưu</span>
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<div className="space-y-1.5">
											<label className="text-xs font-bold text-slate-600 block">
												Mật khẩu bảo vệ (ít nhất 6 ký tự)
											</label>
											<div className="relative">
												<input
													type={showExportPass ? "text" : "password"}
													value={exportPass}
													onChange={(e) => setExportPass(e.target.value)}
													placeholder="Nhập mật khẩu..."
													className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-sky-500 rounded-xl px-3.5 py-2.5 pr-10 text-[13px] font-medium text-slate-800 outline-none"
												/>
												<button
													type="button"
													onClick={() =>
														setShowExportPass(!showExportPass)
													}
													className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer">
													{showExportPass ? (
														<EyeOff className="w-4 h-4" />
													) : (
														<Eye className="w-4 h-4" />
													)}
												</button>
											</div>
										</div>

										<div className="space-y-1.5">
											<label className="text-xs font-bold text-slate-600 block">
												Nhập lại mật khẩu trên
											</label>
											<input
												type={showExportPass ? "text" : "password"}
												value={exportPassConfirm}
												onChange={(e) =>
													setExportPassConfirm(e.target.value)
												}
												placeholder="Nhập lại đúng mật khẩu..."
												className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-sky-500 rounded-xl px-3.5 py-2.5 text-[13px] font-medium text-slate-800 outline-none"
											/>
										</div>
									</div>

									<label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
										<input
											type="checkbox"
											checked={includeAuditLogs}
											onChange={(e) => setIncludeAuditLogs(e.target.checked)}
											className="w-4 h-4 rounded accent-sky-600 cursor-pointer"
										/>
										<span className="text-[13px] text-slate-700 font-medium">
											Lưu kèm cả lịch sử hoạt động hệ thống
										</span>
									</label>

									<div className="pt-2">
										<button
											type="button"
											disabled={loading}
											onClick={handleExportPortable}
											className="w-full py-3 px-5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-[13px] font-bold shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer">
											<HardDriveDownload className="w-4 h-4" />
											<span>
												{loading
													? "Đang đóng gói dữ liệu..."
													: "Tạo tệp sao lưu & Chọn nơi lưu (USB / Máy tính)"}
											</span>
										</button>
									</div>
								</div>
							</div>
						)}

						{/* TAB 2: IMPORT FROM FILE */}
						{activeTab === "import" && (
							<div className="space-y-5">
								<div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-[13px] text-slate-700 leading-relaxed">
									<strong className="text-emerald-800">Hướng dẫn:</strong> Chọn
									tệp sao lưu từ USB hoặc ổ cứng, sau đó nhập mật khẩu đã đặt lúc
									xuất tệp để đưa dữ liệu vào máy tính này.
								</div>

								<div className="p-5 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
									<div className="flex items-center gap-3">
										<div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 text-emerald-600 flex items-center justify-center shrink-0">
											<FileArchive className="w-5 h-5" />
										</div>
										<div>
											<h4 className="text-[13px] font-bold text-slate-800">
												{inspectedPkg
													? inspectedPkg.fileName
													: "Chưa chọn tệp sao lưu"}
											</h4>
											<p className="text-xs text-slate-500 mt-0.5">
												{inspectedPkg
													? `Ngày lưu: ${formatDateTimeVi(inspectedPkg.createdAt)} • Dung lượng: ${formatBytes(inspectedPkg.sizeBytes)}`
													: "Bấm nút bên phải để tìm tệp sao lưu trong USB hoặc máy tính"}
											</p>
										</div>
									</div>

									<button
										type="button"
										disabled={loading}
										onClick={handleSelectPortableFile}
										className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-bold flex items-center gap-2 shrink-0 cursor-pointer">
										<FolderOpen className="w-4 h-4" />
										<span>
											{inspectedPkg ? "Chọn tệp khác" : "Chọn tệp sao lưu"}
										</span>
									</button>
								</div>

								{inspectedPkg && (
									<div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
										<div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
											<span className="text-xs font-bold text-slate-500">
												Tệp chứa dữ liệu của:{" "}
												<strong className="text-slate-700">
													{inspectedPkg.sourceHost}
												</strong>
											</span>
											<span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold font-mono">
												{(
													inspectedPkg.summary?.totalRecords ?? 0
												).toLocaleString("vi-VN")}{" "}
												bản ghi
											</span>
										</div>

										<div className="space-y-2">
											<label className="text-xs font-bold text-slate-700 block">
												Bạn muốn đưa dữ liệu vào máy này theo cách nào?
											</label>
											<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
												<label
													onClick={() => setImportMode("replace")}
													className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
														importMode === "replace"
															? "bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/15"
															: "bg-slate-50/60 border-slate-200 hover:bg-slate-50"
													}`}>
													<div className="text-[13px] font-bold text-slate-800">
														Thay thế toàn bộ (Khi chuyển sang máy mới)
													</div>
													<div className="text-xs text-slate-500 mt-1">
														Làm cho dữ liệu trên máy này giống hệt 100%
														với tệp sao lưu.
													</div>
												</label>

												<label
													onClick={() => setImportMode("merge")}
													className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
														importMode === "merge"
															? "bg-sky-50/70 border-sky-500 ring-2 ring-sky-500/15"
															: "bg-slate-50/60 border-slate-200 hover:bg-slate-50"
													}`}>
													<div className="text-[13px] font-bold text-slate-800">
														Gộp thêm vào dữ liệu đang có
													</div>
													<div className="text-xs text-slate-500 mt-1">
														Giữ nguyên dữ liệu hiện tại của máy và chỉ
														cộng thêm các mục mới.
													</div>
												</label>
											</div>
										</div>

										{inspectedPkg.summary?.includesAuditLogs && (
											<label className="flex items-center gap-2.5 cursor-pointer select-none">
												<input
													type="checkbox"
													checked={restoreLogsCheck}
													onChange={(e) =>
														setRestoreLogsCheck(e.target.checked)
													}
													className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
												/>
												<span className="text-[13px] text-slate-700 font-medium">
													Khôi phục kèm lịch sử hoạt động từ tệp sao lưu
												</span>
											</label>
										)}

										<div className="space-y-1.5">
											<label className="text-xs font-bold text-slate-700 block">
												Nhập mật khẩu của tệp sao lưu:
											</label>
											<div className="relative">
												<input
													type={showImportPass ? "text" : "password"}
													value={importPass}
													onChange={(e) => setImportPass(e.target.value)}
													placeholder="Nhập mật khẩu bảo vệ tệp..."
													className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 pr-10 text-[13px] font-medium text-slate-800 outline-none"
												/>
												<button
													type="button"
													onClick={() =>
														setShowImportPass(!showImportPass)
													}
													className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer">
													{showImportPass ? (
														<EyeOff className="w-4 h-4" />
													) : (
														<Eye className="w-4 h-4" />
													)}
												</button>
											</div>
										</div>

										<button
											type="button"
											disabled={loading}
											onClick={handleImportPortable}
											className="w-full py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[13px] font-bold shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer">
											<HardDriveUpload className="w-4 h-4" />
											<span>
												{loading
													? "Đang khôi phục dữ liệu..."
													: "Xác nhận Khôi phục Dữ liệu"}
											</span>
										</button>
									</div>
								)}
							</div>
						)}

						{/* TAB 3: SIMPLE USER-FRIENDLY AUTO-BACKUPS ON THIS PC */}
						{activeTab === "vault" && (
							<div className="space-y-4">
								<div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
									<div className="text-[13px] text-slate-700 leading-relaxed">
										Mỗi ngày có thêm, sửa hoặc xóa thông tin, phần mềm{" "}
										<strong>tự động giữ lại 1 bản dự phòng ngay trên máy</strong>{" "}
										(tối đa 15 bản gần nhất) để bạn có thể quay lại bất cứ lúc
										nào nếu lỡ tay xóa nhầm.
									</div>
									<button
										type="button"
										disabled={loading}
										onClick={handleCreateManualSnapshot}
										className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[13px] font-bold flex items-center gap-1.5 cursor-pointer shrink-0">
										<Plus className="w-4 h-4" />
										<span>Lưu dự phòng ngay</span>
									</button>
								</div>

								<div className="space-y-2">
									{storageInfo?.snapshots && storageInfo.snapshots.length > 0 ? (
										storageInfo.snapshots.map((snap) => (
											<div
												key={snap.id}
												className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 flex flex-wrap items-center justify-between gap-3 transition-colors">
												<div className="space-y-1 min-w-0">
													<div className="flex flex-wrap items-center gap-2">
														<Clock className="w-4 h-4 text-slate-400" />
														<span className="text-[13px] font-bold text-slate-800 font-mono">
															{formatDateTimeVi(snap.createdAt)}
														</span>
														{getSnapshotReasonBadge(snap.reason)}
													</div>
													<div className="text-xs text-slate-500">
														Gồm{" "}
														<strong className="text-slate-700 font-mono">
															{snap.totalRecords.toLocaleString(
																"vi-VN",
															)}
														</strong>{" "}
														bản ghi
													</div>
												</div>

												<button
													type="button"
													disabled={loading}
													onClick={() => handleRestoreLocalSnapshot(snap)}
													className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-indigo-600 text-slate-700 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0">
													<RotateCcw className="w-3.5 h-3.5" />
													<span>Quay lại mốc này</span>
												</button>
											</div>
										))
									) : (
										<div className="py-10 text-center text-[13px] text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
											Chưa có mốc dự phòng nào trên máy. Bạn có thể bấm nút{" "}
											<strong>&ldquo;Lưu dự phòng ngay&rdquo;</strong> ở góc
											trên.
										</div>
									)}
								</div>
							</div>
						)}
					</div>
				</motion.div>
			</div>
		</AnimatePresence>
	);
}
