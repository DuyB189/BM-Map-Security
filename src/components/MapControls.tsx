import { Plus, Minus, LocateFixed, Map as MapOverviewIcon, Scan } from "lucide-react";

interface MapControlsProps {
	zoomIn: () => void;
	zoomOut: () => void;
	onFitWard?: () => void;
	onFitProvince?: () => void;
	showBoundary?: boolean;
	onToggleBoundary?: () => void;
}

export default function MapControls({
	zoomIn,
	zoomOut,
	onFitWard,
	onFitProvince,
	showBoundary = true,
	onToggleBoundary,
}: MapControlsProps) {
	return (
		<div className="absolute bottom-4 right-4 z-[950] flex flex-wrap items-center justify-end gap-2 select-none">
			{/* Cụm điều hướng vùng địa lý có chữ Tiếng Việt rõ ràng */}
			{(onFitWard || onFitProvince || onToggleBoundary) && (
				<div className="flex items-center bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/90 p-1 gap-1">
					{onFitWard && (
						<button
							type="button"
							onClick={onFitWard}
							title="Đưa bản đồ quay về trung tâm Phường Bình Minh"
							className="h-9 px-3 rounded-xl flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer">
							<LocateFixed className="w-4 h-4 text-rose-600 shrink-0" />
							<span>Về Phường Bình Minh</span>
						</button>
					)}

					{onFitProvince && (
						<button
							type="button"
							onClick={onFitProvince}
							title="Thu nhỏ để xem toàn cảnh địa bàn Tỉnh Tây Ninh"
							className="h-9 px-3 rounded-xl flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition-colors cursor-pointer">
							<MapOverviewIcon className="w-4 h-4 text-sky-600 shrink-0" />
							<span className="hidden sm:inline">Toàn tỉnh Tây Ninh</span>
						</button>
					)}

					{onToggleBoundary && (
						<button
							type="button"
							onClick={onToggleBoundary}
							title={
								showBoundary
									? "Đang hiển thị đường ranh giới Phường Bình Minh (Bấm để ẩn)"
									: "Đang ẩn đường ranh giới Phường Bình Minh (Bấm để bật)"
							}
							className={`h-9 px-3 rounded-xl flex items-center gap-1.5 text-xs font-bold border transition-colors cursor-pointer ${
								showBoundary
									? "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"
									: "bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700"
							}`}>
							<Scan className="w-4 h-4 shrink-0" />
							<span className="hidden md:inline">
								Ranh giới: {showBoundary ? "Bật" : "Tắt"}
							</span>
						</button>
					)}
				</div>
			)}

			{/* Cụm Thu nhỏ / Phóng to */}
			<div className="flex items-center bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/90 p-1">
				<button
					type="button"
					onClick={zoomOut}
					title="Thu nhỏ bản đồ"
					className="h-9 px-2.5 rounded-xl flex items-center gap-1 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
					<Minus className="w-4 h-4" />
					<span className="hidden xl:inline">Thu nhỏ</span>
				</button>
				<div className="h-5 w-px bg-slate-200 mx-0.5" />
				<button
					type="button"
					onClick={zoomIn}
					title="Phóng to bản đồ"
					className="h-9 px-2.5 rounded-xl flex items-center gap-1 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
					<Plus className="w-4 h-4" />
					<span className="hidden xl:inline">Phóng to</span>
				</button>
			</div>
		</div>
	);
}
