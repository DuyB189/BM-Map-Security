import { X, Database, RefreshCw, CheckCircle, AlertTriangle, HardDrive } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface MapStatusInfo {
	exists: boolean;
	path: string;
	sizeBytes: number;
	modifiedTime: any;
	isLoaded: boolean;
}

interface OfflineMapModalProps {
	show: boolean;
	onClose: () => void;
	mapStatus: MapStatusInfo | null;
	isUpdatingMap: boolean;
	updateMessage: { text: string; isError: boolean } | null;
	onTriggerUpdateMap: () => void;
}

export default function OfflineMapModal({
	show,
	onClose,
	mapStatus,
	isUpdatingMap,
	updateMessage,
	onTriggerUpdateMap,
}: OfflineMapModalProps) {
	const isElectron = Boolean((window as any).ipcRenderer);

	return (
		<AnimatePresence>
			{show && (
				<div className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm z-[2200] flex items-center justify-center p-4">
					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 10 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 10 }}
						transition={{ duration: 0.2 }}
						className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
						<div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="p-2.5 bg-sky-600 text-white rounded-xl shadow-md shadow-sky-200">
									<Database className="w-5 h-5" />
								</div>
								<div>
									<h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
										Bản đồ Nền Ngoại tuyến
									</h3>
									<p className="text-[11px] font-semibold text-slate-500">
										Quản lý & cập nhật tệp dữ liệu .mbtiles
									</p>
								</div>
							</div>
							<button
								onClick={onClose}
								className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
								<X className="w-5 h-5" />
							</button>
						</div>

						<div className="p-6 space-y-4">
							{isElectron && mapStatus ? (
								<div className="bg-slate-50 rounded-2xl p-4 text-xs text-slate-600 border border-slate-200/80 space-y-2.5">
									<div className="flex justify-between items-center">
										<span className="font-semibold text-slate-500">Trạng thái:</span>
										<span
											className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
												mapStatus.isLoaded
													? "text-emerald-700 bg-emerald-100"
													: "text-amber-700 bg-amber-100"
											}`}>
											{mapStatus.isLoaded ? "Đã kết nối Offline" : "Chưa nạp"}
										</span>
									</div>
									<div className="flex justify-between items-center border-t border-slate-200/60 pt-2">
										<span className="font-semibold text-slate-500">Dung lượng tệp:</span>
										<span className="font-bold text-slate-800 font-mono">
											{(mapStatus.sizeBytes / (1024 * 1024)).toFixed(1)} MB
										</span>
									</div>
									<div className="flex justify-between items-center border-t border-slate-200/60 pt-2">
										<span className="font-semibold text-slate-500">Cập nhật gần nhất:</span>
										<span className="font-bold text-slate-800">
											{mapStatus.modifiedTime
												? new Date(mapStatus.modifiedTime).toLocaleString("vi-VN")
												: "Mặc định"}
										</span>
									</div>
								</div>
							) : (
								<div className="bg-amber-50 rounded-2xl p-4 text-xs text-amber-800 border border-amber-200 flex items-start gap-2.5">
									<HardDrive className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
									<span className="font-medium leading-relaxed">
										Chức năng đọc/ghi trực tiếp tệp <b>.mbtiles</b> hoạt động khi mở ứng
										dụng bằng cửa sổ Desktop Electron.
									</span>
								</div>
							)}

							<button
								onClick={onTriggerUpdateMap}
								disabled={!isElectron || isUpdatingMap}
								className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm ${
									!isElectron || isUpdatingMap
										? "bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed shadow-none"
										: "bg-sky-600 border border-sky-600 hover:bg-sky-700 text-white hover:shadow-md cursor-pointer"
								}`}>
								<RefreshCw className={`w-4 h-4 ${isUpdatingMap ? "animate-spin" : ""}`} />
								<span>
									{isUpdatingMap
										? "Đang sao chép & nạp bản đồ..."
										: "Chọn tệp bản đồ (.mbtiles) mới"}
								</span>
							</button>

							<AnimatePresence>
								{updateMessage && (
									<motion.div
										initial={{ opacity: 0, y: -5 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -5 }}
										className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold ${
											updateMessage.isError
												? "bg-rose-50 text-rose-700 border border-rose-200"
												: "bg-emerald-50 text-emerald-700 border border-emerald-200"
										}`}>
										{updateMessage.isError ? (
											<AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
										) : (
											<CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
										)}
										<span>{updateMessage.text}</span>
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
}

