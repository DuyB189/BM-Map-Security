import React, { useMemo } from "react";
import {
	Search,
	Eye,
	EyeOff,
	Table2,
	ArrowUpRight,
	X,
	LocateFixed,
	Layers,
	BarChart3,
} from "lucide-react";
import { motion } from "motion/react";
import { GISData } from "../types";
import { getIcon } from "../utils/icons";
import { authService } from "../utils/authService";

interface SidebarProps {
	isMenuOpen: boolean;
	searchQuery: string;
	setSearchQuery: (val: string) => void;
	data: GISData;
	hiddenLayers: string[];
	setHiddenLayers: React.Dispatch<React.SetStateAction<string[]>>;
	getFilteredData: (type: string) => any[];
	handleItemHover: (id: string | number, category: string, isHovering: boolean) => void;
	handleItemClick: (item: any) => void;
	onOpenCatalog: (menuId?: string) => void;
	onOpenStats: () => void;
}

const LAYER_STYLES: Record<
	string,
	{ iconBg: string; iconText: string; badgeBg: string; badgeText: string; shortLabel: string }
> = {
	"vuviec-list": {
		iconBg: "bg-red-50 group-hover:bg-red-600",
		iconText: "text-red-600 group-hover:text-white",
		badgeBg: "bg-red-50 border-red-100",
		badgeText: "text-red-700",
		shortLabel: "Vụ việc",
	},
	"camera-list": {
		iconBg: "bg-orange-50 group-hover:bg-orange-600",
		iconText: "text-orange-600 group-hover:text-white",
		badgeBg: "bg-orange-50 border-orange-100",
		badgeText: "text-orange-700",
		shortLabel: "Camera",
	},
	"doituong-list": {
		iconBg: "bg-violet-50 group-hover:bg-violet-600",
		iconText: "text-violet-600 group-hover:text-white",
		badgeBg: "bg-violet-50 border-violet-100",
		badgeText: "text-violet-700",
		shortLabel: "Đối tượng",
	},
	"coquan-list": {
		iconBg: "bg-slate-100 group-hover:bg-slate-800",
		iconText: "text-slate-700 group-hover:text-white",
		badgeBg: "bg-slate-100 border-slate-200",
		badgeText: "text-slate-700",
		shortLabel: "Cơ quan",
	},
	"cskd-list": {
		iconBg: "bg-pink-50 group-hover:bg-pink-600",
		iconText: "text-pink-600 group-hover:text-white",
		badgeBg: "bg-pink-50 border-pink-100",
		badgeText: "text-pink-700",
		shortLabel: "Cơ sở KD",
	},
	"diemnong-list": {
		iconBg: "bg-rose-50 group-hover:bg-rose-600",
		iconText: "text-rose-600 group-hover:text-white",
		badgeBg: "bg-rose-50 border-rose-100",
		badgeText: "text-rose-700",
		shortLabel: "Điểm nóng",
	},
	"tuyenduong-list": {
		iconBg: "bg-emerald-50 group-hover:bg-emerald-600",
		iconText: "text-emerald-600 group-hover:text-white",
		badgeBg: "bg-emerald-50 border-emerald-100",
		badgeText: "text-emerald-700",
		shortLabel: "Tuyến đường",
	},
};

export default function Sidebar({
	isMenuOpen,
	searchQuery,
	setSearchQuery,
	data,
	hiddenLayers,
	setHiddenLayers,
	getFilteredData,
	handleItemHover,
	handleItemClick,
	onOpenCatalog,
	onOpenStats,
}: SidebarProps) {
	const totalCount = useMemo(() => {
		return data.menu.reduce((sum, m) => sum + getFilteredData(m.target).length, 0);
	}, [data, getFilteredData]);

	const allTargets = useMemo(() => data.menu.map((m) => m.target), [data.menu]);
	const allHidden = allTargets.length > 0 && allTargets.every((t) => hiddenLayers.includes(t));

	// Spotlight quick search across all categories (capped at 6 preview items to stay ultra-fast even at 10,000 records)
	const spotlightResults = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q)
			return {
				preview: [] as any[],
				totalMatches: 0,
				firstMenuId: undefined as string | undefined,
			};

		const matches: any[] = [];
		let firstMenuId: string | undefined;

		for (const menu of data.menu) {
			const items = getFilteredData(menu.target);
			for (const item of items) {
				const ok =
					item.label?.toLowerCase().includes(q) ||
					(item.loai && String(item.loai).toLowerCase().includes(q)) ||
					(item.extra && String(item.extra).toLowerCase().includes(q)) ||
					(item.groupId && String(item.groupId).toLowerCase().includes(q));
				if (ok) {
					if (!firstMenuId) firstMenuId = menu.id;
					matches.push({
						...item,
						_menuId: menu.id,
						_menuTitle: menu.title,
						_icon: menu.icon,
					});
				}
			}
		}

		return {
			preview: matches.slice(0, 6),
			totalMatches: matches.length,
			firstMenuId,
		};
	}, [searchQuery, data, getFilteredData]);

	const handleToggleAllLayers = () => {
		if (allHidden) {
			setHiddenLayers([]);
			authService.logAction({
				eventType: "SYSTEM_ACTION",
				status: "info",
				message: "Bật hiển thị tất cả lớp dữ liệu trên bản đồ",
			});
		} else {
			setHiddenLayers(allTargets);
			authService.logAction({
				eventType: "SYSTEM_ACTION",
				status: "info",
				message: "Tạm ẩn tất cả lớp dữ liệu trên bản đồ",
			});
		}
	};

	return (
		<motion.div
			initial={false}
			animate={{ x: isMenuOpen ? 0 : -350 }}
			transition={{ type: "spring", damping: 22, stiffness: 120 }}
			style={{ maxHeight: "calc(100vh - 116px)" }}
			className="absolute top-24 left-6 w-80 glass-dark border border-slate-200/90 z-[900] flex flex-col shadow-2xl rounded-3xl overflow-hidden select-none">
			{/* QUICK SPOTLIGHT SEARCH */}
			<div className="p-4 border-b border-slate-100/90 bg-white/60">
				<div className="relative">
					<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
					<input
						type="text"
						placeholder="Tra cứu nhanh trên bản đồ..."
						className="w-full bg-slate-100/90 focus:bg-white border border-transparent focus:border-sky-400 rounded-xl py-2.5 pl-9 pr-8 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-sky-500/15 transition-all font-medium"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
					{searchQuery && (
						<button
							type="button"
							onClick={() => setSearchQuery("")}
							className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-slate-400 hover:text-slate-700 cursor-pointer">
							<X className="w-3.5 h-3.5" />
						</button>
					)}
				</div>
			</div>

			{/* SPOTLIGHT INSTANT JUMP RESULTS (WHEN SEARCHING) */}
			{searchQuery.trim() ? (
				<div className="flex-1 overflow-y-auto p-3.5 space-y-2 custom-scrollbar">
					<div className="flex items-center justify-between px-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
						<span>Kết quả tìm nhanh</span>
						<span className="font-mono text-sky-600">
							{spotlightResults.totalMatches.toLocaleString("vi-VN")} kết quả
						</span>
					</div>

					{spotlightResults.preview.length > 0 ? (
						<>
							<div className="space-y-1.5">
								{spotlightResults.preview.map((item, idx) => {
									const st =
										LAYER_STYLES[item.category] || LAYER_STYLES["coquan-list"];
									return (
										<div
											key={`${item.id}-${idx}`}
											onMouseEnter={() =>
												handleItemHover(
													item.id || item.label,
													item.category,
													true,
												)
											}
											onMouseLeave={() =>
												handleItemHover(
													item.id || item.label,
													item.category,
													false,
												)
											}
											onClick={() => handleItemClick(item)}
											className="group flex items-center justify-between gap-2.5 p-2.5 rounded-2xl bg-white/85 hover:bg-white border border-slate-200/70 hover:border-sky-300 shadow-2xs hover:shadow-sm transition-all cursor-pointer">
											<div className="min-w-0 flex-1">
												<div className="text-xs font-bold text-slate-800 group-hover:text-sky-700 truncate">
													{item.label}
												</div>
												<div className="flex items-center gap-1.5 mt-0.5">
													<span
														className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${st.badgeBg} ${st.badgeText}`}>
														{st.shortLabel}
													</span>
													{item.loai && (
														<span className="text-[10px] text-slate-400 truncate">
															{item.loai}
														</span>
													)}
												</div>
											</div>
											<LocateFixed className="w-3.5 h-3.5 text-slate-300 group-hover:text-sky-600 shrink-0" />
										</div>
									);
								})}
							</div>

							<button
								type="button"
								onClick={() => onOpenCatalog(spotlightResults.firstMenuId)}
								className="w-full mt-2 py-2.5 px-3 rounded-xl bg-sky-50 hover:bg-sky-600 text-sky-700 hover:text-white border border-sky-200 hover:border-sky-600 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer">
								<Table2 className="w-3.5 h-3.5" />
								<span>
									Mở bảng lớn (
									{spotlightResults.totalMatches.toLocaleString("vi-VN")} kết quả)
								</span>
							</button>
						</>
					) : (
						<div className="py-8 text-center text-xs text-slate-400">
							Không tìm thấy đối tượng trùng khớp
						</div>
					)}
				</div>
			) : (
				/* MODERN COMPACT CATEGORY LAYER DOCK */
				<div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 custom-scrollbar">
					<div className="flex items-center justify-between px-1.5 pt-0.5">
						<div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
							<Layers className="w-3.5 h-3.5 text-sky-600" />
							<span>Danh mục dữ liệu ({totalCount.toLocaleString("vi-VN")})</span>
						</div>
						<button
							type="button"
							onClick={handleToggleAllLayers}
							className="text-[10px] font-bold text-sky-600 hover:text-sky-700 hover:underline cursor-pointer">
							{allHidden ? "Hiện tất cả" : "Ẩn tất cả"}
						</button>
					</div>

					<div className="space-y-1.5">
						{data.menu.map((menu) => {
							const count = getFilteredData(menu.target).length;
							const isHidden = hiddenLayers.includes(menu.target);
							const st = LAYER_STYLES[menu.target] || LAYER_STYLES["coquan-list"];

							return (
								<div
									key={menu.id}
									onClick={() => onOpenCatalog(menu.id)}
									className={`group flex items-center justify-between gap-2 p-2.5 rounded-2xl border transition-all cursor-pointer ${
										isHidden
											? "bg-slate-50/70 border-slate-200/50 opacity-75 hover:opacity-100"
											: "bg-white/85 hover:bg-white border-slate-200/70 hover:border-sky-300 shadow-2xs hover:shadow-sm"
									}`}
									title={`Mở bảng dữ liệu: ${menu.title}`}>
									<div className="flex items-center gap-3 min-w-0 flex-1">
										<div
											className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${st.iconBg} ${st.iconText}`}>
											{getIcon(menu.icon)}
										</div>
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-1.5">
												<span className="text-xs font-bold text-slate-800 group-hover:text-sky-700 truncate">
													{menu.title}
												</span>
												<ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-sky-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
											</div>
											<div className="flex items-center gap-1.5 mt-0.5">
												<span
													className={`w-1.5 h-1.5 rounded-full ${
														isHidden ? "bg-slate-300" : "bg-emerald-500"
													}`}
												/>
												<span className="text-[10px] font-medium text-slate-400">
													{isHidden
														? "Đang ẩn trên bản đồ"
														: "Hiển thị bản đồ"}
												</span>
											</div>
										</div>
									</div>

									<div className="flex items-center gap-1.5 shrink-0">
										<span
											className={`px-2 py-0.5 rounded-lg text-[11px] font-extrabold font-mono border ${st.badgeBg} ${st.badgeText}`}>
											{count.toLocaleString("vi-VN")}
										</span>

										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												authService.logAction({
													eventType: "SYSTEM_ACTION",
													status: "info",
													category: menu.target,
													targetName: menu.title,
													message: isHidden
														? `Bật hiển thị lớp dữ liệu "${menu.title}" trên bản đồ`
														: `Tạm ẩn lớp dữ liệu "${menu.title}" khỏi bản đồ`,
												});
												setHiddenLayers((prev) =>
													isHidden
														? prev.filter((id) => id !== menu.target)
														: [...prev, menu.target],
												);
											}}
											className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
												isHidden
													? "text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
													: "text-sky-600 hover:bg-sky-50"
											}`}
											title={
												isHidden
													? "Bật hiển thị lớp này trên bản đồ"
													: "Tạm ẩn lớp này khỏi bản đồ"
											}>
											{isHidden ? (
												<EyeOff className="w-4 h-4" />
											) : (
												<Eye className="w-4 h-4" />
											)}
										</button>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* BOTTOM PRIMARY CTA: OPEN FULL DATA WORKSPACE */}
			<div className="p-3.5 border-t border-slate-200/70 bg-white/75 backdrop-blur-md flex items-center gap-2">
				<button
					type="button"
					onClick={() => onOpenCatalog()}
					className="flex-1 py-2.5 px-3.5 rounded-xl bg-slate-900 hover:bg-sky-600 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer">
					<Table2 className="w-4 h-4 shrink-0" />
					<span>Mở Bảng Dữ Liệu</span>
				</button>
				<button
					type="button"
					onClick={onOpenStats}
					className="p-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200/80 transition-colors cursor-pointer"
					title="Báo cáo thống kê ANTT">
					<BarChart3 className="w-4 h-4" />
				</button>
			</div>
		</motion.div>
	);
}
