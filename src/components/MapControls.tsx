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
		<div className="absolute bottom-10 right-6 z-[1000] flex flex-col gap-3">
			{(onFitWard || onFitProvince || onToggleBoundary) && (
				<div className="flex flex-col bg-white rounded-2xl shadow-xl overflow-hidden divide-y divide-slate-100 border border-slate-200/80 font-bold">
					{onFitWard && (
						<button
							onClick={onFitWard}
							title="Về địa giới Phường Bình Minh"
							className="w-12 h-12 flex items-center justify-center text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer">
							<LocateFixed className="w-5 h-5" />
						</button>
					)}
					{onFitProvince && (
						<button
							onClick={onFitProvince}
							title="Xem toàn cảnh Tỉnh Tây Ninh"
							className="w-12 h-12 flex items-center justify-center text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer">
							<MapOverviewIcon className="w-5 h-5" />
						</button>
					)}
					{onToggleBoundary && (
						<button
							onClick={onToggleBoundary}
							title={
								showBoundary
									? "Ẩn đường địa giới hành chính Phường Bình Minh"
									: "Hiện đường địa giới hành chính Phường Bình Minh"
							}
							className={`w-12 h-12 flex items-center justify-center transition-colors cursor-pointer ${
								showBoundary
									? "bg-rose-50 text-rose-600 hover:bg-rose-100"
									: "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
							}`}>
							<Scan className="w-5 h-5" />
						</button>
					)}
				</div>
			)}

			<div className="flex flex-col bg-white rounded-2xl shadow-xl overflow-hidden divide-y divide-slate-100 border border-slate-200/80 font-bold">
				<button
					onClick={zoomIn}
					title="Phóng to"
					className="w-12 h-12 flex items-center justify-center text-slate-650 hover:bg-slate-50 cursor-pointer">
					<Plus className="w-5 h-5" />
				</button>
				<button
					onClick={zoomOut}
					title="Thu nhỏ"
					className="w-12 h-12 flex items-center justify-center text-slate-650 hover:bg-slate-50 cursor-pointer">
					<Minus className="w-5 h-5" />
				</button>
			</div>
		</div>
	);
}
