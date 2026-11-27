import React, { useState, useMemo, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import * as XLSX from "xlsx";
import {
	X,
	Search,
	Plus,
	UploadCloud,
	Download,
	LocateFixed,
	Pencil,
	Trash2,
	Eye,
	EyeOff,
	LayoutGrid,
	Table2,
	ArrowUpDown,
	ArrowUp,
	ArrowDown,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	FilterX,
	AlertTriangle,
	Cctv,
	User,
	Building2,
	Store,
	Flame,
	Route,
	MapPin,
	Phone,
	FileText,
	CheckSquare,
	Square,
	Calendar,
	Layers,
	Tag,
	History,
	ShieldCheck,
	ClipboardCheck,
	Camera,
	ZoomIn,
} from "lucide-react";
import { GISData } from "../types";
import { formatDate } from "../utils/date";
import { parseFlexibleLocalDate, getLocalDateStr } from "../utils/dateUtils";
import { authService, getCategoryDisplayName } from "../utils/authService";
import { evaluateLicenseStatus } from "../utils/gisHelpers";
import { appConfirm } from "./AppConfirmModal";

interface DataCatalogModalProps {
	show: boolean;
	initialMenuId: string | null;
	onClose: () => void;
	data: GISData;
	hiddenLayers: string[];
	setHiddenLayers: React.Dispatch<React.SetStateAction<string[]>>;
	onLocateOnMap: (item: any, category: string) => void;
	onOpenAddForCategory: (category: string) => void;
	onOpenImportForMenu: (menuId: string) => void;
	onDeleteSingle: (id: string | number, category: string) => void;
	onBulkDelete: (ids: (string | number)[], category: string) => void;
	suspendOverlay?: boolean;
	allowedCategories?: string[];
}

type CategoryTarget =
	| "vuviec-list"
	| "camera-list"
	| "doituong-list"
	| "coquan-list"
	| "cskd-list"
	| "diemnong-list"
	| "tuyenduong-list";

interface CategoryMeta {
	menuId: string;
	target: CategoryTarget;
	title: string;
	shortTitle: string;
	supportsImport: boolean;
	accentText: string;
	accentBg: string;
	accentBorder: string;
	activePill: string;
}

const CATEGORY_CONFIGS: CategoryMeta[] = [
	{
		menuId: "menu-vuviec",
		target: "vuviec-list",
		title: "Vụ việc an ninh trật tự",
		shortTitle: "Vụ việc",
		supportsImport: true,
		accentText: "text-red-600",
		accentBg: "bg-red-50",
		accentBorder: "border-red-200",
		activePill: "bg-red-600 text-white shadow-sm shadow-red-200",
	},
	{
		menuId: "menu-camera",
		target: "camera-list",
		title: "Hệ thống Camera giám sát",
		shortTitle: "Camera",
		supportsImport: true,
		accentText: "text-orange-600",
		accentBg: "bg-orange-50",
		accentBorder: "border-orange-200",
		activePill: "bg-orange-600 text-white shadow-sm shadow-orange-200",
	},
	{
		menuId: "menu-doituong",
		target: "doituong-list",
		title: "Hồ sơ Đối tượng quản lý",
		shortTitle: "Đối tượng",
		supportsImport: true,
		accentText: "text-cyan-600",
		accentBg: "bg-cyan-50",
		accentBorder: "border-cyan-200",
		activePill: "bg-cyan-600 text-white shadow-sm shadow-cyan-200",
	},
	{
		menuId: "menu-coquan",
		target: "coquan-list",
		title: "Cơ quan nhà nước & Trụ sở",
		shortTitle: "Cơ quan",
		supportsImport: true,
		accentText: "text-slate-700",
		accentBg: "bg-slate-100",
		accentBorder: "border-slate-300",
		activePill: "bg-slate-800 text-white shadow-sm shadow-slate-300",
	},
	{
		menuId: "menu-cskd",
		target: "cskd-list",
		title: "Cơ sở kinh doanh có điều kiện",
		shortTitle: "Cơ sở KD",
		supportsImport: true,
		accentText: "text-pink-600",
		accentBg: "bg-pink-50",
		accentBorder: "border-pink-200",
		activePill: "bg-pink-600 text-white shadow-sm shadow-pink-200",
	},
	{
		menuId: "menu-diemnong",
		target: "diemnong-list",
		title: "Điểm nóng an ninh trật tự",
		shortTitle: "Điểm nóng",
		supportsImport: true,
		accentText: "text-rose-600",
		accentBg: "bg-rose-50",
		accentBorder: "border-rose-200",
		activePill: "bg-rose-600 text-white shadow-sm shadow-rose-200",
	},
	{
		menuId: "menu-tuyenduong",
		target: "tuyenduong-list",
		title: "Tuyến đường & Chốt tuần tra",
		shortTitle: "Tuyến đường",
		supportsImport: true,
		accentText: "text-emerald-600",
		accentBg: "bg-emerald-50",
		accentBorder: "border-emerald-200",
		activePill: "bg-emerald-600 text-white shadow-sm shadow-emerald-200",
	},
];

function renderCategoryIcon(target: CategoryTarget, className = "w-4 h-4") {
	switch (target) {
		case "vuviec-list":
			return <AlertTriangle className={className} />;
		case "camera-list":
			return <Cctv className={className} />;
		case "doituong-list":
			return <User className={className} />;
		case "coquan-list":
			return <Building2 className={className} />;
		case "cskd-list":
			return <Store className={className} />;
		case "diemnong-list":
			return <Flame className={className} />;
		case "tuyenduong-list":
			return <Route className={className} />;
	}
}

function getRecordKey(item: any, target: CategoryTarget): string | number {
	switch (target) {
		case "vuviec-list":
			return item.id || item.loai;
		case "camera-list":
			return item.id || item.ten;
		case "doituong-list":
			return item.id || item.hoten;
		case "coquan-list":
			return item.ten;
		case "cskd-list":
			return item.ten;
		case "diemnong-list":
			return item.id || item.ten;
		case "tuyenduong-list":
			return item.id || item.ten;
	}
}

function getPrimaryTitle(item: any, target: CategoryTarget): string {
	if (!item) return "Chưa đặt tên";
	if (target === "vuviec-list") return String(item.loai ?? "").trim() || "Vụ việc chưa đặt tên";
	if (target === "doituong-list") return String(item.hoten ?? "").trim() || "Chưa rõ họ tên";
	return String(item.ten ?? "").trim() || "Chưa đặt tên";
}

function getStatusOrSeverity(item: any, target: CategoryTarget): string {
	if (!item) return "";
	if (target === "vuviec-list" || target === "camera-list" || target === "cskd-list") {
		return String(item.trangthai || (target === "camera-list" ? "Hoạt động" : "")).trim();
	}
	if (target === "diemnong-list" || target === "tuyenduong-list") {
		return String(item.mucdo || "Trung bình").trim();
	}
	return "";
}

function formatCoordPair(lat: any, lng: any, decimals = 5): string {
	const nLat = typeof lat === "number" ? lat : parseFloat(String(lat));
	const nLng = typeof lng === "number" ? lng : parseFloat(String(lng));
	if (!Number.isFinite(nLat) || !Number.isFinite(nLng)) return "";
	return `${nLat.toFixed(decimals)}, ${nLng.toFixed(decimals)}`;
}

function renderStatusBadge(value: string) {
	if (!value) return <span className="text-slate-300 text-xs">—</span>;
	const v = String(value ?? "").toLowerCase();
	let cls = "bg-slate-100 text-slate-600 border-slate-200";
	if (
		v.includes("rất cao") ||
		v.includes("nghiêm trọng") ||
		v.includes("đình chỉ") ||
		v.includes("ngừng")
	) {
		cls = "bg-red-50 text-red-700 border-red-200";
	} else if (v.includes("cao") || v.includes("đang xử lý") || v.includes("bảo trì")) {
		cls = "bg-amber-50 text-amber-700 border-amber-200";
	} else if (
		v.includes("đã giải quyết") ||
		v.includes("hoạt động") ||
		v.includes("bình thường") ||
		v.includes("thấp")
	) {
		cls = "bg-emerald-50 text-emerald-700 border-emerald-200";
	} else if (v.includes("mới")) {
		cls = "bg-sky-50 text-sky-700 border-sky-200";
	} else if (v.includes("báo động giả")) {
		cls = "bg-rose-50 text-rose-700 border-rose-200";
	} else if (v.includes("trung bình")) {
		cls = "bg-orange-50 text-orange-700 border-orange-200";
	}
	return (
		<span
			className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border whitespace-nowrap ${cls}`}>
			{value}
		</span>
	);
}

export default function DataCatalogModal({
	show,
	initialMenuId,
	onClose,
	data,
	hiddenLayers,
	setHiddenLayers,
	onLocateOnMap,
	onOpenAddForCategory,
	onOpenImportForMenu,
	onDeleteSingle,
	onBulkDelete,
	suspendOverlay = false,
	allowedCategories,
}: DataCatalogModalProps) {
	const visibleCategoryConfigs = useMemo(() => {
		if (Array.isArray(allowedCategories) && allowedCategories.length > 0) {
			return CATEGORY_CONFIGS.filter((c) => allowedCategories.includes(c.target));
		}
		return CATEGORY_CONFIGS;
	}, [allowedCategories]);

	const [activeTarget, setActiveTarget] = useState<CategoryTarget>(
		visibleCategoryConfigs[0]?.target || "vuviec-list",
	);
	const [viewMode, setViewMode] = useState<"table" | "grid">("table");
	const [searchText, setSearchText] = useState("");
	const [typeFilter, setTypeFilter] = useState("");
	const [statusFilter, setStatusFilter] = useState("");
	const [areaFilter, setAreaFilter] = useState("");
	const [creatorFilter, setCreatorFilter] = useState("");
	const [periodFilter, setPeriodFilter] = useState<"" | "today" | "month" | "quarter" | "year">(
		"",
	);
	const [dateFrom, setDateFrom] = useState("");
	const [dateTo, setDateTo] = useState("");
	const [sortField, setSortField] = useState<"title" | "type" | "status" | "date">("date");
	const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
	const [pageSize, setPageSize] = useState<number>(25);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [inspectedItem, setInspectedItem] = useState<any | null>(null);
	const [previewImageUrl, setPreviewImageUrl] = useState<{ src: string; caption: string } | null>(
		null,
	);

	// Sync initial category when opened from left dock or stats modal
	useEffect(() => {
		if (!show) return;
		if (initialMenuId) {
			const matched = visibleCategoryConfigs.find(
				(c) => c.menuId === initialMenuId || c.target === initialMenuId,
			);
			if (matched) {
				setActiveTarget(matched.target);
				return;
			}
		}
		if (!visibleCategoryConfigs.some((c) => c.target === activeTarget)) {
			setActiveTarget(visibleCategoryConfigs[0]?.target || "vuviec-list");
		}
	}, [show, initialMenuId, visibleCategoryConfigs]);

	// Reset filters, pagination & selection when switching category tab
	useEffect(() => {
		setTypeFilter("");
		setStatusFilter("");
		setAreaFilter("");
		setCreatorFilter("");
		setPeriodFilter("");
		setDateFrom("");
		setDateTo("");
		setCurrentPage(1);
		setSelectedIds(new Set());
		setInspectedItem(null);
	}, [activeTarget]);

	// Reset page to 1 when search/filter changes
	useEffect(() => {
		setCurrentPage(1);
	}, [
		searchText,
		typeFilter,
		statusFilter,
		areaFilter,
		creatorFilter,
		periodFilter,
		dateFrom,
		dateTo,
		pageSize,
	]);

	// Keyboard ESC handler
	useEffect(() => {
		if (!show || suspendOverlay) return;
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				if (inspectedItem) {
					setInspectedItem(null);
				} else {
					onClose();
				}
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [show, suspendOverlay, inspectedItem, onClose]);

	const activeConfig = useMemo(
		() =>
			visibleCategoryConfigs.find((c) => c.target === activeTarget) ||
			visibleCategoryConfigs[0] ||
			CATEGORY_CONFIGS[0],
		[activeTarget, visibleCategoryConfigs],
	);

	const getRawItemsForTarget = (target: CategoryTarget): any[] => {
		switch (target) {
			case "vuviec-list":
				return data.vuviec;
			case "camera-list":
				return data.camera;
			case "doituong-list":
				return data.doituong;
			case "coquan-list":
				return data.coquan;
			case "cskd-list":
				return data.cskd;
			case "diemnong-list":
				return data.diemnong;
			case "tuyenduong-list":
				return data.tuyenduong;
		}
	};

	const rawItems = getRawItemsForTarget(activeTarget);

	const totalSystemRecords = useMemo(() => {
		return (
			data.vuviec.length +
			data.camera.length +
			data.doituong.length +
			data.coquan.length +
			data.cskd.length +
			data.diemnong.length +
			data.tuyenduong.length
		);
	}, [data]);

	// Extract unique facet options dynamically for current category
	const uniqueTypes = useMemo(() => {
		const s = new Set<string>();
		rawItems.forEach((item) => {
			const val = activeTarget === "vuviec-list" ? item.loai : item.loai;
			if (val && String(val).trim()) s.add(String(val).trim());
		});
		return Array.from(s).sort((a, b) => a.localeCompare(b, "vi"));
	}, [rawItems, activeTarget]);

	const uniqueStatuses = useMemo(() => {
		const s = new Set<string>();
		rawItems.forEach((item) => {
			const val = getStatusOrSeverity(item, activeTarget);
			if (val && String(val).trim()) s.add(String(val).trim());
		});
		return Array.from(s).sort((a, b) => a.localeCompare(b, "vi"));
	}, [rawItems, activeTarget]);

	const uniqueAreas = useMemo(() => {
		const s = new Set<string>();
		rawItems.forEach((item) => {
			const val = String(item.diachi || item.xaphuong || item.chu_diachi || "").trim();
			if (val) s.add(val);
		});
		return Array.from(s).sort((a, b) => a.localeCompare(b, "vi"));
	}, [rawItems]);

	const uniqueCreators = useMemo(() => {
		const s = new Set<string>();
		rawItems.forEach((item) => {
			if (item.nguoi_tao && String(item.nguoi_tao).trim()) {
				s.add(String(item.nguoi_tao).trim());
			}
		});
		return Array.from(s).sort((a, b) => a.localeCompare(b, "vi"));
	}, [rawItems]);

	// Map suspect ID -> related incidents searchable text for cross-search (1.2.c)
	const suspectIncidentIndex = useMemo(() => {
		const map = new Map<string, string>();
		for (const vv of data.vuviec) {
			if (!Array.isArray(vv.suspectIds)) continue;
			const snippet = [vv.loai, vv.groupId, vv.diachi, vv.mota, vv.trangthai]
				.filter(Boolean)
				.join(" ");
			for (const sid of vv.suspectIds) {
				const key = String(sid);
				map.set(key, `${map.get(key) || ""} ${snippet}`);
			}
		}
		return map;
	}, [data.vuviec]);

	// Filtered + Sorted items (handles 1,000+ rows cleanly via useMemo)
	const processedItems = useMemo(() => {
		const q = searchText.trim().toLowerCase();
		const now = new Date();
		const curY = now.getFullYear();
		const curM = now.getMonth() + 1;
		const curD = now.getDate();
		const curQ = Math.floor(now.getMonth() / 3) + 1;
		const fromTime = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
		const toTime = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null;

		const filtered = rawItems.filter((item) => {
			if (typeFilter) {
				const matchesPrimary = String(item.loai || "").trim() === typeFilter;
				const matchesTag =
					Array.isArray(item.nhom_nhan) && item.nhom_nhan.includes(typeFilter);
				if (!matchesPrimary && !matchesTag) return false;
			}
			if (statusFilter) {
				if (getStatusOrSeverity(item, activeTarget).trim() !== statusFilter) return false;
			}
			if (areaFilter) {
				const itemArea = String(
					item.diachi || item.xaphuong || item.chu_diachi || "",
				).trim();
				if (itemArea !== areaFilter) return false;
			}
			if (creatorFilter) {
				if (String(item.nguoi_tao || "").trim() !== creatorFilter) return false;
			}
			if (periodFilter || fromTime !== null || toTime !== null) {
				const dt = parseFlexibleLocalDate(item.thoigian || item.ngay_tao, item.id);
				if (!dt) return false;
				if (periodFilter === "today") {
					if (
						dt.getFullYear() !== curY ||
						dt.getMonth() + 1 !== curM ||
						dt.getDate() !== curD
					)
						return false;
				} else if (periodFilter === "month") {
					if (dt.getFullYear() !== curY || dt.getMonth() + 1 !== curM) return false;
				} else if (periodFilter === "quarter") {
					const itemQ = Math.floor(dt.getMonth() / 3) + 1;
					if (dt.getFullYear() !== curY || itemQ !== curQ) return false;
				} else if (periodFilter === "year") {
					if (dt.getFullYear() !== curY) return false;
				}
				const t = dt.getTime();
				if (fromTime !== null && t < fromTime) return false;
				if (toTime !== null && t > toTime) return false;
			}
			if (q) {
				const relatedIncidentText =
					activeTarget === "doituong-list" && item.id !== undefined
						? suspectIncidentIndex.get(String(item.id)) || ""
						: "";
				const tagsText = Array.isArray(item.nhom_nhan) ? item.nhom_nhan.join(" ") : "";
				const historyText = Array.isArray(item.lich_su_hoat_dong)
					? item.lich_su_hoat_dong
							.map((h: any) => `${h.loai_su_kien || ""} ${h.noi_dung || ""}`)
							.join(" ")
					: "";
				const searchable = [
					item.ten,
					item.hoten,
					item.loai,
					tagsText,
					historyText,
					relatedIncidentText,
					item.diachi,
					item.xaphuong,
					item.mota,
					item.description,
					item.ketqua,
					item.groupId,
					item.cccd,
					item.sdt,
					item.chu_camera,
					item.sdt_chu,
					item.mst,
					item.chu_co_so,
					item.chu_sdt,
					item.quan_ly,
					item.trangthai,
					item.mucdo,
					item.nguoi_tao,
					item.nguoi_cap_nhat,
					item.lng !== undefined ? `${item.lng}, ${item.lat}` : "",
				]
					.filter(Boolean)
					.join(" ")
					.toLowerCase();
				if (!searchable.includes(q)) return false;
			}
			return true;
		});

		const sorted = [...filtered].sort((a, b) => {
			let cmp = 0;
			if (sortField === "title") {
				cmp = getPrimaryTitle(a, activeTarget).localeCompare(
					getPrimaryTitle(b, activeTarget),
					"vi",
				);
			} else if (sortField === "type") {
				cmp = String(a.loai || "").localeCompare(String(b.loai || ""), "vi");
			} else if (sortField === "status") {
				cmp = getStatusOrSeverity(a, activeTarget).localeCompare(
					getStatusOrSeverity(b, activeTarget),
					"vi",
				);
			} else {
				const da = parseFlexibleLocalDate(a.thoigian || a.ngay_tao, a.id)?.getTime() ?? 0;
				const db = parseFlexibleLocalDate(b.thoigian || b.ngay_tao, b.id)?.getTime() ?? 0;
				cmp = da - db;
			}
			return sortDir === "asc" ? cmp : -cmp;
		});

		return sorted;
	}, [
		rawItems,
		activeTarget,
		searchText,
		typeFilter,
		statusFilter,
		areaFilter,
		creatorFilter,
		periodFilter,
		dateFrom,
		dateTo,
		sortField,
		sortDir,
		suspectIncidentIndex,
	]);

	const totalPages = Math.max(1, Math.ceil(processedItems.length / pageSize));
	const safePage = Math.min(currentPage, totalPages);
	const pageStartIdx = (safePage - 1) * pageSize;
	const paginatedItems = useMemo(
		() => processedItems.slice(pageStartIdx, pageStartIdx + pageSize),
		[processedItems, pageStartIdx, pageSize],
	);

	// Keep inspected item synchronized when edited
	useEffect(() => {
		if (!inspectedItem) return;
		const keyStr = String(getRecordKey(inspectedItem, activeTarget));
		const updated = rawItems.find((it) => String(getRecordKey(it, activeTarget)) === keyStr);
		if (updated) {
			setInspectedItem(updated);
		} else {
			setInspectedItem(null);
		}
	}, [rawItems, activeTarget]);

	// Build compact page number list (MUST be declared before early return!)
	const pageNumbers = useMemo(() => {
		const pages: (number | "ellipsis")[] = [];
		if (totalPages <= 7) {
			for (let i = 1; i <= totalPages; i++) pages.push(i);
		} else {
			pages.push(1);
			if (safePage > 3) pages.push("ellipsis");
			for (
				let i = Math.max(2, safePage - 1);
				i <= Math.min(totalPages - 1, safePage + 1);
				i++
			) {
				pages.push(i);
			}
			if (safePage < totalPages - 2) pages.push("ellipsis");
			pages.push(totalPages);
		}
		return pages;
	}, [totalPages, safePage]);

	if (!show || suspendOverlay) return null;

	const isLayerHidden = hiddenLayers.includes(activeTarget);
	const hasActiveFilters = Boolean(
		searchText ||
		typeFilter ||
		statusFilter ||
		areaFilter ||
		creatorFilter ||
		periodFilter ||
		dateFrom ||
		dateTo,
	);

	const toggleSort = (field: "title" | "type" | "status" | "date") => {
		if (sortField === field) {
			setSortDir((d) => (d === "asc" ? "desc" : "asc"));
		} else {
			setSortField(field);
			setSortDir(field === "date" ? "desc" : "asc");
		}
	};

	const renderSortIcon = (field: "title" | "type" | "status" | "date") => {
		if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-slate-300" />;
		return sortDir === "asc" ? (
			<ArrowUp className="w-3 h-3 text-sky-600" />
		) : (
			<ArrowDown className="w-3 h-3 text-sky-600" />
		);
	};

	const triggerEditItem = (item: any) => {
		switch (activeTarget) {
			case "vuviec-list":
				window.dispatchEvent(new CustomEvent("edit-incident", { detail: item }));
				break;
			case "camera-list":
				window.dispatchEvent(new CustomEvent("edit-camera", { detail: item }));
				break;
			case "doituong-list":
				window.dispatchEvent(new CustomEvent("edit-doituong", { detail: item }));
				break;
			case "coquan-list":
				window.dispatchEvent(
					new CustomEvent("edit-coquan", { detail: { ...item, _originalTen: item.ten } }),
				);
				break;
			case "cskd-list":
				window.dispatchEvent(
					new CustomEvent("edit-cskd", { detail: { ...item, _originalTen: item.ten } }),
				);
				break;
			case "diemnong-list":
				window.dispatchEvent(
					new CustomEvent("edit-diemnong", {
						detail: { ...item, _originalTen: item.ten },
					}),
				);
				break;
			case "tuyenduong-list":
				window.dispatchEvent(
					new CustomEvent("edit-tuyenduong", {
						detail: { ...item, _originalTen: item.ten },
					}),
				);
				break;
		}
	};

	const handleConfirmDeleteSingle = async (item: any) => {
		const title = getPrimaryTitle(item, activeTarget);
		const ok = await appConfirm(
			`Bạn có chắc chắn muốn xóa bản ghi "${title}" khỏi danh mục ${activeConfig.shortTitle}?`,
			{ confirmText: "Xóa", cancelText: "Hủy", danger: true },
		);
		if (ok) {
			const key = getRecordKey(item, activeTarget);
			onDeleteSingle(key, activeTarget);
			setSelectedIds((prev) => {
				const next = new Set(prev);
				next.delete(String(key));
				return next;
			});
		}
	};

	const handleConfirmBulkDelete = async () => {
		if (selectedIds.size === 0) return;
		const ok = await appConfirm(
			`Xác nhận xóa vĩnh viễn ${selectedIds.size} bản ghi đã chọn trong danh mục "${activeConfig.shortTitle}"?`,
			{ confirmText: "Xóa vĩnh viễn", cancelText: "Hủy", danger: true },
		);
		if (ok) {
			onBulkDelete(Array.from(selectedIds), activeTarget);
			setSelectedIds(new Set());
		}
	};

	const toggleRowSelection = (keyStr: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(keyStr)) next.delete(keyStr);
			else next.add(keyStr);
			return next;
		});
	};

	const allPageSelected =
		paginatedItems.length > 0 &&
		paginatedItems.every((it) => selectedIds.has(String(getRecordKey(it, activeTarget))));

	const toggleSelectPage = () => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (allPageSelected) {
				paginatedItems.forEach((it) => next.delete(String(getRecordKey(it, activeTarget))));
			} else {
				paginatedItems.forEach((it) => next.add(String(getRecordKey(it, activeTarget))));
			}
			return next;
		});
	};

	const handleExportExcel = (onlySelected = false) => {
		const sourceList = onlySelected
			? processedItems.filter((it) => selectedIds.has(String(getRecordKey(it, activeTarget))))
			: processedItems;

		if (sourceList.length === 0) return;

		const rows = sourceList.map((item, idx) => {
			const auditCols = {
				"Người tạo": item.nguoi_tao || "",
				"Người cập nhật cuối": item.nguoi_cap_nhat || "",
			};
			if (activeTarget === "vuviec-list") {
				return {
					STT: idx + 1,
					"Tên vụ việc": item.loai || "",
					"Trạng thái": item.trangthai || "",
					"Thời gian": item.thoigian ? formatDate(item.thoigian) : "",
					"Địa chỉ": item.diachi || "",
					"Kết quả": item.ketqua || "",
					"Group ID": item.groupId || "",
					"Mô tả": item.mota || "",
					"Kinh độ": item.lng,
					"Vĩ độ": item.lat,
					"Ngày tạo": item.ngay_tao ? formatDate(item.ngay_tao) : "",
					...auditCols,
				};
			}
			if (activeTarget === "camera-list") {
				return {
					STT: idx + 1,
					"Tên camera": item.ten || "",
					"Chủ sở hữu": item.chu_camera || "",
					"Số điện thoại": item.sdt_chu || "",
					"Địa chỉ": item.diachi || "",
					"Trạng thái": item.trangthai || "Hoạt động",
					"Mô tả": item.description || "",
					"Kinh độ": item.lng,
					"Vĩ độ": item.lat,
					"Ngày tạo": item.ngay_tao ? formatDate(item.ngay_tao) : "",
					...auditCols,
				};
			}
			if (activeTarget === "doituong-list") {
				return {
					STT: idx + 1,
					"Họ và tên": item.hoten || "",
					"Loại đối tượng": item.loai || "",
					"Nhãn theo dõi": Array.isArray(item.nhom_nhan) ? item.nhom_nhan.join(", ") : "",
					"Số CCCD": item.cccd || "",
					"Số điện thoại": item.sdt || "",
					"Địa chỉ": item.diachi || "",
					"Số tiền án/lịch sử": Array.isArray(item.lich_su_hoat_dong)
						? item.lich_su_hoat_dong.length
						: 0,
					"Mô tả": item.mota || "",
					"Kinh độ": item.lng,
					"Vĩ độ": item.lat,
					"Ngày tạo": item.ngay_tao ? formatDate(item.ngay_tao) : "",
					...auditCols,
				};
			}
			if (activeTarget === "cskd-list") {
				return {
					STT: idx + 1,
					"Tên cơ sở": item.ten || "",
					"Mã số thuế": item.mst || "",
					"Loại hình kinh doanh": item.loai_hinh_kd || "",
					"Ngành nghề chính": item.loai || "",
					"Trạng thái hoạt động": item.trangthai || "",
					"Giấy phép ANTT": item.giay_phep_antt?.so_giay_phep
						? `${item.giay_phep_antt.so_giay_phep} (${item.giay_phep_antt.trang_thai || ""})`
						: "",
					"Giấy phép PCCC": item.giay_phep_pccc?.so_giay_phep
						? `${item.giay_phep_pccc.so_giay_phep} (${item.giay_phep_pccc.trang_thai || ""})`
						: "",
					"Số đợt kiểm tra": Array.isArray(item.lich_su_kiem_tra)
						? item.lich_su_kiem_tra.length
						: 0,
					"Giấy phép liên quan": item.giay_phep || "",
					"Họ tên chủ": item.chu_co_so || "",
					"Ngày sinh chủ": item.chu_ngaysinh || "",
					"CCCD chủ": item.chu_cccd || "",
					"SĐT chủ": item.chu_sdt || "",
					"Địa chỉ chủ": item.chu_diachi || "",
					"Họ tên quản lý": item.quan_ly || "",
					"Ngày sinh quản lý": item.quan_ly_ngaysinh || "",
					"CCCD quản lý": item.quan_ly_cccd || "",
					"SĐT quản lý": item.quan_ly_sdt || "",
					"Địa chỉ quản lý": item.quan_ly_diachi || "",
					"Kinh độ": item.lng,
					"Vĩ độ": item.lat,
					"Ngày tạo": item.ngay_tao ? formatDate(String(item.ngay_tao)) : "",
					...auditCols,
				};
			}
			if (activeTarget === "diemnong-list") {
				return {
					STT: idx + 1,
					"Tên điểm nóng": item.ten || "",
					"Phân loại": item.loai || "",
					"Mức độ cảnh báo": item.mucdo || "",
					"Địa bàn": item.xaphuong || "",
					"Bán kính ảnh hưởng (mét)": item.radius ?? 300,
					"Mô tả tình hình": item.mota || "",
					"Kinh độ": item.lng,
					"Vĩ độ": item.lat,
					"Ngày tạo": item.ngay_tao ? formatDate(String(item.ngay_tao)) : "",
					...auditCols,
				};
			}
			if (activeTarget === "coquan-list") {
				return {
					STT: idx + 1,
					"Tên cơ quan": item.ten || "",
					"Phân loại": item.loai || "",
					"Địa bàn": item.xaphuong || "",
					"Kinh độ": item.lng,
					"Vĩ độ": item.lat,
					"Ngày tạo": item.ngay_tao ? formatDate(String(item.ngay_tao)) : "",
					...auditCols,
				};
			}
			const startLng = item.lng !== undefined ? item.lng : (item.coordinates?.[0]?.[0] ?? "");
			const startLat = item.lat !== undefined ? item.lat : (item.coordinates?.[0]?.[1] ?? "");
			const coordTrail = Array.isArray(item.coordinates)
				? item.coordinates
						.map((pair: [number, number]) => `${pair[0]},${pair[1]}`)
						.join(" ; ")
				: "";
			return {
				STT: idx + 1,
				"Tên tuyến đường": item.ten || "",
				"Phân loại": item.loai || "",
				"Kiểu hình học": item.type === "line" ? "Tuyến vẽ" : "Điểm chốt",
				"Mức độ cảnh báo": item.mucdo || "",
				"Kinh độ": startLng,
				"Vĩ độ": startLat,
				"Danh sách tọa độ tuyến": coordTrail,
				"Ngày tạo": item.ngay_tao ? formatDate(String(item.ngay_tao)) : "",
				...auditCols,
			};
		});

		const ws = XLSX.utils.json_to_sheet(rows);
		if (rows.length > 0) {
			ws["!cols"] = Object.keys(rows[0]).map((key) => ({
				wch: Math.max(key.length + 6, 20),
			}));
		}
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, activeConfig.shortTitle);
		const fileName = `DanhMuc_${activeConfig.shortTitle.replace(/\s+/g, "_")}_${getLocalDateStr()}.xlsx`;
		XLSX.writeFile(wb, fileName);

		authService.logAction({
			eventType: "SYSTEM_ACTION",
			status: "info",
			category: activeTarget,
			message: `Xuất tệp Excel "${fileName}" (${sourceList.length} bản ghi ${getCategoryDisplayName(activeTarget)})`,
		});
	};

	const toggleLayerVisibility = () => {
		authService.logAction({
			eventType: "SYSTEM_ACTION",
			status: "info",
			category: activeTarget,
			targetName: activeConfig.shortTitle,
			message: isLayerHidden
				? `Bật hiển thị lớp "${activeConfig.shortTitle}" trên bản đồ`
				: `Tạm ẩn lớp "${activeConfig.shortTitle}" khỏi bản đồ`,
		});
		setHiddenLayers((prev) =>
			isLayerHidden ? prev.filter((id) => id !== activeTarget) : [...prev, activeTarget],
		);
	};

	return (
		<div className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm z-[1600] flex items-center justify-center p-2 sm:p-4">
			<motion.div
				initial={{ opacity: 0, scale: 0.97, y: 12 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.97, y: 12 }}
				transition={{ duration: 0.18 }}
				className="bg-white/95 backdrop-blur-xl rounded-[28px] w-[96vw] max-w-[1680px] h-[94vh] shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden relative">
				{/* TOP WORKSPACE HEADER */}
				<div className="px-6 py-4 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 shrink-0">
					<div className="flex items-center gap-3.5">
						<div
							className={`w-11 h-11 rounded-2xl ${activeConfig.accentBg} ${activeConfig.accentText} border ${activeConfig.accentBorder} flex items-center justify-center shadow-xs`}>
							{renderCategoryIcon(activeTarget, "w-5 h-5")}
						</div>
						<div>
							<div className="flex items-center gap-2.5">
								<h2 className="text-base font-extrabold text-slate-800 tracking-tight uppercase">
									{activeConfig.title}
								</h2>
								<span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-slate-100 text-slate-700 font-mono">
									{rawItems.length.toLocaleString("vi-VN")} bản ghi
								</span>
							</div>
							<p className="text-[11px] text-slate-500 font-medium mt-0.5">
								Trung tâm quản trị dữ liệu GIS Phường Bình Minh • Tổng toàn hệ
								thống:{" "}
								<strong className="text-slate-700 font-mono">
									{totalSystemRecords.toLocaleString("vi-VN")}
								</strong>{" "}
								đối tượng
							</p>
						</div>
					</div>

					{/* Primary Header Actions */}
					<div className="flex flex-wrap items-center gap-2">
						<button
							type="button"
							onClick={toggleLayerVisibility}
							className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
								isLayerHidden
									? "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700"
									: "bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100"
							}`}
							title="Bật hoặc ẩn lớp dữ liệu này trên bản đồ nền">
							{isLayerHidden ? (
								<>
									<EyeOff className="w-3.5 h-3.5" />
									<span>Đang ẩn trên bản đồ</span>
								</>
							) : (
								<>
									<Eye className="w-3.5 h-3.5" />
									<span>Hiển thị trên bản đồ</span>
								</>
							)}
						</button>

						{activeConfig.supportsImport && (
							<button
								type="button"
								onClick={() => onOpenImportForMenu(activeConfig.menuId)}
								className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-all cursor-pointer">
								<UploadCloud className="w-3.5 h-3.5" />
								<span>Nhập Excel</span>
							</button>
						)}

						<button
							type="button"
							onClick={() => handleExportExcel(false)}
							disabled={processedItems.length === 0}
							className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer">
							<Download className="w-3.5 h-3.5 text-slate-500" />
							<span>Xuất Excel</span>
						</button>

						<button
							type="button"
							onClick={() => onOpenAddForCategory(activeTarget)}
							className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-sm shadow-sky-200 transition-all cursor-pointer">
							<Plus className="w-4 h-4" />
							<span>Thêm mới</span>
						</button>

						<div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

						<button
							type="button"
							onClick={onClose}
							className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
							title="Đóng bảng (ESC)">
							<X className="w-4 h-4" />
						</button>
					</div>
				</div>

				{/* CATEGORY SEGMENTED RAIL */}
				<div className="px-6 py-2.5 bg-slate-50/80 border-b border-slate-200/70 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
					{visibleCategoryConfigs.map((cat) => {
						const count = getRawItemsForTarget(cat.target).length;
						const isActive = cat.target === activeTarget;
						const hidden = hiddenLayers.includes(cat.target);
						return (
							<button
								key={cat.target}
								type="button"
								onClick={() => setActiveTarget(cat.target)}
								className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
									isActive
										? `${cat.activePill} border-transparent`
										: "bg-white hover:bg-slate-100/80 text-slate-600 border-slate-200/80"
								}`}>
								{renderCategoryIcon(cat.target, "w-3.5 h-3.5")}
								<span>{cat.shortTitle}</span>
								<span
									className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-extrabold ${
										isActive
											? "bg-white/20 text-white"
											: "bg-slate-100 text-slate-600"
									}`}>
									{count}
								</span>
								{hidden && (
									<EyeOff
										className={`w-3 h-3 ${isActive ? "text-white/75" : "text-slate-400"}`}
									/>
								)}
							</button>
						);
					})}
				</div>

				{/* SEARCH, MULTI-FILTER & VIEW SWITCHER BAR */}
				<div className="px-6 py-3 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
					<div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
						{/* Instant Search */}
						<div className="relative flex-1 min-w-[240px] max-w-md">
							<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
							<input
								type="text"
								value={searchText}
								onChange={(e) => setSearchText(e.target.value)}
								placeholder={`Tìm nhanh trong ${rawItems.length} hồ sơ ${activeConfig.shortTitle.toLowerCase()} (tên, địa chỉ, CCCD, SĐT, MST...)`}
								className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-sky-500 rounded-xl py-2 pl-9 pr-8 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-sky-500/15 transition-all font-medium"
							/>
							{searchText && (
								<button
									type="button"
									onClick={() => setSearchText("")}
									className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer">
									<X className="w-3.5 h-3.5" />
								</button>
							)}
						</div>

						{/* Dynamic Type Filter */}
						{uniqueTypes.length > 0 && (
							<select
								value={typeFilter}
								onChange={(e) => setTypeFilter(e.target.value)}
								className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-sky-500 cursor-pointer max-w-[200px]">
								<option value="">Tất cả phân loại ({uniqueTypes.length})</option>
								{uniqueTypes.map((t) => (
									<option key={t} value={t}>
										{t}
									</option>
								))}
							</select>
						)}

						{/* Dynamic Status / Severity Filter */}
						{uniqueStatuses.length > 0 && (
							<select
								value={statusFilter}
								onChange={(e) => setStatusFilter(e.target.value)}
								className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-sky-500 cursor-pointer">
								<option value="">
									{activeTarget === "diemnong-list" ||
									activeTarget === "tuyenduong-list"
										? "Mọi mức cảnh báo"
										: "Mọi trạng thái"}
								</option>
								{uniqueStatuses.map((st) => (
									<option key={st} value={st}>
										{st}
									</option>
								))}
							</select>
						)}

						{/* Dynamic Area / Khu vực Filter (1.2.b) */}
						{uniqueAreas.length > 0 && (
							<select
								value={areaFilter}
								onChange={(e) => setAreaFilter(e.target.value)}
								className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-sky-500 cursor-pointer max-w-[200px]">
								<option value="">Mọi khu vực ({uniqueAreas.length})</option>
								{uniqueAreas.map((area) => (
									<option key={area} value={area}>
										{area}
									</option>
								))}
							</select>
						)}

						{/* Dynamic Creator Filter */}
						{uniqueCreators.length > 0 && (
							<select
								value={creatorFilter}
								onChange={(e) => setCreatorFilter(e.target.value)}
								className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-sky-500 cursor-pointer max-w-[200px]">
								<option value="">
									Mọi tài khoản tạo ({uniqueCreators.length})
								</option>
								{uniqueCreators.map((creator) => (
									<option key={creator} value={creator}>
										Người tạo: {creator}
									</option>
								))}
							</select>
						)}

						{/* Time Period Filter */}
						<div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 gap-1.5">
							<Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
							<select
								value={periodFilter}
								onChange={(e) => setPeriodFilter(e.target.value as any)}
								className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer">
								<option value="">Toàn thời gian</option>
								<option value="today">Hôm nay</option>
								<option value="month">Tháng này</option>
								<option value="quarter">Quý này</option>
								<option value="year">Năm nay</option>
							</select>
						</div>

						{/* Custom Date Range Filter (Từ ngày - Đến ngày) (1.2.b) */}
						<div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
							<span className="text-[10px] font-bold text-slate-400 uppercase">
								Từ
							</span>
							<input
								type="date"
								value={dateFrom}
								onChange={(e) => setDateFrom(e.target.value)}
								className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
								title="Lọc từ ngày"
							/>
							<span className="text-[10px] font-bold text-slate-400 uppercase">
								Đến
							</span>
							<input
								type="date"
								value={dateTo}
								onChange={(e) => setDateTo(e.target.value)}
								className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
								title="Lọc đến ngày"
							/>
						</div>

						{hasActiveFilters && (
							<button
								type="button"
								onClick={() => {
									setSearchText("");
									setTypeFilter("");
									setStatusFilter("");
									setAreaFilter("");
									setCreatorFilter("");
									setPeriodFilter("");
									setDateFrom("");
									setDateTo("");
								}}
								className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer">
								<FilterX className="w-3.5 h-3.5" />
								<span>Xóa lọc</span>
							</button>
						)}
					</div>

					{/* Right View Switcher */}
					<div className="flex items-center gap-2">
						<span className="text-[11px] font-semibold text-slate-500 hidden lg:inline">
							Kết quả:{" "}
							<strong className="text-slate-800 font-mono">
								{processedItems.length.toLocaleString("vi-VN")}
							</strong>
						</span>
						<div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/70">
							<button
								type="button"
								onClick={() => setViewMode("table")}
								className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
									viewMode === "table"
										? "bg-white text-sky-600 shadow-xs"
										: "text-slate-500 hover:text-slate-700"
								}`}
								title="Chế độ Bảng dữ liệu mật độ cao">
								<Table2 className="w-3.5 h-3.5" />
								<span className="hidden sm:inline">Bảng</span>
							</button>
							<button
								type="button"
								onClick={() => setViewMode("grid")}
								className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
									viewMode === "grid"
										? "bg-white text-sky-600 shadow-xs"
										: "text-slate-500 hover:text-slate-700"
								}`}
								title="Chế độ Thẻ lưới trực quan">
								<LayoutGrid className="w-3.5 h-3.5" />
								<span className="hidden sm:inline">Thẻ lưới</span>
							</button>
						</div>
					</div>
				</div>

				{/* MAIN WORKSPACE BODY + INLINE SLIDE-OVER INSPECTOR */}
				<div className="flex-1 flex min-h-0 bg-slate-50/40 relative overflow-hidden">
					{/* DATA TABLE OR BENTO GRID */}
					<div className="flex-1 overflow-auto custom-scrollbar">
						{processedItems.length === 0 ? (
							<div className="h-full min-h-[320px] flex flex-col items-center justify-center p-8 text-center">
								<div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
									<Layers className="w-7 h-7" />
								</div>
								<h3 className="text-sm font-bold text-slate-700">
									{hasActiveFilters
										? "Không tìm thấy bản ghi phù hợp với bộ lọc"
										: `Danh mục ${activeConfig.shortTitle} chưa có dữ liệu`}
								</h3>
								<p className="text-xs text-slate-400 mt-1 max-w-md">
									{hasActiveFilters
										? "Hãy thử từ khóa khác hoặc bấm Xóa lọc để xem toàn bộ danh sách."
										: "Bạn có thể thêm mới trực tiếp hoặc nhập hàng loạt từ tệp Excel mẫu."}
								</p>
								<div className="flex items-center gap-2 mt-4">
									{hasActiveFilters ? (
										<button
											type="button"
											onClick={() => {
												setSearchText("");
												setTypeFilter("");
												setStatusFilter("");
												setAreaFilter("");
												setCreatorFilter("");
												setPeriodFilter("");
												setDateFrom("");
												setDateTo("");
											}}
											className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-white hover:bg-slate-900 cursor-pointer">
											Đặt lại bộ lọc
										</button>
									) : (
										<button
											type="button"
											onClick={() => onOpenAddForCategory(activeTarget)}
											className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 text-white hover:bg-sky-700 cursor-pointer">
											<Plus className="w-4 h-4" />
											<span>Thêm bản ghi đầu tiên</span>
										</button>
									)}
								</div>
							</div>
						) : viewMode === "table" ? (
							<table className="w-full text-left border-collapse">
								<thead className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-md border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider select-none">
									<tr>
										<th className="py-3 pl-6 pr-2 w-10">
											<button
												type="button"
												onClick={toggleSelectPage}
												className="text-slate-400 hover:text-sky-600 flex items-center cursor-pointer"
												title="Chọn / Bỏ chọn trang hiện tại">
												{allPageSelected ? (
													<CheckSquare className="w-4 h-4 text-sky-600" />
												) : (
													<Square className="w-4 h-4" />
												)}
											</button>
										</th>
										<th className="py-3 px-2 w-14 text-center">STT</th>
										<th
											onClick={() => toggleSort("title")}
											className="py-3 px-3 cursor-pointer hover:text-slate-800 transition-colors">
											<div className="inline-flex items-center gap-1.5">
												<span>
													{activeTarget === "doituong-list"
														? "Họ và tên"
														: activeTarget === "vuviec-list"
															? "Vụ việc / Sự kiện"
															: "Tên đối tượng"}
												</span>
												{renderSortIcon("title")}
											</div>
										</th>
										<th
											onClick={() => toggleSort("type")}
											className="py-3 px-3 cursor-pointer hover:text-slate-800 transition-colors">
											<div className="inline-flex items-center gap-1.5">
												<span>
													{activeTarget === "camera-list"
														? "Chủ sở hữu & Liên hệ"
														: activeTarget === "cskd-list"
															? "Ngành nghề & Chủ cơ sở"
															: activeTarget === "doituong-list"
																? "Định danh (CCCD / SĐT)"
																: "Phân loại / Nhóm"}
												</span>
												{renderSortIcon("type")}
											</div>
										</th>
										<th className="py-3 px-3">
											{activeTarget === "tuyenduong-list"
												? "Kiểu & Lộ trình"
												: "Địa chỉ / Khu vực"}
										</th>
										<th
											onClick={() => toggleSort("status")}
											className="py-3 px-3 cursor-pointer hover:text-slate-800 transition-colors">
											<div className="inline-flex items-center gap-1.5">
												<span>
													{activeTarget === "doituong-list"
														? "Diện quản lý"
														: activeTarget === "coquan-list"
															? "Tọa độ"
															: "Trạng thái / Mức độ"}
												</span>
												{renderSortIcon("status")}
											</div>
										</th>
										<th
											onClick={() => toggleSort("date")}
											className="py-3 px-3 cursor-pointer hover:text-slate-800 transition-colors">
											<div className="inline-flex items-center gap-1.5">
												<span>
													{activeTarget === "vuviec-list"
														? "Thời gian xảy ra"
														: "Ngày cập nhật"}
												</span>
												{renderSortIcon("date")}
											</div>
										</th>
										<th className="py-3 px-3">Người tạo</th>
										<th className="py-3 pl-3 pr-6 text-right w-40">Thao tác</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100 bg-white text-xs">
									{paginatedItems.map((item, idx) => {
										const recordKey = getRecordKey(item, activeTarget);
										const keyStr = String(recordKey);
										const isSelected = selectedIds.has(keyStr);
										const isInspected =
											inspectedItem &&
											String(getRecordKey(inspectedItem, activeTarget)) ===
												keyStr;
										const title = getPrimaryTitle(item, activeTarget);
										const rowNumber = pageStartIdx + idx + 1;

										return (
											<tr
												key={`${keyStr}-${idx}`}
												onClick={() => setInspectedItem(item)}
												className={`group transition-colors cursor-pointer ${
													isInspected
														? "bg-sky-50/80"
														: isSelected
															? "bg-sky-50/40"
															: "hover:bg-slate-50/90"
												}`}>
												{/* Checkbox */}
												<td
													className="py-3 pl-6 pr-2"
													onClick={(e) => {
														e.stopPropagation();
														toggleRowSelection(keyStr);
													}}>
													{isSelected ? (
														<CheckSquare className="w-4 h-4 text-sky-600" />
													) : (
														<Square className="w-4 h-4 text-slate-300 group-hover:text-slate-400" />
													)}
												</td>

												{/* STT */}
												<td className="py-3 px-2 text-center font-mono text-[11px] font-bold text-slate-400">
													{String(rowNumber).padStart(2, "0")}
												</td>

												{/* Column 1: Primary Title & Sub-caption */}
												<td className="py-3 px-3 max-w-[280px]">
													<div className="flex items-center gap-2.5 min-w-0">
														{item.hinh_anh && (
															<img
																src={item.hinh_anh}
																alt={title}
																className="w-9 h-9 rounded-xl object-cover border border-cyan-200 shrink-0"
															/>
														)}
														<div className="min-w-0 flex-1">
															<div className="font-bold text-slate-800 group-hover:text-sky-700 truncate">
																{title}
															</div>
															{(item.mota ||
																item.description ||
																item.mst ||
																item.groupId) && (
																<div className="text-[11px] text-slate-400 truncate mt-0.5">
																	{activeTarget === "cskd-list" &&
																	item.mst
																		? `MST: ${item.mst}`
																		: item.groupId
																			? `Nhóm: ${item.groupId}${item.mota ? ` • ${item.mota}` : ""}`
																			: item.mota ||
																				item.description}
																</div>
															)}
														</div>
													</div>
												</td>

												{/* Column 2: Contextual Info */}
												<td className="py-3 px-3 max-w-[230px]">
													{activeTarget === "camera-list" ? (
														<div>
															<div className="font-semibold text-slate-700 truncate">
																{item.chu_camera ||
																	"Công cộng / Phường"}
															</div>
															{item.sdt_chu && (
																<div className="text-[11px] font-mono text-slate-500">
																	{item.sdt_chu}
																</div>
															)}
														</div>
													) : activeTarget === "cskd-list" ? (
														<div>
															<div className="font-semibold text-slate-700 truncate">
																{item.loai ||
																	item.loai_hinh_kd ||
																	"—"}
															</div>
															{item.chu_co_so && (
																<div className="text-[11px] text-slate-500 truncate">
																	Chủ: {item.chu_co_so}
																	{item.chu_sdt
																		? ` (${item.chu_sdt})`
																		: ""}
																</div>
															)}
														</div>
													) : activeTarget === "doituong-list" ? (
														<div className="space-y-0.5 font-mono text-[11px]">
															<div className="text-slate-700 font-semibold">
																{item.cccd
																	? `CCCD: ${item.cccd}`
																	: "Chưa cập nhật CCCD"}
															</div>
															{item.sdt && (
																<div className="text-emerald-700">
																	SĐT: {item.sdt}
																</div>
															)}
														</div>
													) : (
														<span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px] max-w-full truncate">
															{item.loai ||
																item.groupId ||
																"Chưa phân loại"}
														</span>
													)}
												</td>

												{/* Column 3: Address / Geometry / Area */}
												<td className="py-3 px-3 max-w-[250px]">
													{activeTarget === "tuyenduong-list" ? (
														<div className="text-slate-600">
															<span className="font-semibold">
																{item.type === "line"
																	? `Tuyến vẽ (${item.coordinates?.length || 0} điểm)`
																	: "Điểm chốt tuần tra"}
															</span>
														</div>
													) : (
														<div>
															<div className="text-slate-700 truncate font-medium">
																{item.diachi ||
																	item.xaphuong ||
																	item.chu_diachi ||
																	"Phường Bình Minh"}
															</div>
															{formatCoordPair(
																item.lat,
																item.lng,
																5,
															) && (
																<div className="text-[10px] font-mono text-slate-400 mt-0.5">
																	{formatCoordPair(
																		item.lat,
																		item.lng,
																		5,
																	)}
																	{activeTarget ===
																		"diemnong-list" &&
																	item.radius
																		? ` • R=${item.radius}m`
																		: ""}
																</div>
															)}
														</div>
													)}
												</td>

												{/* Column 4: Status / Severity / Classification */}
												<td className="py-3 px-3">
													{activeTarget === "doituong-list" ? (
														<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
															{item.loai || "Theo dõi"}
														</span>
													) : activeTarget === "coquan-list" ? (
														<span className="font-mono text-[11px] text-slate-500">
															{formatCoordPair(
																item.lat,
																item.lng,
																4,
															) || "—"}
														</span>
													) : (
														renderStatusBadge(
															getStatusOrSeverity(item, activeTarget),
														)
													)}
												</td>

												{/* Column 5: Date */}
												<td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
													{item.thoigian
														? formatDate(item.thoigian)
														: item.ngay_tao
															? formatDate(item.ngay_tao)
															: "—"}
												</td>

												{/* Column 5b: Creator / Editor Attribution */}
												<td className="py-3 px-3 whitespace-nowrap">
													{item.nguoi_tao ? (
														<div className="space-y-0.5">
															<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] font-bold">
																<User className="w-3 h-3 text-sky-600 shrink-0" />
																{item.nguoi_tao}
															</span>
															{item.nguoi_cap_nhat &&
																item.nguoi_cap_nhat !==
																	item.nguoi_tao && (
																	<div className="text-[10px] text-slate-400 font-mono">
																		Sửa: {item.nguoi_cap_nhat}
																	</div>
																)}
														</div>
													) : (
														<span className="text-slate-300 text-[11px]">
															—
														</span>
													)}
												</td>

												{/* Column 6: Quick Actions */}
												<td
													className="py-3 pl-3 pr-6 text-right whitespace-nowrap"
													onClick={(e) => e.stopPropagation()}>
													<div className="inline-flex items-center justify-end gap-1">
														<button
															type="button"
															onClick={() =>
																onLocateOnMap(item, activeTarget)
															}
															className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-600 text-sky-700 hover:text-white font-bold text-[11px] transition-colors cursor-pointer"
															title="Bay tới vị trí trên bản đồ & mở hồ sơ">
															<LocateFixed className="w-3.5 h-3.5" />
															<span className="hidden xl:inline">
																Định vị
															</span>
														</button>
														<button
															type="button"
															onClick={() => triggerEditItem(item)}
															className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
															title="Chỉnh sửa thông tin">
															<Pencil className="w-3.5 h-3.5" />
														</button>
														<button
															type="button"
															onClick={() =>
																handleConfirmDeleteSingle(item)
															}
															className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
															title="Xóa bản ghi">
															<Trash2 className="w-3.5 h-3.5" />
														</button>
													</div>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						) : (
							/* MODERN BENTO CARD GRID VIEW */
							<div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
								{paginatedItems.map((item, idx) => {
									const recordKey = getRecordKey(item, activeTarget);
									const keyStr = String(recordKey);
									const title = getPrimaryTitle(item, activeTarget);
									const statusText = getStatusOrSeverity(item, activeTarget);
									return (
										<div
											key={`${keyStr}-${idx}`}
											onClick={() => setInspectedItem(item)}
											className="group bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-sky-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3 cursor-pointer">
											<div>
												<div className="flex items-start justify-between gap-2">
													<div className="flex items-center gap-2.5 min-w-0">
														{item.hinh_anh ? (
															<img
																src={item.hinh_anh}
																alt={title}
																className="w-10 h-10 rounded-xl object-cover border border-cyan-200 shrink-0"
															/>
														) : (
															<div
																className={`w-8 h-8 rounded-xl ${activeConfig.accentBg} ${activeConfig.accentText} flex items-center justify-center shrink-0`}>
																{renderCategoryIcon(
																	activeTarget,
																	"w-4 h-4",
																)}
															</div>
														)}
														<div className="min-w-0">
															<h4 className="text-xs font-bold text-slate-800 group-hover:text-sky-700 truncate">
																{title}
															</h4>
															<p className="text-[11px] text-slate-500 truncate">
																{item.loai ||
																	item.chu_camera ||
																	item.chu_co_so ||
																	activeConfig.shortTitle}
															</p>
														</div>
													</div>
													{statusText && renderStatusBadge(statusText)}
												</div>

												<div className="mt-3 space-y-1 text-[11px] text-slate-600">
													{(item.diachi || item.xaphuong) && (
														<div className="flex items-center gap-1.5 truncate">
															<MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
															<span className="truncate">
																{item.diachi || item.xaphuong}
															</span>
														</div>
													)}
													{(item.sdt || item.sdt_chu || item.chu_sdt) && (
														<div className="flex items-center gap-1.5 font-mono">
															<Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
															<span>
																{item.sdt ||
																	item.sdt_chu ||
																	item.chu_sdt}
															</span>
														</div>
													)}
													{(item.mota || item.description) && (
														<p className="text-slate-400 line-clamp-2 pt-1 italic">
															{item.mota || item.description}
														</p>
													)}
												</div>
											</div>

											<div
												className="pt-3 border-t border-slate-100 flex items-center justify-between"
												onClick={(e) => e.stopPropagation()}>
												<div className="flex flex-col gap-0.5 min-w-0">
													<span className="text-[10px] font-mono text-slate-400">
														{item.thoigian
															? formatDate(String(item.thoigian))
															: item.ngay_tao
																? formatDate(String(item.ngay_tao))
																: formatCoordPair(
																		item.lat,
																		item.lng,
																		4,
																	)}
													</span>
													{item.nguoi_tao && (
														<span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-slate-600 truncate">
															<User className="w-2.5 h-2.5 text-sky-600 shrink-0" />
															{item.nguoi_tao}
														</span>
													)}
												</div>
												<div className="flex items-center gap-1">
													<button
														type="button"
														onClick={() =>
															onLocateOnMap(item, activeTarget)
														}
														className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-600 text-sky-700 hover:text-white text-[11px] font-bold transition-colors cursor-pointer">
														<LocateFixed className="w-3 h-3" />
														<span>Bản đồ</span>
													</button>
													<button
														type="button"
														onClick={() => triggerEditItem(item)}
														className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 cursor-pointer">
														<Pencil className="w-3.5 h-3.5" />
													</button>
													<button
														type="button"
														onClick={() =>
															handleConfirmDeleteSingle(item)
														}
														className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer">
														<Trash2 className="w-3.5 h-3.5" />
													</button>
												</div>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>

					{/* INLINE RIGHT SLIDE-OVER QUICK INSPECTOR (Review items without closing the table!) */}
					<AnimatePresence>
						{inspectedItem && (
							<motion.aside
								initial={{ x: 380, opacity: 0 }}
								animate={{ x: 0, opacity: 1 }}
								exit={{ x: 380, opacity: 0 }}
								transition={{ duration: 0.18 }}
								className="w-full sm:w-[380px] bg-white border-l border-slate-200 shadow-xl flex flex-col shrink-0 z-30">
								<div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/70">
									<div className="min-w-0">
										<span
											className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider ${activeConfig.accentText}`}>
											<FileText className="w-3 h-3" />
											Chi tiết nhanh • {activeConfig.shortTitle}
										</span>
										<h3 className="text-sm font-extrabold text-slate-800 mt-1 break-words">
											{getPrimaryTitle(inspectedItem, activeTarget)}
										</h3>
									</div>
									<button
										type="button"
										onClick={() => setInspectedItem(null)}
										className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-pointer">
										<X className="w-4 h-4" />
									</button>
								</div>

								<div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar text-xs">
									{/* Ảnh nhận dạng đối tượng (nếu có) */}
									{inspectedItem.hinh_anh && (
										<div className="bg-cyan-50/40 border border-cyan-200/70 rounded-2xl p-3 space-y-2">
											<div className="flex items-center justify-between">
												<span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-700 flex items-center gap-1">
													<Camera className="w-3.5 h-3.5" />
													Ảnh nhận dạng
												</span>
												<button
													type="button"
													onClick={() =>
														setPreviewImageUrl({
															src: inspectedItem.hinh_anh,
															caption: `${getPrimaryTitle(inspectedItem, activeTarget)}${inspectedItem.cccd ? ` • CCCD: ${inspectedItem.cccd}` : ""}`,
														})
													}
													className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-600 hover:text-cyan-800 cursor-pointer">
													<ZoomIn className="w-3 h-3" />
													<span>Phóng to</span>
												</button>
											</div>
											<div
												onClick={() =>
													setPreviewImageUrl({
														src: inspectedItem.hinh_anh,
														caption: `${getPrimaryTitle(inspectedItem, activeTarget)}${inspectedItem.cccd ? ` • CCCD: ${inspectedItem.cccd}` : ""}`,
													})
												}
												className="w-full h-48 rounded-xl overflow-hidden bg-white border border-cyan-100 cursor-zoom-in">
												<img
													src={inspectedItem.hinh_anh}
													alt={getPrimaryTitle(
														inspectedItem,
														activeTarget,
													)}
													className="w-full h-full object-contain"
												/>
											</div>
										</div>
									)}

									{getStatusOrSeverity(inspectedItem, activeTarget) && (
										<div className="flex items-center justify-between py-2 border-b border-slate-100">
											<span className="text-slate-400 font-semibold">
												Trạng thái / Mức độ
											</span>
											{renderStatusBadge(
												getStatusOrSeverity(inspectedItem, activeTarget),
											)}
										</div>
									)}

									{/* Nhãn phân loại nhiều nhóm (Đối tượng) */}
									{Array.isArray(inspectedItem.nhom_nhan) &&
										inspectedItem.nhom_nhan.length > 0 && (
											<div className="bg-cyan-50/40 border border-cyan-100 rounded-xl p-3 space-y-1.5">
												<div className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 flex items-center gap-1">
													<Tag className="w-3 h-3" />
													Nhãn theo dõi
												</div>
												<div className="flex flex-wrap gap-1.5">
													{inspectedItem.nhom_nhan.map((tag: string) => (
														<span
															key={tag}
															className="px-2 py-0.5 rounded-lg bg-white text-cyan-700 border border-cyan-200 text-[10px] font-extrabold">
															#{tag}
														</span>
													))}
												</div>
											</div>
										)}

									{[
										{ label: "Phân loại", val: inspectedItem.loai },
										{
											label: "Loại hình KD",
											val: inspectedItem.loai_hinh_kd,
										},
										{ label: "Mã số thuế", val: inspectedItem.mst, mono: true },
										{ label: "Giấy phép khác", val: inspectedItem.giay_phep },
										{ label: "Số CCCD", val: inspectedItem.cccd, mono: true },
										{
											label: "Số điện thoại",
											val:
												inspectedItem.sdt ||
												inspectedItem.sdt_chu ||
												inspectedItem.chu_sdt,
											mono: true,
										},
										{
											label: "Chủ sở hữu / Đại diện",
											val:
												inspectedItem.chu_camera || inspectedItem.chu_co_so,
										},
										{
											label: "Ngày sinh chủ cơ sở",
											val: inspectedItem.chu_ngaysinh,
										},
										{
											label: "CCCD chủ cơ sở",
											val: inspectedItem.chu_cccd,
											mono: true,
										},
										{
											label: "Địa chỉ chủ cơ sở",
											val: inspectedItem.chu_diachi,
										},
										{ label: "Người quản lý", val: inspectedItem.quan_ly },
										{
											label: "Ngày sinh quản lý",
											val: inspectedItem.quan_ly_ngaysinh,
										},
										{
											label: "CCCD quản lý",
											val: inspectedItem.quan_ly_cccd,
											mono: true,
										},
										{
											label: "SĐT quản lý",
											val: inspectedItem.quan_ly_sdt,
											mono: true,
										},
										{
											label: "Địa chỉ quản lý",
											val: inspectedItem.quan_ly_diachi,
										},
										{
											label: "Nhóm vụ việc",
											val: inspectedItem.groupId,
											mono: true,
										},
										{
											label: "Thời gian xảy ra",
											val: inspectedItem.thoigian
												? formatDate(inspectedItem.thoigian)
												: "",
											mono: true,
										},
										{
											label: "Bán kính ảnh hưởng",
											val:
												inspectedItem.radius !== undefined
													? `${inspectedItem.radius} mét`
													: "",
										},
										{
											label: "Địa chỉ / Địa bàn",
											val:
												inspectedItem.diachi ||
												inspectedItem.xaphuong ||
												inspectedItem.chu_diachi,
										},
										{ label: "Kết quả xử lý", val: inspectedItem.ketqua },
										{
											label: "Tọa độ (Vĩ độ, Kinh độ)",
											val: formatCoordPair(
												inspectedItem.lat,
												inspectedItem.lng,
												6,
											),
											mono: true,
										},
										{
											label: "Ngày tạo hồ sơ",
											val: inspectedItem.ngay_tao
												? formatDate(inspectedItem.ngay_tao)
												: "",
											mono: true,
										},
										{
											label: "Tài khoản tạo",
											val: inspectedItem.nguoi_tao,
											mono: true,
										},
										{
											label: "Cập nhật lần cuối bởi",
											val: inspectedItem.nguoi_cap_nhat
												? `${inspectedItem.nguoi_cap_nhat}${inspectedItem.ngay_cap_nhat ? ` (${formatDate(inspectedItem.ngay_cap_nhat)})` : ""}`
												: "",
											mono: true,
										},
									]
										.filter((row) => row.val)
										.map((row, idx) => (
											<div
												key={idx}
												className="bg-slate-50/80 border border-slate-100 rounded-xl p-3">
												<div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
													{row.label}
												</div>
												<div
													className={`text-slate-800 font-semibold mt-0.5 break-words ${
														row.mono ? "font-mono" : ""
													}`}>
													{row.val}
												</div>
											</div>
										))}

									{/* Tiền án, tiền sự & Lịch sử hoạt động (Đối tượng) */}
									{Array.isArray(inspectedItem.lich_su_hoat_dong) &&
										inspectedItem.lich_su_hoat_dong.length > 0 && (
											<div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 space-y-2">
												<div className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-700 flex items-center gap-1">
													<History className="w-3.5 h-3.5" />
													Tiền án, tiền sự & Lịch sử (
													{inspectedItem.lich_su_hoat_dong.length})
												</div>
												<div className="space-y-1.5">
													{inspectedItem.lich_su_hoat_dong.map(
														(log: any, i: number) => (
															<div
																key={log.id || i}
																className="p-2 bg-white rounded-lg border border-slate-100 space-y-0.5">
																<div className="flex items-center justify-between gap-2">
																	<span className="px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-700 text-[9px] font-extrabold uppercase">
																		{log.loai_su_kien}
																	</span>
																	<span className="text-[10px] font-mono text-slate-400">
																		{log.ngay}
																	</span>
																</div>
																<p className="text-[11px] text-slate-700 leading-relaxed">
																	{log.noi_dung}
																</p>
															</div>
														),
													)}
												</div>
											</div>
										)}

									{/* Các vụ việc liên quan của Đối tượng */}
									{activeTarget === "doituong-list" &&
										(() => {
											const relIncidents = data.vuviec.filter(
												(vv) =>
													Array.isArray(vv.suspectIds) &&
													vv.suspectIds
														.map(String)
														.includes(String(inspectedItem.id)),
											);
											if (relIncidents.length === 0) return null;
											return (
												<div className="bg-rose-50/40 border border-rose-200/70 rounded-xl p-3 space-y-1.5">
													<div className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700">
														Vụ việc liên quan ({relIncidents.length})
													</div>
													{relIncidents.map((vv, i) => (
														<div
															key={vv.id || i}
															className="p-2 bg-white rounded-lg border border-rose-100 flex items-center justify-between gap-2">
															<span className="font-bold text-slate-700 truncate">
																{vv.loai}
															</span>
															<span className="text-[10px] font-bold text-rose-600 shrink-0">
																{vv.trangthai || "Mới"}
															</span>
														</div>
													))}
												</div>
											);
										})()}

									{/* Giấy phép ANTT & PCCC (CSKD) */}
									{activeTarget === "cskd-list" &&
										(inspectedItem.giay_phep_antt ||
											inspectedItem.giay_phep_pccc) &&
										(() => {
											const anttSt = evaluateLicenseStatus(
												inspectedItem.giay_phep_antt,
											);
											const pcccSt = evaluateLicenseStatus(
												inspectedItem.giay_phep_pccc,
											);
											return (
												<div className="bg-sky-50/40 border border-sky-200/70 rounded-xl p-3 space-y-2">
													<div className="text-[10px] font-extrabold uppercase tracking-wider text-sky-800 flex items-center gap-1">
														<ShieldCheck className="w-3.5 h-3.5" />
														Giấy phép ANTT & PCCC
													</div>
													<div className="p-2 bg-white rounded-lg border border-sky-100 flex items-center justify-between gap-2">
														<div>
															<div className="font-bold text-slate-700">
																ANTT:{" "}
																{inspectedItem.giay_phep_antt
																	?.so_giay_phep || "—"}
															</div>
															{inspectedItem.giay_phep_antt
																?.ngay_het_han && (
																<div className="text-[10px] text-slate-400">
																	Hết hạn:{" "}
																	{
																		inspectedItem.giay_phep_antt
																			.ngay_het_han
																	}
																</div>
															)}
														</div>
														<span className="text-[10px] font-extrabold text-sky-700">
															{anttSt.label}
														</span>
													</div>
													<div className="p-2 bg-white rounded-lg border border-orange-100 flex items-center justify-between gap-2">
														<div>
															<div className="font-bold text-slate-700">
																PCCC:{" "}
																{inspectedItem.giay_phep_pccc
																	?.so_giay_phep || "—"}
															</div>
															{inspectedItem.giay_phep_pccc
																?.ngay_het_han && (
																<div className="text-[10px] text-slate-400">
																	Hết hạn:{" "}
																	{
																		inspectedItem.giay_phep_pccc
																			.ngay_het_han
																	}
																</div>
															)}
														</div>
														<span className="text-[10px] font-extrabold text-orange-700">
															{pcccSt.label}
														</span>
													</div>
												</div>
											);
										})()}

									{/* Lịch sử kiểm tra (CSKD) */}
									{activeTarget === "cskd-list" &&
										Array.isArray(inspectedItem.lich_su_kiem_tra) &&
										inspectedItem.lich_su_kiem_tra.length > 0 && (
											<div className="bg-pink-50/40 border border-pink-200/70 rounded-xl p-3 space-y-1.5">
												<div className="text-[10px] font-extrabold uppercase tracking-wider text-pink-700 flex items-center gap-1">
													<ClipboardCheck className="w-3.5 h-3.5" />
													Lịch sử kiểm tra (
													{inspectedItem.lich_su_kiem_tra.length})
												</div>
												{inspectedItem.lich_su_kiem_tra.map(
													(rec: any, i: number) => (
														<div
															key={rec.id || i}
															className="p-2 bg-white rounded-lg border border-pink-100 space-y-0.5">
															<div className="flex items-center justify-between">
																<span className="font-mono text-[10px] text-slate-500">
																	{rec.ngay_kiem_tra}
																</span>
																<span className="font-extrabold text-[10px] text-pink-700">
																	{rec.ket_qua}
																</span>
															</div>
															{rec.noi_dung && (
																<p className="text-[11px] text-slate-700">
																	{rec.noi_dung}
																</p>
															)}
														</div>
													),
												)}
											</div>
										)}

									{(inspectedItem.mota || inspectedItem.description) && (
										<div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3">
											<div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
												Mô tả / Ghi chú nghiệp vụ
											</div>
											<p className="text-slate-700 mt-1 leading-relaxed whitespace-pre-wrap">
												{inspectedItem.mota || inspectedItem.description}
											</p>
										</div>
									)}
								</div>

								<div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center gap-2">
									<button
										type="button"
										onClick={() => onLocateOnMap(inspectedItem, activeTarget)}
										className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer">
										<LocateFixed className="w-4 h-4" />
										<span>Định vị trên bản đồ</span>
									</button>
									<button
										type="button"
										onClick={() => triggerEditItem(inspectedItem)}
										className="inline-flex items-center justify-center gap-1 py-2.5 px-3 rounded-xl bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-700 border border-slate-200 text-xs font-bold transition-colors cursor-pointer">
										<Pencil className="w-3.5 h-3.5" />
										<span>Sửa</span>
									</button>
									<button
										type="button"
										onClick={() => handleConfirmDeleteSingle(inspectedItem)}
										className="p-2.5 rounded-xl bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 transition-colors cursor-pointer"
										title="Xóa bản ghi">
										<Trash2 className="w-4 h-4" />
									</button>
								</div>
							</motion.aside>
						)}
					</AnimatePresence>

					{/* FLOATING BULK ACTION BAR WHEN ROWS SELECTED */}
					<AnimatePresence>
						{selectedIds.size > 0 && (
							<motion.div
								initial={{ y: 40, opacity: 0 }}
								animate={{ y: 0, opacity: 1 }}
								exit={{ y: 40, opacity: 0 }}
								className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700">
								<span className="text-xs font-bold">
									Đã chọn{" "}
									<strong className="text-sky-400 font-mono">
										{selectedIds.size}
									</strong>{" "}
									bản ghi
								</span>
								<div className="h-4 w-px bg-slate-700" />
								<button
									type="button"
									onClick={() => handleExportExcel(true)}
									className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold transition-colors cursor-pointer">
									<Download className="w-3.5 h-3.5 text-emerald-400" />
									<span>Xuất Excel mục chọn</span>
								</button>
								<button
									type="button"
									onClick={handleConfirmBulkDelete}
									className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold transition-colors cursor-pointer">
									<Trash2 className="w-3.5 h-3.5" />
									<span>Xóa đã chọn</span>
								</button>
								<button
									type="button"
									onClick={() => setSelectedIds(new Set())}
									className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
									title="Bỏ chọn tất cả">
									<X className="w-4 h-4" />
								</button>
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				{/* PAGINATION FOOTER */}
				<div className="px-6 py-3 bg-white border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
					<div className="flex items-center gap-3 text-slate-500 font-medium">
						<span>
							Hiển thị{" "}
							<strong className="text-slate-800 font-mono">
								{processedItems.length === 0 ? 0 : pageStartIdx + 1}–
								{Math.min(pageStartIdx + pageSize, processedItems.length)}
							</strong>{" "}
							trên tổng{" "}
							<strong className="text-slate-800 font-mono">
								{processedItems.length.toLocaleString("vi-VN")}
							</strong>{" "}
							bản ghi
						</span>
						<select
							value={pageSize}
							onChange={(e) => setPageSize(Number(e.target.value))}
							className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none cursor-pointer">
							<option value={15}>15 / trang</option>
							<option value={25}>25 / trang</option>
							<option value={50}>50 / trang</option>
							<option value={100}>100 / trang</option>
						</select>
					</div>

					<div className="flex items-center gap-1">
						<button
							type="button"
							disabled={safePage <= 1}
							onClick={() => setCurrentPage(1)}
							className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
							title="Trang đầu">
							<ChevronsLeft className="w-4 h-4" />
						</button>
						<button
							type="button"
							disabled={safePage <= 1}
							onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
							className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
							title="Trang trước">
							<ChevronLeft className="w-4 h-4" />
						</button>

						{pageNumbers.map((p, idx) =>
							p === "ellipsis" ? (
								<span key={`el-${idx}`} className="px-2 text-slate-400">
									…
								</span>
							) : (
								<button
									key={p}
									type="button"
									onClick={() => setCurrentPage(p)}
									className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer ${
										p === safePage
											? "bg-sky-600 text-white shadow-xs"
											: "border border-slate-200 text-slate-600 hover:bg-slate-50"
									}`}>
									{p}
								</button>
							),
						)}

						<button
							type="button"
							disabled={safePage >= totalPages}
							onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
							className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
							title="Trang sau">
							<ChevronRight className="w-4 h-4" />
						</button>
						<button
							type="button"
							disabled={safePage >= totalPages}
							onClick={() => setCurrentPage(totalPages)}
							className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
							title="Trang cuối">
							<ChevronsRight className="w-4 h-4" />
						</button>
					</div>
				</div>
			</motion.div>

			{/* Fullscreen Photo Preview Lightbox */}
			{previewImageUrl && (
				<div
					onClick={() => setPreviewImageUrl(null)}
					className="fixed inset-0 z-[2600] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-6 cursor-zoom-out">
					<div
						onClick={(e) => e.stopPropagation()}
						className="relative max-w-2xl max-h-[85vh] bg-white rounded-3xl p-3 shadow-2xl border border-slate-200 flex flex-col items-center gap-2">
						<button
							type="button"
							onClick={() => setPreviewImageUrl(null)}
							className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-white text-slate-700 hover:bg-rose-600 hover:text-white shadow-lg border border-slate-200 flex items-center justify-center cursor-pointer transition-colors">
							<X className="w-4 h-4" />
						</button>
						<img
							src={previewImageUrl.src}
							alt={previewImageUrl.caption}
							className="max-h-[75vh] max-w-full rounded-2xl object-contain"
						/>
						<div className="text-xs font-extrabold text-slate-700 uppercase tracking-wide py-1">
							{previewImageUrl.caption}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
