import React, { useMemo, useState } from "react";
import {
	Search,
	Eye,
	EyeOff,
	Table2,
	ChevronRight,
	X,
	LocateFixed,
	Layers,
	Filter,
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
}

const LAYER_STYLES: Record<
	string,
	{ iconBg: string; iconText: string; badgeBg: string; badgeText: string; shortLabel: string }
> = {
	"vuviec-list": {
		iconBg: "bg-red-50 group-hover:bg-red-600",
		iconText: "text-red-600 group-hover:text-white",
		badgeBg: "bg-red-50 border-red-200",
		badgeText: "text-red-700",
		shortLabel: "Vụ việc",
	},
	"camera-list": {
		iconBg: "bg-orange-50 group-hover:bg-orange-600",
		iconText: "text-orange-600 group-hover:text-white",
		badgeBg: "bg-orange-50 border-orange-200",
		badgeText: "text-orange-700",
		shortLabel: "Camera",
	},
	"doituong-list": {
		iconBg: "bg-cyan-50 group-hover:bg-cyan-600",
		iconText: "text-cyan-600 group-hover:text-white",
		badgeBg: "bg-cyan-50 border-cyan-200",
		badgeText: "text-cyan-700",
		shortLabel: "Đối tượng",
	},
	"coquan-list": {
		iconBg: "bg-slate-100 group-hover:bg-slate-800",
		iconText: "text-slate-700 group-hover:text-white",
		badgeBg: "bg-slate-100 border-slate-300",
		badgeText: "text-slate-700",
		shortLabel: "Cơ quan",
	},
	"cskd-list": {
		iconBg: "bg-pink-50 group-hover:bg-pink-600",
		iconText: "text-pink-600 group-hover:text-white",
		badgeBg: "bg-pink-50 border-pink-200",
		badgeText: "text-pink-700",
		shortLabel: "Cơ sở KD",
	},
	"diemnong-list": {
		iconBg: "bg-rose-50 group-hover:bg-rose-600",
		iconText: "text-rose-600 group-hover:text-white",
		badgeBg: "bg-rose-50 border-rose-200",
		badgeText: "text-rose-700",
		shortLabel: "Điểm nóng",
	},
	"tuyenduong-list": {
		iconBg: "bg-emerald-50 group-hover:bg-emerald-600",
		iconText: "text-emerald-600 group-hover:text-white",
		badgeBg: "bg-emerald-50 border-emerald-200",
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
}: SidebarProps) {
	const [searchGroup, setSearchGroup] = useState<string>("");

	const allTargets = useMemo(() => data.menu.map((m) => m.target), [data.menu]);
	const allHidden = allTargets.length > 0 && allTargets.every((t) => hiddenLayers.includes(t));

	const hasActiveQuickSearch = Boolean(searchQuery.trim() || searchGroup);

	const spotlightResults = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q && !searchGroup)
			return {
				preview: [] as any[],
				totalMatches: 0,
				firstMenuId: undefined as string | undefined,
			};

		const matches: any[] = [];
		let firstMenuId: string | undefined;

		for (const menu of data.menu) {
			if (searchGroup && menu.target !== searchGroup) continue;
			const items = getFilteredData(menu.target);
			for (const item of items) {
				const ok =
					!q ||
					String(item.label ?? "").toLowerCase().includes(q) ||
					(item.loai != null && String(item.loai).toLowerCase().includes(q)) ||
					(item.extra != null && String(item.extra).toLowerCase().includes(q)) ||
					(item.groupId != null && String(item.groupId).toLowerCase().includes(q));
				if (ok) {
					if (!firstMenuId) firstMenuId = menu.id;
					matches.push({ ...item, _menuId: menu.id, _menuTitle: menu.title });
				}
			}
		}

		return {
			preview: matches.slice(0, 8),
			totalMatches: matches.length,
			firstMenuId,
		};
	}, [searchQuery, searchGroup, data, getFilteredData]);

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
		<motion.aside
			initial={false}
			animate={{ x: isMenuOpen ? 0 : -350 }}
			transition={{ type: "spring", damping: 24, stiffness: 140 }}
			style={{ maxHeight: "calc(100vh - 102px)" }}
			className="absolute top-[86px] left-4 w-[316px] bg-white/95 backdrop-blur-xl border border-slate-200/90 z-[900] flex flex-col shadow-xl rounded-2xl overflow-hidden select-none">
			{/* Ô TÌM KIẾM NHANH + BỘ LỌC NHÓM & ĐỊA BÀN (1.2.f) */}
			<div className="p-3.5 border-b border-slate-100 bg-slate-50/60 space-y-2">
				<div className="relative">
					<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
					<input
						type="text"
						placeholder="Tìm vụ việc, đối tượng, CCCD, địa bàn..."
						className="w-full bg-white border border-slate-200 focus:border-sky-500 rounded-xl py-2.5 pl-9 pr-8 text-[13px] text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-sky-500/15 transition-all font-medium"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
					{searchQuery && (
						<button
							type="button"
							onClick={() => setSearchQuery("")}
							className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-700 cursor-pointer"
							title="Xóa từ khóa tìm kiếm">
							<X className="w-4 h-4" />
						</button>
					)}
				</div>

				{/* Bộ lọc nhanh theo nhóm thông tin */}
				<div>
					<select
						value={searchGroup}
						onChange={(e) => setSearchGroup(e.target.value)}
						className="w-full bg-white border border-slate-200 focus:border-sky-500 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-slate-600 outline-none cursor-pointer"
						title="Lọc nhanh theo nhóm thông tin quản lý">
						<option value="">Tất cả nhóm</option>
						{data.menu.map((m) => (
							<option key={m.target} value={m.target}>
								{m.title}
							</option>
						))}
					</select>
				</div>

				{searchGroup && (
					<div className="flex items-center justify-between text-[10px] px-0.5">
						<span className="text-sky-700 font-bold flex items-center gap-1">
							<Filter className="w-3 h-3" />
							Đang lọc kết quả
						</span>
						<button
							type="button"
							onClick={() => {
								setSearchGroup("");
								setSearchQuery("");
							}}
							className="text-rose-600 hover:underline font-bold cursor-pointer">
							Đặt lại
						</button>
					</div>
				)}
			</div>

			{/* KẾT QUẢ TÌM NHANH KHI GÕ TỪ KHÓA HOẶC CHỌN BỘ LỌC */}
			{hasActiveQuickSearch ? (
				<div className="flex-1 overflow-y-auto p-3.5 space-y-2 custom-scrollbar">
					<div className="flex items-center justify-between px-1 text-[11px] font-bold text-slate-500">
						<span>Kết quả tìm thấy</span>
						<span className="font-mono font-extrabold text-sky-600">
							{spotlightResults.totalMatches.toLocaleString("vi-VN")} mục
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
											className="group flex items-center justify-between gap-2.5 p-2.5 rounded-xl bg-white hover:bg-sky-50/50 border border-slate-200 hover:border-sky-300 transition-all cursor-pointer">
											<div className="min-w-0 flex-1">
												<div className="text-[13px] font-bold text-slate-800 group-hover:text-sky-700 truncate">
													{item.label}
												</div>
												<div className="flex items-center gap-1.5 mt-0.5">
													<span
														className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${st.badgeBg} ${st.badgeText}`}>
														{st.shortLabel}
													</span>
													{item.loai && (
														<span className="text-[11px] text-slate-500 truncate">
															{item.loai}
														</span>
													)}
												</div>
											</div>
											<LocateFixed className="w-4 h-4 text-slate-400 group-hover:text-sky-600 shrink-0" />
										</div>
									);
								})}
							</div>

							<button
								type="button"
								onClick={() => onOpenCatalog(spotlightResults.firstMenuId)}
								className="w-full mt-2 py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-[13px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer">
								<Table2 className="w-4 h-4" />
								<span>
									Xem đầy đủ trong Bảng lớn (
									{spotlightResults.totalMatches.toLocaleString("vi-VN")})
								</span>
							</button>
						</>
					) : (
						<div className="py-8 text-center text-[13px] text-slate-500">
							Không tìm thấy dữ liệu trùng khớp
						</div>
					)}
				</div>
			) : (
				/* DANH SÁCH 7 DANH MỤC RÕ RÀNG, DỄ BẤM CHO NGƯỜI U40 */
				<div className="flex-1 overflow-y-auto p-3.5 space-y-2 custom-scrollbar">
					<div className="flex items-center justify-between px-1 pb-1">
						<div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-700 uppercase tracking-wide">
							<Layers className="w-4 h-4 text-sky-600" />
							<span>Các lớp dữ liệu địa bàn</span>
						</div>
						<button
							type="button"
							onClick={handleToggleAllLayers}
							className="text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline cursor-pointer">
							{allHidden ? "Bật tất cả" : "Ẩn tất cả"}
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
									className={`group flex items-center justify-between gap-2 p-2.5 rounded-xl border transition-all cursor-pointer ${
										isHidden
											? "bg-slate-50 border-slate-200/70 opacity-75 hover:opacity-100"
											: "bg-white hover:bg-sky-50/40 border-slate-200 hover:border-sky-300 shadow-2xs"
									}`}
									title={`Bấm để mở bảng danh sách ${menu.title}`}>
									<div className="flex items-center gap-3 min-w-0 flex-1">
										<div
											className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${st.iconBg} ${st.iconText}`}>
											{getIcon(menu.icon)}
										</div>
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-1">
												<span className="text-[13px] font-bold text-slate-800 group-hover:text-sky-700 truncate">
													{menu.title}
												</span>
												<ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-sky-600 shrink-0" />
											</div>
											<div className="text-[11px] font-medium text-slate-500 truncate">
												{isHidden
													? "Đang ẩn ghim trên bản đồ"
													: "Bấm để xem danh sách"}
											</div>
										</div>
									</div>

									<div className="flex items-center gap-1.5 shrink-0">
										<span
											className={`min-w-[32px] text-center px-2 py-0.5 rounded-lg text-xs font-extrabold font-mono border ${st.badgeBg} ${st.badgeText}`}>
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
											className={`p-2 rounded-xl border transition-colors cursor-pointer ${
												isHidden
													? "bg-white border-slate-200 text-slate-400 hover:text-slate-700"
													: "bg-sky-50 border-sky-200/80 text-sky-600 hover:bg-sky-100"
											}`}
											title={
												isHidden
													? `Hiện lớp ${menu.title} lên bản đồ`
													: `Ẩn lớp ${menu.title} khỏi bản đồ`
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
		</motion.aside>
	);
}
