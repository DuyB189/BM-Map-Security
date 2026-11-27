import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
	MapIcon,
	Settings,
	Database,
	RefreshCw,
	CheckCircle,
	AlertTriangle,
	Trash2,
	RotateCcw,
	Check,
	X,
	BarChart3,
	LogOut,
	History,
	KeyRound,
	ChevronRight,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { GIS_DATA as INITIAL_DATA } from "./constants";
import { GISData } from "./types";
import { getSvgPath } from "./utils/icons";
import { formatDate } from "./utils/date";
import { getLocalDateStr, getLocalDateTimeStr } from "./utils/dateUtils";
import {
	ALL_GIS_CATEGORIES,
	authService,
	getCategoryDisplayName,
	UserRole,
} from "./utils/authService";

import TopBar from "./components/TopBar";
import Sidebar from "./components/Sidebar";
import AddFormModal from "./components/AddFormModal";
import MapControls from "./components/MapControls";
import DetailsModal from "./components/DetailsModal";
import EditIncidentModal from "./components/menus/VuViec/EditIncidentModal";
import ImportExcelModal from "./components/menus/ImportExcelModal";
import EditCameraModal from "./components/menus/Camera/EditCameraModal";
import EditDoiTuongModal from "./components/menus/DoiTuong/EditDoiTuongModal";
import EditCoQuanModal from "./components/menus/CoQuan/EditCoQuanModal";
import EditCskdModal from "./components/menus/Cskd/EditCskdModal";
import EditDiemNongModal from "./components/menus/DiemNong/EditDiemNongModal";
import EditTuyenDuongModal from "./components/menus/TuyenDuong/EditTuyenDuongModal";
import StatsDashboardModal from "./components/StatsDashboardModal";
import DataCatalogModal from "./components/DataCatalogModal";
import SystemHistoryModal from "./components/SystemHistoryModal";
import OfflineMapModal from "./components/OfflineMapModal";
import ChangePasswordModal from "./components/ChangePasswordModal";
import BackupRestoreModal from "./components/BackupRestoreModal";
import UserManagementModal from "./components/UserManagementModal";
import AppConfirmModal, { appConfirm } from "./components/AppConfirmModal";
import Login from "./components/Login";
import binhminhBoundaryData from "./data/binhminh.json";

const BINH_MINH_BOUNDS: [[number, number], [number, number]] = [
	[106.0715255, 11.3239888],
	[106.1980624, 11.4388937],
];

const TAY_NINH_BOUNDS: [[number, number], [number, number]] = [
	[105.78, 10.92],
	[106.48, 11.8],
];

const BOUNDARY_LAYER_IDS = [
	"binhminh-outside-mask",
	"binhminh-ward-fill",
	"binhminh-boundary-glow",
	"binhminh-boundary-casing",
	"binhminh-boundary-line",
];

const buildOutsideMaskGeoJson = (boundaryGeoJson: any) => {
	const wardRing: [number, number][] =
		boundaryGeoJson?.features?.[0]?.geometry?.coordinates?.[0] || [];
	const holeRing = [...wardRing].reverse();
	return {
		type: "FeatureCollection" as const,
		features: [
			{
				type: "Feature" as const,
				properties: {},
				geometry: {
					type: "Polygon" as const,
					coordinates: [
						[
							[102.0, 7.0],
							[117.0, 7.0],
							[117.0, 24.0],
							[102.0, 24.0],
							[102.0, 7.0],
						],
						...(holeRing.length > 0 ? [holeRing] : []),
					],
				},
			},
		],
	};
};

const FIELD_LABELS: Record<string, string> = {
	ten: "Tên",
	ten_xa: "Tên địa bàn",
	hoten: "Họ tên",
	loai: "Phân loại",
	trangthai: "Trạng thái",
	mucdo: "Mức độ",
	diachi: "Địa chỉ",
	mota: "Mô tả",
	description: "Mô tả",
	thoigian: "Thời gian",
	ketqua: "Kết quả xử lý",
	groupId: "Mã nhóm vụ việc",
	chu_camera: "Chủ sở hữu",
	sdt_chu: "SĐT chủ camera",
	cccd: "Số CCCD",
	sdt: "Số điện thoại",
	mst: "Mã số thuế",
	loai_hinh_kd: "Loại hình KD",
	giay_phep: "Giấy phép",
	chu_co_so: "Chủ cơ sở",
	chu_sdt: "SĐT chủ cơ sở",
	quan_ly: "Người quản lý",
	quan_ly_sdt: "SĐT quản lý",
	radius: "Bán kính (m)",
	xaphuong: "Địa bàn",
};

const getEntityTitle = (item: any): string => {
	if (!item) return "Không xác định";
	return item.ten || item.hoten || item.loai || item.ten_xa || String(item.id || "Không tên");
};

const describeEntityChanges = (oldItem: any, newItem: any): string => {
	if (!oldItem || !newItem) return "Cập nhật thông tin hồ sơ";
	const changes: string[] = [];

	Object.entries(FIELD_LABELS).forEach(([key, label]) => {
		const prevVal = oldItem[key] ?? "";
		const nextVal = newItem[key] ?? "";
		if (String(prevVal).trim() !== String(nextVal).trim()) {
			changes.push(label);
		}
	});

	if (
		Number.isFinite(Number(oldItem.lng)) &&
		Number.isFinite(Number(newItem.lng)) &&
		Number.isFinite(Number(oldItem.lat)) &&
		Number.isFinite(Number(newItem.lat)) &&
		(Math.abs(Number(oldItem.lng) - Number(newItem.lng)) > 1e-6 ||
			Math.abs(Number(oldItem.lat) - Number(newItem.lat)) > 1e-6)
	) {
		changes.push(`Dời tọa độ (${Number(newItem.lng).toFixed(5)}, ${Number(newItem.lat).toFixed(5)})`);
	}

	if (JSON.stringify(oldItem.coordinates || []) !== JSON.stringify(newItem.coordinates || [])) {
		changes.push(`Vẽ lại lộ trình (${newItem.coordinates?.length || 0} điểm)`);
	}

	if (JSON.stringify(oldItem.suspectIds || []) !== JSON.stringify(newItem.suspectIds || [])) {
		changes.push(`Liên kết đối tượng nghi vấn (${newItem.suspectIds?.length || 0})`);
	}

	return changes.length > 0 ? `Thay đổi: ${changes.join(", ")}` : "Lưu cập nhật thông tin";
};

const BINH_MINH_MASK_GEOJSON = buildOutsideMaskGeoJson(binhminhBoundaryData);

export default function App() {
	const [isLoggedIn, setIsLoggedIn] = useState(() => {
		return sessionStorage.getItem("gis_session") === "active";
	});
	const [activeUsername, setActiveUsername] = useState<string>(() => {
		return sessionStorage.getItem("gis_user") || "Quản trị viên";
	});
	const [activeUserRole, setActiveUserRole] = useState<UserRole>(() => {
		const saved = sessionStorage.getItem("gis_role");
		if (saved === "owner" || saved === "admin" || saved === "leader" || saved === "staff") {
			return saved;
		}
		return "owner";
	});
	const [activeAllowedCategories, setActiveAllowedCategories] = useState<string[]>(() => {
		try {
			const raw = sessionStorage.getItem("gis_allowed_categories");
			if (raw) {
				const parsed = JSON.parse(raw);
				if (Array.isArray(parsed)) return parsed;
			}
		} catch {}
		return [...ALL_GIS_CATEGORIES];
	});

	const effectiveAllowedCategories = useMemo<string[]>(() => {
		if (activeUserRole !== "staff") return [...ALL_GIS_CATEGORIES];
		return activeAllowedCategories;
	}, [activeUserRole, activeAllowedCategories]);

	const canAccessCategory = (category: string): boolean => {
		if (category === "xa-list") return true;
		if (activeUserRole !== "staff") return true;
		return effectiveAllowedCategories.includes(category);
	};

	const getCurrentActorUsername = () => {
		return sessionStorage.getItem("gis_user") || activeUsername || "Quản trị viên";
	};

	useEffect(() => {
		authService
			.getStatus()
			.then((status) => {
				if (!status.initialized || status.isLocked) {
					sessionStorage.removeItem("gis_session");
					sessionStorage.removeItem("gis_user");
					sessionStorage.removeItem("gis_role");
					sessionStorage.removeItem("gis_fullname");
					sessionStorage.removeItem("gis_allowed_categories");
					setIsLoggedIn(false);
				}
			})
			.catch(() => {});
	}, []);

	const handleLogin = (
		username: string,
		role: UserRole = "owner",
		fullName?: string,
		allowedCategories?: string[],
	) => {
		const resolvedCats =
			role === "staff"
				? Array.isArray(allowedCategories)
					? allowedCategories
					: [...ALL_GIS_CATEGORIES]
				: [...ALL_GIS_CATEGORIES];
		setIsLoggedIn(true);
		setActiveUsername(username);
		setActiveUserRole(role);
		setActiveAllowedCategories(resolvedCats);
		setSelectedDetails(null);
		setFormData((prev: any) => ({
			...prev,
			category: resolvedCats[0] || "vuviec-list",
		}));
		sessionStorage.setItem("gis_session", "active");
		sessionStorage.setItem("gis_user", username);
		sessionStorage.setItem("gis_role", role);
		sessionStorage.setItem("gis_allowed_categories", JSON.stringify(resolvedCats));
		if (fullName) sessionStorage.setItem("gis_fullname", fullName);
	};

	const handleLogout = async () => {
		const confirmed = await appConfirm("Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?", {
			confirmText: "Đăng xuất",
			cancelText: "Hủy",
			danger: true,
		});
		if (confirmed) {
			const activeUser = sessionStorage.getItem("gis_user") || undefined;
			authService.logout(activeUser).catch(() => {});
			sessionStorage.removeItem("gis_session");
			sessionStorage.removeItem("gis_user");
			sessionStorage.removeItem("gis_role");
			sessionStorage.removeItem("gis_fullname");
			sessionStorage.removeItem("gis_allowed_categories");
			localStorage.removeItem("gis_session");
			localStorage.removeItem("gis_user");
			setSelectedDetails(null);
			setIsLoggedIn(false);
		}
	};

	const mapContainer = useRef<HTMLDivElement>(null);
	const map = useRef<maplibregl.Map | null>(null);
	const [data, setData] = useState<GISData>(INITIAL_DATA);

	// Dữ liệu đã lọc theo quyền danh mục của người dùng đang đăng nhập
	const scopedData = useMemo<GISData>(() => {
		if (activeUserRole !== "staff") return data;
		const allow = new Set(effectiveAllowedCategories);
		return {
			...data,
			menu: data.menu.filter((m) => allow.has(m.target)),
			vuviec: allow.has("vuviec-list") ? data.vuviec : [],
			camera: allow.has("camera-list") ? data.camera : [],
			doituong: allow.has("doituong-list") ? data.doituong : [],
			coquan: allow.has("coquan-list") ? data.coquan : [],
			cskd: allow.has("cskd-list") ? data.cskd : [],
			diemnong: allow.has("diemnong-list") ? data.diemnong : [],
			tuyenduong: allow.has("tuyenduong-list") ? data.tuyenduong : [],
		};
	}, [data, activeUserRole, effectiveAllowedCategories]);

	// Load GIS data from offline database on startup
	useEffect(() => {
		// @ts-ignore
		if (window.ipcRenderer) {
			// @ts-ignore
			window.ipcRenderer
				.invoke("db:get-data")
				.then((savedData: GISData | null) => {
					if (savedData) {
						console.log(
							"Loaded GIS data from offline database successfully:",
							savedData,
						);
						// Sanitize old data to remove 'tuantra' from menu and lists
						let needsSave = false;
						if (savedData.menu) {
							const hasTuanTra = savedData.menu.some(
								(m) => m.id === "menu-tuantra" || m.target === "tuantra-list",
							);
							if (hasTuanTra) {
								savedData.menu = INITIAL_DATA.menu;
								needsSave = true;
							}
						}
						if ("tuantra" in savedData) {
							delete (savedData as any).tuantra;
							needsSave = true;
						}
						setData(savedData);
						if (needsSave) {
							console.log(
								"Sanitized old database state (removed patrol objects). Saving back to disk...",
							);
							// @ts-ignore
							window.ipcRenderer
								.invoke("db:save-data", savedData)
								.catch((err: any) =>
									console.error(
										"Failed to save sanitized offline database:",
										err,
									),
								);
						}
					} else {
						console.log(
							"No saved offline data found. Initializing with default GIS_DATA...",
						);
						// First run: save current INITIAL_DATA to offline database
						// @ts-ignore
						window.ipcRenderer
							.invoke("db:save-data", INITIAL_DATA)
							.catch((err: any) =>
								console.error("Failed to initialize offline database:", err),
							);
					}
				})
				.catch((err: any) => {
					console.error("Error loading offline database:", err);
				});
		}
	}, []);

	// Save data helper for offline persistence (always clone array refs so React memos/lists refresh immediately)
	const saveOfflineData = (updatedData: GISData) => {
		const freshData: GISData = {
			...updatedData,
			menu: [...(updatedData.menu || [])],
			xaphuong: [...(updatedData.xaphuong || [])],
			vuviec: [...(updatedData.vuviec || [])],
			camera: [...(updatedData.camera || [])],
			doituong: [...(updatedData.doituong || [])],
			coquan: [...(updatedData.coquan || [])],
			cskd: [...(updatedData.cskd || [])],
			diemnong: [...(updatedData.diemnong || [])],
			tuyenduong: [...(updatedData.tuyenduong || [])],
		};
		setData(freshData);
		// @ts-ignore
		if (window.ipcRenderer) {
			// @ts-ignore
			window.ipcRenderer
				.invoke("db:save-data", freshData)
				.catch((err: any) => console.error("Failed to save offline database:", err));
		}
	};

	const handleResetDatabase = async () => {
		const confirmed = await appConfirm(
			"Bạn có chắc chắn muốn xóa sạch toàn bộ cơ sở dữ liệu GIS và thiết lập lại ứng dụng về trạng thái trống? Toàn bộ camera, vụ việc, đối tượng, cơ sở kinh doanh tự ghim sẽ bị xóa sạch.",
			{ confirmText: "Xóa sạch", cancelText: "Hủy", danger: true },
		);
		if (confirmed) {
			saveOfflineData(INITIAL_DATA);
			setSelectedDetails(null);
			authService.logAction({
				eventType: "DB_RESET",
				status: "danger",
				message:
					"Khôi phục cài đặt gốc: Xóa toàn bộ dữ liệu nghiệp vụ GIS về trạng thái trống",
			});
			alert("Đã xóa sạch cơ sở dữ liệu và khôi phục cài đặt gốc thành công!");
		}
	};
	const [showStatsModal, setShowStatsModal] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [activeMenu, setActiveMenu] = useState<string | null>(null);
	const [isAdding, setIsAdding] = useState(false);
	const isAddingRef = useRef(false);
	const [selectedCoords, setSelectedCoords] = useState<[number, number] | null>(null);
	const [showForm, setShowForm] = useState(false);
	const [formData, setFormData] = useState<any>({
		title: "",
		category: "vuviec-list",
		description: "",
		loai: "",
		mucdo: "Trung bình",
		trangthai: "Mới",
		xaphuong: "Phường Bình Minh",
		thoigian: "",
		ketqua: "",
		groupId: "",
		chu_camera: "",
		sdt_chu: "",
		cccd: "",
		sdt: "",
		hinh_anh: "",
		nhom_nhan: [],
		lich_su_hoat_dong: [],
		mst: "",
		loai_hinh_kd: "Hộ kinh doanh cá thể",
		giay_phep: "",
		giay_phep_antt: {},
		giay_phep_pccc: {},
		lich_su_kiem_tra: [],
		chu_co_so: "",
		chu_ngaysinh: "",
		chu_cccd: "",
		chu_sdt: "",
		chu_diachi: "",
		quan_ly: "",
		quan_ly_ngaysinh: "",
		quan_ly_cccd: "",
		quan_ly_sdt: "",
		quan_ly_diachi: "",
		radius: 300,
		diachi: "",
		suspectIds: [],
	});
	const [isMenuOpen, setIsMenuOpen] = useState(true);
	const [hiddenLayers, setHiddenLayers] = useState<string[]>([]);
	const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({});
	const [isLocationMenuOpen, setIsLocationMenuOpen] = useState(false);
	const [selectedLocation, setSelectedLocation] = useState("");
	const [selectedDetails, setSelectedDetails] = useState<any | null>(null);
	const [tileVersion, setTileVersion] = useState(1);
	const [tileServerUrl, setTileServerUrl] = useState<string | null>(null);
	const [isMapReady, setIsMapReady] = useState(false);
	const [showBoundary, setShowBoundary] = useState(true);

	const [editIncidentData, setEditIncidentData] = useState<any | null>(null);
	const [editCameraData, setEditCameraData] = useState<any | null>(null);
	const [editDoiTuongData, setEditDoiTuongData] = useState<any | null>(null);
	const [editCoQuanData, setEditCoQuanData] = useState<any | null>(null);
	const [editCskdData, setEditCskdData] = useState<any | null>(null);
	const [editDiemNongData, setEditDiemNongData] = useState<any | null>(null);
	const [editTuyenDuongData, setEditTuyenDuongData] = useState<any | null>(null);
	const [showImportModal, setShowImportModal] = useState(false);
	const [showCatalogModal, setShowCatalogModal] = useState(false);

	useEffect(() => {
		const onGlobalShortcut = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
				e.preventDefault();
				if (isLoggedIn) {
					setShowCatalogModal((prev) => !prev);
				}
			}
		};
		window.addEventListener("keydown", onGlobalShortcut);
		return () => window.removeEventListener("keydown", onGlobalShortcut);
	}, [isLoggedIn]);
	const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
	const [isEditingRouteCoords, setIsEditingRouteCoords] = useState(false);
	const [pendingEditTuyenDuongData, setPendingEditTuyenDuongData] = useState<any | null>(null);

	const [pickingLocationFor, setPickingLocationFor] = useState<{
		category: string;
		originalData: any;
	} | null>(null);
	const [tempPickedCoords, setTempPickedCoords] = useState<[number, number] | null>(null);
	const pickingLocationForRef = useRef<any>(null);
	const tempPickedCoordsRef = useRef<any>(null);
	useEffect(() => {
		pickingLocationForRef.current = pickingLocationFor;
	}, [pickingLocationFor]);
	useEffect(() => {
		tempPickedCoordsRef.current = tempPickedCoords;
	}, [tempPickedCoords]);

	const getMarkerStyleForCategory = (category: string, itemData: any) => {
		switch (category) {
			case "vuviec-list":
				return { iconName: "AlertTriangle", color: "#dc2626" };
			case "camera-list":
				return { iconName: "Cctv", color: "#ea580c" };
			case "doituong-list":
				return { iconName: "User", color: "#0891b2" };
			case "coquan-list":
				return { iconName: "Building2", color: "#475569" };
			case "cskd-list":
				return { iconName: "Store", color: "#be185d" };
			case "diemnong-list":
				return { iconName: "Flame", color: "#b91c1c" };
			case "tuyenduong-list":
				const color =
					itemData?.mucdo === "Rất cao"
						? "#dc2626"
						: itemData?.mucdo === "Cao"
							? "#f97316"
							: "#22c55e";
				return { iconName: "MapPin", color };
			default:
				return { iconName: "MapPin", color: "#0ea5e9" };
		}
	};

	const tempMarkerRef = useRef<maplibregl.Marker | null>(null);
	useEffect(() => {
		// Clean up the old marker first to guarantee position updates and avoid DOM reuse bugs
		if (tempMarkerRef.current) {
			tempMarkerRef.current.remove();
			tempMarkerRef.current = null;
		}

		if (map.current && tempPickedCoords && pickingLocationFor) {
			const style = getMarkerStyleForCategory(
				pickingLocationFor.category,
				pickingLocationFor.originalData,
			);
			const el = document.createElement("div");
			el.className = "custom-marker virtual-marker";
			el.style.opacity = "0.75";
			el.style.pointerEvents = "none";
			el.innerHTML = `
        <div class="marker-inner">
          <div class="marker-pulse" style="color: ${style.color};"></div>
          <div class="marker-pin" style="background: ${style.color}; border: 2.5px dashed #ffffff; box-shadow: 0 0 0 4px ${style.color}55;">
            <div style="color: white; width: 16px; height: 16px;">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">${getSvgPath(style.iconName)}</svg>
            </div>
          </div>
          <div class="marker-arrow" style="border-top-color: ${style.color};"></div>
        </div>
      `;
			tempMarkerRef.current = new maplibregl.Marker({ element: el, anchor: "bottom" })
				.setLngLat(new maplibregl.LngLat(tempPickedCoords[0], tempPickedCoords[1]))
				.addTo(map.current);
		}
	}, [tempPickedCoords, pickingLocationFor]);

	// Draw connection line between original location and new selected location
	useEffect(() => {
		if (!map.current) return;
		const sourceId = "picking-connection-line";
		const layerId = "picking-connection-layer";

		const drawLine = () => {
			if (!map.current) return;
			try {
				if (pickingLocationFor && tempPickedCoords) {
					const origLng = pickingLocationFor.originalData.lng;
					const origLat = pickingLocationFor.originalData.lat;
					const newLng = tempPickedCoords[0];
					const newLat = tempPickedCoords[1];

					// Only draw if coordinates are not identical
					if (origLng !== newLng || origLat !== newLat) {
						const geojson: any = {
							type: "Feature",
							geometry: {
								type: "LineString",
								coordinates: [
									[origLng, origLat],
									[newLng, newLat],
								],
							},
						};

						if (map.current.getSource(sourceId)) {
							(map.current.getSource(sourceId) as maplibregl.GeoJSONSource).setData(
								geojson,
							);
						} else {
							map.current.addSource(sourceId, {
								type: "geojson",
								data: geojson,
							});

							map.current.addLayer({
								id: layerId,
								type: "line",
								source: sourceId,
								paint: {
									"line-color": "#f59e0b", // Amber 500
									"line-width": 2.5,
									"line-dasharray": [3, 2],
									"line-opacity": 0.85,
								},
							});
						}
						return;
					}
				}

				// Cleanup if not drawing
				if (map.current.getLayer(layerId)) map.current.removeLayer(layerId);
				if (map.current.getSource(sourceId)) map.current.removeSource(sourceId);
			} catch (err) {
				console.warn("Error drawing picking connection line:", err);
			}
		};

		if (map.current.isStyleLoaded()) {
			drawLine();
		} else {
			map.current.once("styledata", drawLine);
		}
	}, [tempPickedCoords, pickingLocationFor]);

	const handleStartPickingLocation = (category: string, currentData: any) => {
		if (category === "vuviec-list") setEditIncidentData(null);
		else if (category === "camera-list") setEditCameraData(null);
		else if (category === "doituong-list") setEditDoiTuongData(null);
		else if (category === "coquan-list") setEditCoQuanData(null);
		else if (category === "cskd-list") setEditCskdData(null);
		else if (category === "diemnong-list") setEditDiemNongData(null);
		else if (category === "tuyenduong-list") setEditTuyenDuongData(null);

		// Close all open tooltips/popups of objects
		document.querySelectorAll(".maplibregl-popup").forEach((el) => el.remove());

		setPickingLocationFor({ category, originalData: currentData });
		setTempPickedCoords([currentData.lng, currentData.lat]);
		map.current?.flyTo({
			center: [currentData.lng, currentData.lat],
			zoom: 16,
			duration: 1000,
		});
	};

	const isEditingRouteCoordsRef = useRef(false);
	useEffect(() => {
		isEditingRouteCoordsRef.current = isEditingRouteCoords;
	}, [isEditingRouteCoords]);

	// Keep ref to data up to date for map callbacks
	const dataRef = useRef<GISData>(data);
	useEffect(() => {
		dataRef.current = data;
	}, [data]);

	// Sync ref with state for map click closure
	useEffect(() => {
		isAddingRef.current = isAdding;
	}, [isAdding]);

	// Synchronize refs for route drawing on map click
	const showFormRef = useRef(false);
	const formDataRef = useRef<any>({});
	useEffect(() => {
		showFormRef.current = showForm;
		formDataRef.current = formData;
	}, [showForm, formData]);

	// Reset route coordinates when leaving route drawing mode (all points are picked manually by the user)
	useEffect(() => {
		if (!(showForm && formData.category === "tuyenduong-list") && !isEditingRouteCoords) {
			setRouteCoordinates([]);
		}
	}, [showForm, formData.category, isEditingRouteCoords]);

	// Draw temporary route path and vertex circles on the map in real-time
	useEffect(() => {
		if (!map.current) return;

		const sourceId = "temp-route";
		const layerId = "temp-route-line";
		const pointsLayerId = "temp-route-points";

		const drawTempRoute = () => {
			if (!map.current || !map.current.isStyleLoaded()) return;

			try {
				if (
					(formData.category === "tuyenduong-list" || isEditingRouteCoords) &&
					routeCoordinates.length > 0
				) {
					const geojson: any = {
						type: "FeatureCollection",
						features: [
							{
								type: "Feature",
								geometry: {
									type: "LineString",
									coordinates: routeCoordinates,
								},
								properties: {},
							},
							...routeCoordinates.map((coord, idx) => ({
								type: "Feature",
								geometry: {
									type: "Point",
									coordinates: coord,
								},
								properties: {
									index: idx + 1,
								},
							})),
						],
					};

					if (map.current.getSource(sourceId)) {
						(map.current.getSource(sourceId) as maplibregl.GeoJSONSource).setData(
							geojson,
						);
					} else {
						map.current.addSource(sourceId, {
							type: "geojson",
							data: geojson,
						});

						map.current.addLayer({
							id: layerId,
							type: "line",
							source: sourceId,
							filter: ["==", "$type", "LineString"],
							layout: { "line-join": "round", "line-cap": "round" },
							paint: {
								"line-color": "#0284c7", // Sky 600
								"line-width": 4,
								"line-dasharray": [2, 1],
								"line-opacity": 0.8,
							},
						});

						map.current.addLayer({
							id: pointsLayerId,
							type: "circle",
							source: sourceId,
							filter: ["==", "$type", "Point"],
							paint: {
								"circle-radius": 6,
								"circle-color": "#0284c7",
								"circle-stroke-width": 2,
								"circle-stroke-color": "#ffffff",
							},
						});
					}
				} else {
					if (map.current.getLayer(layerId)) map.current.removeLayer(layerId);
					if (map.current.getLayer(pointsLayerId)) map.current.removeLayer(pointsLayerId);
					if (map.current.getSource(sourceId)) map.current.removeSource(sourceId);
				}
			} catch (err) {
				console.warn("Temporary route layer draw error:", err);
			}
		};

		if (map.current.isStyleLoaded()) {
			drawTempRoute();
		} else {
			map.current.once("styledata", drawTempRoute);
		}
	}, [routeCoordinates, formData.category, isEditingRouteCoords]);

	// Automatically close DetailsModal when switching active menu category / object type
	useEffect(() => {
		setSelectedDetails(null);
	}, [activeMenu]);

	const markersRef = useRef<
		{ marker: maplibregl.Marker; id: string | number; category: string }[]
	>([]);
	const mapHotspotsRef = useRef<Set<string>>(new Set());
	const mapRoutesRef = useRef<Set<string>>(new Set());

	// Fetch tile server URL first
	useEffect(() => {
		// @ts-ignore
		if (window.ipcRenderer) {
			// Use standard custom mbtiles:// protocol which serves phuongbinhminh.mbtiles directly
			setTileServerUrl(`mbtiles://tiles/{z}/{x}/{y}?v=${tileVersion}`);
		} else {
			// Fallback for non-electron environment (browser testing)
			setTileServerUrl("https://a.tile.openstreetmap.org/{z}/{x}/{y}.png");
		}
	}, [tileVersion]);

	const handleUpdateMap = async (): Promise<{ success: boolean; reason?: string }> => {
		// @ts-ignore
		if (window.ipcRenderer) {
			try {
				// @ts-ignore
				const result = await window.ipcRenderer.invoke("db:update-map");
				if (result.success) {
					// Update tile version to force-refresh the Maplibre map
					setTileVersion((prev) => prev + 1);
					return { success: true };
				} else {
					return { success: false, reason: result.reason || "cancelled" };
				}
			} catch (err: any) {
				console.error("Error invoking db:update-map:", err);
				return { success: false, reason: err.message || "unknown_error" };
			}
		}
		return { success: false, reason: "Không tìm thấy môi trường Electron" };
	};

	const [showSettings, setShowSettings] = useState(false);
	const [showOfflineMapModal, setShowOfflineMapModal] = useState(false);
	const [showSystemHistoryModal, setShowSystemHistoryModal] = useState(false);
	const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
	const [showBackupRestoreModal, setShowBackupRestoreModal] = useState(false);
	const [showUserManagementModal, setShowUserManagementModal] = useState(false);
	const [mapStatus, setMapStatus] = useState<{
		exists: boolean;
		path: string;
		sizeBytes: number;
		modifiedTime: any;
		isLoaded: boolean;
	} | null>(null);
	const [isUpdatingMap, setIsUpdatingMap] = useState(false);
	const [updateMessage, setUpdateMessage] = useState<{ text: string; isError: boolean } | null>(
		null,
	);

	useEffect(() => {
		// @ts-ignore
		if (window.ipcRenderer) {
			// @ts-ignore
			window.ipcRenderer
				.invoke("get-map-status")
				.then((status: any) => {
					setMapStatus(status);
				})
				.catch((e: any) => console.error("Error fetching map status:", e));
		}
	}, []);

	const triggerUpdateMap = async () => {
		setIsUpdatingMap(true);
		setUpdateMessage(null);
		try {
			const res = await handleUpdateMap();
			if (res.success) {
				setUpdateMessage({ text: "Cập nhật bản đồ thành công!", isError: false });
				// @ts-ignore
				if (window.ipcRenderer) {
					// @ts-ignore
					const status = await window.ipcRenderer.invoke("get-map-status");
					setMapStatus(status);
				}
			} else if (res.reason !== "cancelled") {
				setUpdateMessage({ text: `Lỗi: ${res.reason || "Thất bại"}`, isError: true });
			}
		} catch (e: any) {
			setUpdateMessage({ text: `Lỗi: ${e.message || "Hệ thống bận"}`, isError: true });
		} finally {
			setIsUpdatingMap(false);
			setTimeout(() => setUpdateMessage(null), 4000);
		}
	};

	// Initialize Map
	useEffect(() => {
		if (!mapContainer.current || !tileServerUrl) return;

		setIsMapReady(false); // Reset map ready state on initialization
		setShowBoundary(true);

		try {
			map.current = new maplibregl.Map({
			container: mapContainer.current,
			style: {
				version: 8,
				sources: {
					"osm-region": {
						type: "raster",
						tiles: [tileServerUrl],
						tileSize: 256,
						minzoom: 5,
						maxzoom: 13,
					},
					"osm-province": {
						type: "raster",
						tiles: [tileServerUrl],
						tileSize: 256,
						minzoom: 14,
						maxzoom: 16,
					},
					"osm-ward-hd": {
						type: "raster",
						tiles: [tileServerUrl],
						tileSize: 256,
						minzoom: 17,
						maxzoom: 18,
					},
					"binhminh-mask-source": {
						type: "geojson",
						data: BINH_MINH_MASK_GEOJSON as any,
					},
					"binhminh-boundary-source": {
						type: "geojson",
						data: binhminhBoundaryData as any,
					},
				},
				layers: [
					{
						id: "osm-region",
						type: "raster",
						source: "osm-region",
						paint: {
							"raster-resampling": "linear",
							"raster-contrast": 0.1,
							"raster-saturation": 0.08,
							"raster-fade-duration": 120,
						},
					},
					{
						id: "osm-province",
						type: "raster",
						source: "osm-province",
						minzoom: 13.15,
						paint: {
							"raster-resampling": "linear",
							"raster-contrast": 0.1,
							"raster-saturation": 0.08,
							"raster-fade-duration": 120,
						},
					},
					{
						id: "osm-ward-hd",
						type: "raster",
						source: "osm-ward-hd",
						minzoom: 16.15,
						paint: {
							"raster-resampling": "linear",
							"raster-contrast": 0.12,
							"raster-saturation": 0.08,
							"raster-fade-duration": 120,
						},
					},
					{
						id: "binhminh-outside-mask",
						type: "fill",
						source: "binhminh-mask-source",
						paint: {
							"fill-color": "#0f172a",
							"fill-opacity": [
								"interpolate",
								["linear"],
								["zoom"],
								9,
								0.14,
								13,
								0.08,
								16,
								0.05,
							],
						},
					},
					{
						id: "binhminh-ward-fill",
						type: "fill",
						source: "binhminh-boundary-source",
						paint: {
							"fill-color": "#e11d48",
							"fill-opacity": [
								"interpolate",
								["linear"],
								["zoom"],
								8.5,
								0.12,
								12,
								0.04,
								14.5,
								0.0,
							],
						},
					},
					{
						id: "binhminh-boundary-glow",
						type: "line",
						source: "binhminh-boundary-source",
						layout: {
							"line-join": "round",
							"line-cap": "round",
						},
						paint: {
							"line-color": "#f43f5e",
							"line-width": [
								"interpolate",
								["linear"],
								["zoom"],
								9,
								5,
								13,
								9,
								17,
								14,
							],
							"line-opacity": 0.28,
							"line-blur": 2,
						},
					},
					{
						id: "binhminh-boundary-casing",
						type: "line",
						source: "binhminh-boundary-source",
						layout: {
							"line-join": "round",
							"line-cap": "round",
						},
						paint: {
							"line-color": "#ffffff",
							"line-width": [
								"interpolate",
								["linear"],
								["zoom"],
								9,
								2.5,
								13,
								4.2,
								17,
								5.5,
							],
							"line-opacity": 0.92,
						},
					},
					{
						id: "binhminh-boundary-line",
						type: "line",
						source: "binhminh-boundary-source",
						layout: {
							"line-join": "round",
							"line-cap": "round",
						},
						paint: {
							"line-color": "#e11d48",
							"line-width": [
								"interpolate",
								["linear"],
								["zoom"],
								9,
								1.6,
								13,
								2.6,
								17,
								3.4,
							],
							"line-dasharray": [4, 2],
						},
					},
				],
			},
			center: [106.136138, 11.3814401], // Tọa độ trung tâm địa giới Phường Bình Minh
			zoom: 12.2,
			minZoom: 8.5,
			maxZoom: 17.5,
			pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
			maxBounds: [
				[105.45, 10.35], // Góc Tây Nam (Mở rộng toàn tỉnh Tây Ninh & vùng phụ cận)
				[106.85, 11.88], // Góc Đông Bắc (Toàn tỉnh Tây Ninh)
			],
		});
		} catch (mapInitErr) {
			console.warn("[MapLibre] Không thể khởi tạo đồ họa bản đồ (WebGL):", mapInitErr);
			map.current = null;
			return;
		}

		map.current.on("load", () => {
			setIsMapReady(true);
			updateLayers();

			// Add sovereignty markers for Hoàng Sa and Trường Sa
			const addSovereigntyMarker = (lng: number, lat: number, name: string) => {
				const el = document.createElement("div");
				el.className =
					"flex flex-col items-center justify-center gap-1 opacity-90 hover:opacity-100 transition-opacity cursor-pointer z-[1000]";
				el.innerHTML = `
          <div class="w-8 h-5 bg-red-600 shadow-sm flex items-center justify-center border border-white/80 rounded-sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="w-3 h-3 text-yellow-400 fill-current"><path d="M256 14.316L311.026 168.5h164.811L342.58 265.485 393.593 419.684 256 322.684 118.407 419.684 169.42 265.485 36.163 168.5h164.81L256 14.316z"/></svg>
          </div>
          <span class="text-[8px] font-black text-red-600 bg-white/90 px-1.5 py-0.5 rounded shadow-sm border border-red-100 whitespace-nowrap uppercase tracking-wider">${name}</span>
        `;
				new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map.current!);
			};

			// Hoàng Sa (Paracel Islands)
			addSovereigntyMarker(111.603, 16.536, "Quần đảo Hoàng Sa (Việt Nam)");
			// Trường Sa (Spratly Islands)
			addSovereigntyMarker(114.288, 9.878, "Quần đảo Trường Sa (Việt Nam)");
		});

		map.current.on("styledata", () => {
			// Re-add layers when style changes (e.g. satellite toggle)
			updateLayers();
		});

		map.current.on("click", (e) => {
			if (pickingLocationForRef.current) {
				console.log("Map clicked while picking location:", e.lngLat);
				setTempPickedCoords([e.lngLat.lng, e.lngLat.lat]);
				return;
			}
			// Logic for adding new GIS point
			if (isAddingRef.current) {
				console.log("Map clicked while adding:", e.lngLat);
				setSelectedCoords([e.lngLat.lng, e.lngLat.lat]);
				setFormData((prev) => ({
					...prev,
					thoigian: prev.thoigian || getLocalDateTimeStr(),
				}));
				setShowForm(true);
				setIsAdding(false);
			} else if (isEditingRouteCoordsRef.current) {
				const newPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat];
				setRouteCoordinates((prev) => [...prev, newPoint]);
			} else if (showFormRef.current && formDataRef.current.category === "tuyenduong-list") {
				const newPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat];
				setRouteCoordinates((prev) => [...prev, newPoint]);
			} else {
				// Query rendered features to see if the user clicked on a Route Line!
				const features = map.current!.queryRenderedFeatures(e.point);
				const routeFeature = features.find((f) => f.layer.id.startsWith("route-"));
				if (routeFeature) {
					const routeId = parseInt(routeFeature.layer.id.replace("route-", ""));
					const route = dataRef.current.tuyenduong.find((t) => t.id === routeId);
					if (route) {
						const color =
							route.mucdo === "Rất cao"
								? "#dc2626"
								: route.mucdo === "Cao"
									? "#f97316"
									: "#22c55e";
						const iconName = "MapPin";

						let statusBadge = `<span class="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
							route.mucdo === "Rất cao"
								? "bg-red-100 text-red-700"
								: route.mucdo === "Cao"
									? "bg-orange-100 text-orange-700"
									: "bg-emerald-100 text-emerald-700"
						}">${route.mucdo || "Trung bình"}</span>`;

						const popupHtml = `
              <div class="w-[240px] overflow-hidden flex flex-col font-sans">
                <!-- Header -->
                <div class="px-4 py-3 relative overflow-hidden" style="background: linear-gradient(135deg, ${color}CC, ${color});">
                  <div class="absolute -right-4 -top-4 opacity-20 transform scale-150 pointer-events-none">
                    <svg viewBox="0 0 24 24" width="64" height="64" stroke="white" stroke-width="2" fill="none">${getSvgPath(iconName)}</svg>
                  </div>
                  <div class="relative z-10 flex flex-col gap-1">
                    <div class="flex items-center gap-2">
                      <div class="bg-white/20 p-1 rounded-lg backdrop-blur-md">
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="white" stroke-width="2" fill="none">${getSvgPath(iconName)}</svg>
                      </div>
                      <span class="text-[9px] text-white/90 font-bold uppercase tracking-widest">Tuyến đường</span>
                    </div>
                    <h3 class="font-bold text-white text-[14px] leading-tight drop-shadow-sm mt-1">${route.ten}</h3>
                    <div class="mt-1">${statusBadge}</div>
                  </div>
                </div>

                <!-- Body -->
                <div class="p-4 bg-white flex flex-col gap-1">
                  <div class="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
                    <span class="text-[10px] text-slate-400 font-medium">Phân loại</span>
                    <span class="text-[11px] text-slate-700 font-bold text-right truncate max-w-[130px]" title="${route.loai || ""}">${route.loai || "Tuyến tuần tra"}</span>
                  </div>
                  <div class="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
                    <span class="text-[10px] text-slate-400 font-medium">Đặc điểm</span>
                    <span class="text-[11px] text-slate-700 font-bold text-right">${route.coordinates?.length || 0} điểm tọa độ</span>
                  </div>
                  ${
						route.ngay_tao
							? `
                  <div class="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
                    <span class="text-[10px] text-slate-400 font-medium">Ngày tạo</span>
                    <span class="text-[11px] text-slate-700 font-bold text-right">${formatDate(route.ngay_tao)}</span>
                  </div>
                  `
							: ""
					}
                </div>

                <!-- Footer Actions -->
                <div class="px-4 py-2.5 bg-slate-50 flex items-center justify-between border-t border-slate-100">
                  <button 
                    class="text-[10px] text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    onclick="handleViewDetailsGis('${route.id}', 'tuyenduong-list')"
                  >
                    <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    Chi tiết
                  </button>
                  <button 
                    class="text-[10px] text-red-500 hover:text-red-600 transition-colors flex items-center gap-1 font-bold cursor-pointer" 
                    onclick="handleDeleteGis('${route.id}', 'tuyenduong-list')"
                  >
                    <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                    Xóa
                  </button>
                </div>
              </div>
            `;

						new maplibregl.Popup({
							closeButton: false,
							className: "custom-popup",
						})
							.setLngLat(e.lngLat)
							.setHTML(popupHtml)
							.addTo(map.current!);
					}
				}
			}
		});

		return () => {
			setIsMapReady(false); // Reset map ready state on cleanup
			mapHotspotsRef.current.clear();
			mapRoutesRef.current.clear();
			if (map.current) map.current.remove();
		};
	}, [tileServerUrl, isLoggedIn]);

	// Update Layers (Circles & Lines)
	const updateLayers = () => {
		if (!map.current || !map.current.isStyleLoaded()) return;

		// 1. Update/Add active Hotspots
		const currentHotspotSourceIds = new Set<string>();
		if (!hiddenLayers.includes("diemnong-list") && canAccessCategory("diemnong-list")) {
			scopedData.diemnong.forEach((item) => {
				const sourceId = `hotspot-${item.id}`;
				currentHotspotSourceIds.add(sourceId);

				const color =
					item.mucdo === "Rất cao"
						? "#dc2626"
						: item.mucdo === "Cao"
							? "#ef4444"
							: "#f59e0b";

				const points: [number, number][] = [];
				const steps = 64;
				for (let i = 0; i <= steps; i++) {
					const angle = (((i * 360) / steps) * Math.PI) / 180;
					const dx = item.radius * Math.cos(angle);
					const dy = item.radius * Math.sin(angle);
					const lng = item.lng + dx / (111320 * Math.cos((item.lat * Math.PI) / 180));
					const lat = item.lat + dy / 110540;
					points.push([lng, lat]);
				}

				try {
					const source = map.current!.getSource(sourceId) as maplibregl.GeoJSONSource;
					if (source) {
						// Source exists, update data and paint properties directly
						source.setData({
							type: "Feature",
							properties: {},
							geometry: { type: "Polygon", coordinates: [points] },
						});
						if (map.current!.getLayer(sourceId)) {
							map.current!.setPaintProperty(sourceId, "fill-color", color);
						}
						if (map.current!.getLayer(`${sourceId}-border`)) {
							map.current!.setPaintProperty(
								`${sourceId}-border`,
								"line-color",
								color,
							);
						}
					} else {
						// Add new source and layers
						map.current!.addSource(sourceId, {
							type: "geojson",
							data: {
								type: "Feature",
								properties: {},
								geometry: { type: "Polygon", coordinates: [points] },
							},
						});

						map.current!.addLayer({
							id: sourceId,
							type: "fill",
							source: sourceId,
							paint: { "fill-color": color, "fill-opacity": 0.1 },
						});

						map.current!.addLayer({
							id: `${sourceId}-border`,
							type: "line",
							source: sourceId,
							paint: {
								"line-color": color,
								"line-width": 1.5,
								"line-dasharray": [2, 2],
								"line-opacity": 0.5,
							},
						});

						mapHotspotsRef.current.add(sourceId);
					}
				} catch (e) {
					console.warn("Style logic error:", e);
				}
			});
		}

		// Clean up any hotspots that are no longer in the list or should be hidden
		mapHotspotsRef.current.forEach((sourceId) => {
			if (!currentHotspotSourceIds.has(sourceId)) {
				try {
					if (map.current!.getLayer(sourceId)) map.current!.removeLayer(sourceId);
					if (map.current!.getLayer(`${sourceId}-border`))
						map.current!.removeLayer(`${sourceId}-border`);
					if (map.current!.getSource(sourceId)) map.current!.removeSource(sourceId);
				} catch (e) {
					console.warn("Cleanup hotspot error:", e);
				}
				mapHotspotsRef.current.delete(sourceId);
			}
		});

		// 2. Update/Add active Routes (Lines)
		const currentRouteSourceIds = new Set<string>();
		if (!hiddenLayers.includes("tuyenduong-list") && canAccessCategory("tuyenduong-list")) {
			scopedData.tuyenduong.forEach((item) => {
				if (item.type !== "line") return;
				const sourceId = `route-${item.id}`;
				currentRouteSourceIds.add(sourceId);

				const color =
					item.mucdo === "Rất cao"
						? "#dc2626"
						: item.mucdo === "Cao"
							? "#f97316"
							: "#22c55e";

				try {
					const source = map.current!.getSource(sourceId) as maplibregl.GeoJSONSource;
					if (source) {
						source.setData({
							type: "Feature",
							properties: {},
							geometry: { type: "LineString", coordinates: item.coordinates },
						});
						if (map.current!.getLayer(sourceId)) {
							map.current!.setPaintProperty(sourceId, "line-color", color);
						}
					} else {
						map.current!.addSource(sourceId, {
							type: "geojson",
							data: {
								type: "Feature",
								properties: {},
								geometry: { type: "LineString", coordinates: item.coordinates },
							},
						});

						map.current!.addLayer({
							id: sourceId,
							type: "line",
							source: sourceId,
							layout: { "line-join": "round", "line-cap": "round" },
							paint: { "line-color": color, "line-width": 4, "line-opacity": 0.7 },
						});

						mapRoutesRef.current.add(sourceId);
					}
				} catch (e) {
					console.warn("Route layer error:", e);
				}
			});
		}

		// Clean up any routes that are no longer in the list or should be hidden
		mapRoutesRef.current.forEach((sourceId) => {
			if (!currentRouteSourceIds.has(sourceId)) {
				try {
					if (map.current!.getLayer(sourceId)) map.current!.removeLayer(sourceId);
					if (map.current!.getSource(sourceId)) map.current!.removeSource(sourceId);
				} catch (e) {
					console.warn("Cleanup route error:", e);
				}
				mapRoutesRef.current.delete(sourceId);
			}
		});
	};

	// Update Markers and Layers whenever data changes
	useEffect(() => {
		if (map.current && isMapReady) {
			if (map.current.isStyleLoaded()) {
				refreshMarkers();
				updateLayers();
			} else {
				map.current.once("styledata", () => {
					refreshMarkers();
					updateLayers();
				});
			}
		}
	}, [scopedData, hiddenLayers, isMapReady]);

	const createMarker = (
		originalLngLat: [number, number],
		offsetLngLat: [number, number],
		iconName: string,
		color: string,
		title: string,
		details: Record<string, string>,
		id: string | number,
		category: string,
	) => {
		const el = document.createElement("div");
		el.className = "custom-marker";
		el.innerHTML = `
      <div class="marker-inner">
        <div class="marker-pulse" style="color: ${color};"></div>
        <div class="marker-pin" style="background: ${color};">
          <div style="color: white; width: 16px; height: 16px;">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">${getSvgPath(iconName)}</svg>
          </div>
        </div>
        <div class="marker-arrow" style="border-top-color: ${color};"></div>
      </div>
    `;

		let statusBadge = "";
		const badgeKeys = ["Mức độ", "Cảnh báo", "Trạng thái"];
		badgeKeys.forEach((k) => {
			if (details[k]) {
				const val = details[k];
				let bg = "bg-slate-100 text-slate-600";
				if (val === "Rất cao") bg = "bg-red-100 text-red-700";
				else if (val === "Cao") bg = "bg-orange-100 text-orange-700";
				else if (val === "Hoạt động" || val === "Đang hoạt động" || val === "Đã giải quyết")
					bg = "bg-emerald-100 text-emerald-700";
				else if (val === "Đang xử lý") bg = "bg-amber-100 text-amber-700";
				else if (val === "Tạm ngưng") bg = "bg-rose-100 text-rose-700";
				statusBadge = `<span class="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${bg}">${val}</span>`;
				delete details[k];
			}
		});

		const detailsHtml = Object.entries(details)
			.filter(([_, val]) => val)
			.map(
				([key, val]) => `
        <div class="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
          <span class="text-[10px] text-slate-400 font-medium">${key}</span>
          <span class="text-[11px] text-slate-700 font-bold text-right truncate max-w-[130px]" title="${val}">${val}</span>
        </div>
      `,
			)
			.join("");

		const popupHtml = `
      <div class="w-[240px] overflow-hidden flex flex-col font-sans">
        <!-- Header -->
        <div class="px-4 py-3 relative overflow-hidden" style="background: linear-gradient(135deg, ${color}CC, ${color});">
          <div class="absolute -right-4 -top-4 opacity-20 transform scale-150 pointer-events-none">
            <svg viewBox="0 0 24 24" width="64" height="64" stroke="white" stroke-width="2" fill="none">${getSvgPath(iconName)}</svg>
          </div>
          <div class="relative z-10 flex flex-col gap-1">
            <div class="flex items-center gap-2">
              <div class="bg-white/20 p-1 rounded-lg backdrop-blur-md">
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="white" stroke-width="2" fill="none">${getSvgPath(iconName)}</svg>
              </div>
              <span class="text-[9px] text-white/90 font-bold uppercase tracking-widest">${category.split("-")[0]}</span>
            </div>
            <h3 class="font-bold text-white text-[14px] leading-tight drop-shadow-sm mt-1">${title}</h3>
            ${statusBadge ? `<div class="mt-1">${statusBadge}</div>` : ""}
          </div>
        </div>

        <!-- Body -->
        <div class="p-4 bg-white flex flex-col gap-1">
          ${detailsHtml}
          
          <div class="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
            <span class="text-[10px] text-slate-400 font-medium">Tọa độ</span>
            <span class="text-[10px] text-slate-500 font-mono bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100">${Number.isFinite(Number(originalLngLat[0])) ? Number(originalLngLat[0]).toFixed(5) : "—"}, ${Number.isFinite(Number(originalLngLat[1])) ? Number(originalLngLat[1]).toFixed(5) : "—"}</span>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="px-4 py-2.5 bg-slate-50 flex items-center justify-between border-t border-slate-100">
          <button 
            class="text-[10px] text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1 transition-colors"
            onclick="handleViewDetailsGis('${id}', '${category}')"
          >
            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            Chi tiết
          </button>
          <button 
            class="text-[10px] text-red-500 hover:text-red-600 transition-colors flex items-center gap-1 font-bold" 
            onclick="handleDeleteGis('${id}', '${category}')"
          >
            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
            Xóa
          </button>
        </div>
      </div>
    `;

		const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
			.setLngLat(offsetLngLat)
			.setPopup(
				new maplibregl.Popup({
					offset: [0, -40],
					closeButton: false,
					className: "custom-popup",
				}).setHTML(popupHtml),
			)
			.addTo(map.current!);

		// Ensure only 1 popup is open when clicking this marker
		el.addEventListener("click", () => {
			markersRef.current.forEach((m) => {
				if (m.marker !== marker && m.marker.getPopup()?.isOpen()) {
					m.marker.getPopup()?.remove();
				}
			});
		});

		markersRef.current.push({ marker, id, category });
	};

	const refreshMarkers = () => {
		markersRef.current.forEach((m) => m.marker.remove());
		markersRef.current = [];

		// Temporary list to collect all markers before grouping
		const collected: {
			lngLat: [number, number];
			iconName: string;
			color: string;
			title: string;
			details: Record<string, string>;
			id: string | number;
			category: string;
		}[] = [];

		// Map through categories and collect marker definitions (scoped to user's permitted categories)
		if (!hiddenLayers.includes("vuviec-list") && canAccessCategory("vuviec-list")) {
			scopedData.vuviec.forEach((item) => {
				collected.push({
					lngLat: [item.lng, item.lat],
					iconName: "AlertTriangle",
					color: "#dc2626",
					title: item.loai,
					details: {
						"Thời gian": item.thoigian ? formatDate(item.thoigian) : "",
						"Trạng thái": item.trangthai || "",
						"Kết quả": item.ketqua || "",
						"Địa chỉ": item.diachi || "",
						"Mô tả": item.mota || "",
						"Nhóm vụ việc": item.groupId || "",
						"Ngày tạo": item.ngay_tao ? formatDate(item.ngay_tao) : "",
					},
					id: item.id || item.loai,
					category: "vuviec-list",
				});
			});
		}

		if (!hiddenLayers.includes("camera-list") && canAccessCategory("camera-list")) {
			scopedData.camera.forEach((item) => {
				collected.push({
					lngLat: [item.lng, item.lat],
					iconName: "Cctv",
					color: "#ea580c",
					title: item.ten,
					details: {
						"Chủ camera": item.chu_camera || "",
						"Số điện thoại": item.sdt_chu || "",
						"Địa chỉ": item.diachi || "",
						"Mô tả": item.description || "",
						"Trạng thái": item.trangthai || "Hoạt động",
						"Ngày tạo": item.ngay_tao ? formatDate(item.ngay_tao) : "",
					},
					id: item.id || item.ten,
					category: "camera-list",
				});
			});
		}

		if (!hiddenLayers.includes("doituong-list") && canAccessCategory("doituong-list")) {
			scopedData.doituong.forEach((item) => {
				collected.push({
					lngLat: [item.lng, item.lat],
					iconName: "User",
					color: "#0891b2",
					title: item.hoten,
					details: {
						"Loại đối tượng": item.loai || "Chưa phân loại",
						"Số CCCD": item.cccd || "",
						"Số điện thoại": item.sdt || "",
						"Địa chỉ": item.diachi || "",
						"Mô tả": item.mota || "",
						"Ngày tạo": item.ngay_tao ? formatDate(item.ngay_tao) : "",
					},
					id: item.id || item.hoten,
					category: "doituong-list",
				});
			});
		}

		if (!hiddenLayers.includes("coquan-list") && canAccessCategory("coquan-list")) {
			scopedData.coquan.forEach((item) => {
				collected.push({
					lngLat: [item.lng, item.lat],
					iconName: "Building2",
					color: "#475569",
					title: item.ten,
					details: {
						Loại: item.loai,
						"Địa bàn": item.xaphuong,
						"Ngày tạo": item.ngay_tao ? formatDate(item.ngay_tao) : "",
					},
					id: item.ten,
					category: "coquan-list",
				});
			});
		}

		if (!hiddenLayers.includes("cskd-list") && canAccessCategory("cskd-list")) {
			scopedData.cskd.forEach((item) => {
				collected.push({
					lngLat: [item.lng, item.lat],
					iconName: "Store",
					color: "#be185d",
					title: item.ten,
					details: {
						"Ngành nghề": item.loai || "Chưa rõ",
						"Mã số thuế": item.mst || "",
						"Chủ cơ sở": item.chu_co_so || "",
						"SĐT liên hệ": item.chu_sdt || "",
						"Trạng thái": item.trangthai || "Đang hoạt động",
						"Ngày tạo": item.ngay_tao ? formatDate(item.ngay_tao) : "",
					},
					id: item.ten,
					category: "cskd-list",
				});
			});
		}

		if (!hiddenLayers.includes("diemnong-list") && canAccessCategory("diemnong-list")) {
			scopedData.diemnong.forEach((item) => {
				collected.push({
					lngLat: [item.lng, item.lat],
					iconName: "Flame",
					color: "#b91c1c",
					title: item.ten,
					details: {
						Loại: item.loai || "",
						"Mức độ": item.mucdo || "Trung bình",
						"Địa bàn": item.xaphuong || "",
						"Bán kính":
							item.radius !== undefined && item.radius !== null
								? `${item.radius}m`
								: "300m",
						"Mô tả": item.mota || "",
						"Ngày tạo": item.ngay_tao ? formatDate(item.ngay_tao) : "",
					},
					id: item.id,
					category: "diemnong-list",
				});
			});
		}

		// Add point routes
		if (!hiddenLayers.includes("tuyenduong-list") && canAccessCategory("tuyenduong-list")) {
			scopedData.tuyenduong.forEach((item) => {
				if (item.type === "point" || !item.type) {
					const color =
						item.mucdo === "Rất cao"
							? "#dc2626"
							: item.mucdo === "Cao"
								? "#f97316"
								: "#22c55e";
					collected.push({
						lngLat: [item.lng!, item.lat!],
						iconName: "MapPin",
						color: color,
						title: item.ten,
						details: {
							Loại: item.loai,
							"Cảnh báo": item.mucdo,
							"Ngày tạo": item.ngay_tao ? formatDate(item.ngay_tao) : "",
						},
						id: item.id,
						category: "tuyenduong-list",
					});
				}
			});
		}

		// Group collected markers by coordinates to detect overlaps
		const groups: Record<string, typeof collected> = {};
		collected.forEach((item) => {
			const nLng = Number(item.lngLat[0]);
			const nLat = Number(item.lngLat[1]);
			if (!Number.isFinite(nLng) || !Number.isFinite(nLat)) return;
			const key = `${nLng.toFixed(6)},${nLat.toFixed(6)}`;
			if (!groups[key]) {
				groups[key] = [];
			}
			groups[key].push(item);
		});

		// Offset coordinates for overlapping markers and render them
		Object.values(groups).forEach((group) => {
			const total = group.length;
			group.forEach((item, index) => {
				let offsetLngLat = item.lngLat;
				if (total > 1) {
					// Circular offset spread
					const angle = (2 * Math.PI * index) / total;
					// Offset radius of 0.00012 degrees corresponds to ~12-13 meters, which is perfectly
					// visible and separately clickable on zoom levels 15-18 while remaining at the same location.
					const radius = 0.00012;
					offsetLngLat = [
						item.lngLat[0] + radius * Math.cos(angle),
						item.lngLat[1] + radius * Math.sin(angle),
					];
				}
				createMarker(
					item.lngLat,
					offsetLngLat,
					item.iconName,
					item.color,
					item.title,
					item.details,
					item.id,
					item.category,
				);
			});
		});
	};

	// CRUD Actions
	const handleAdd = () => {
		if (!canAccessCategory(formData.category)) {
			alert("Tài khoản của bạn không được phân quyền thao tác trên danh mục này.");
			return;
		}
		const isRouteAdd = formData.category === "tuyenduong-list";
		const effectiveCoords = isRouteAdd
			? routeCoordinates?.[0] || selectedCoords
			: selectedCoords;
		if (
			!effectiveCoords ||
			!Number.isFinite(effectiveCoords[0]) ||
			!Number.isFinite(effectiveCoords[1])
		) {
			return;
		}

		const nowLocalStr = getLocalDateTimeStr(); // YYYY-MM-DDTHH:mm (Local Time)
		const currentDateStr = getLocalDateStr(); // YYYY-MM-DD (Local Time)
		const actorUser = getCurrentActorUsername();

		const baseItem = {
			lng: effectiveCoords[0],
			lat: effectiveCoords[1],
			id: Date.now(),
			ngay_tao: currentDateStr,
			nguoi_tao: actorUser,
			nguoi_cap_nhat: actorUser,
			ngay_cap_nhat: nowLocalStr,
		};

		let newItem: any = { ...baseItem };
		switch (formData.category) {
			case "xa-list":
				newItem = { ...baseItem, ten_xa: formData.title, loai: formData.loai };
				break;
			case "vuviec-list":
				newItem = {
					...baseItem,
					loai: formData.title,
					mota: formData.description,
					thoigian: formData.thoigian || nowLocalStr,
					trangthai: formData.trangthai,
					ketqua: formData.ketqua,
					groupId: formData.groupId,
					diachi: formData.diachi,
					suspectIds: formData.suspectIds || [],
				};
				break;
			case "camera-list":
				newItem = {
					...baseItem,
					ten: formData.title,
					chu_camera: formData.chu_camera || "",
					sdt_chu: formData.sdt_chu || "",
					diachi: formData.diachi || "",
					description: formData.description || "",
					trangthai: formData.trangthai || "Hoạt động",
				};
				break;
			case "doituong-list":
				newItem = {
					...baseItem,
					hoten: formData.title,
					cccd: formData.cccd || "",
					loai: formData.loai || "",
					nhom_nhan: Array.isArray(formData.nhom_nhan) ? formData.nhom_nhan : [],
					hinh_anh: formData.hinh_anh || "",
					lich_su_hoat_dong: Array.isArray(formData.lich_su_hoat_dong)
						? formData.lich_su_hoat_dong
						: [],
					sdt: formData.sdt || "",
					mota: formData.description || "",
					diachi: formData.diachi || "",
				};
				break;
			case "coquan-list":
				newItem = {
					...baseItem,
					ten: formData.title,
					loai: formData.loai,
					xaphuong: formData.xaphuong,
				};
				break;
			case "cskd-list":
				newItem = {
					...baseItem,
					ten: formData.title,
					loai: formData.loai || "",
					trangthai: formData.trangthai || "Đang hoạt động",
					mst: formData.mst || "",
					loai_hinh_kd: formData.loai_hinh_kd || "Hộ kinh doanh cá thể",
					giay_phep: formData.giay_phep || "",
					giay_phep_antt: formData.giay_phep_antt || undefined,
					giay_phep_pccc: formData.giay_phep_pccc || undefined,
					lich_su_kiem_tra: Array.isArray(formData.lich_su_kiem_tra)
						? formData.lich_su_kiem_tra
						: [],
					chu_co_so: formData.chu_co_so || "",
					chu_ngaysinh: formData.chu_ngaysinh || "",
					chu_cccd: formData.chu_cccd || "",
					chu_sdt: formData.chu_sdt || "",
					chu_diachi: formData.chu_diachi || "",
					quan_ly: formData.quan_ly || "",
					quan_ly_ngaysinh: formData.quan_ly_ngaysinh || "",
					quan_ly_cccd: formData.quan_ly_cccd || "",
					quan_ly_sdt: formData.quan_ly_sdt || "",
					quan_ly_diachi: formData.quan_ly_diachi || "",
				};
				break;
			case "diemnong-list":
				newItem = {
					...baseItem,
					ten: formData.title,
					loai: formData.loai,
					mucdo: formData.mucdo,
					xaphuong: formData.xaphuong,
					mota: formData.description,
					radius:
						formData.radius === "" || isNaN(parseInt(formData.radius))
							? 0
							: parseInt(formData.radius),
				};
				break;
			case "tuyenduong-list":
				if (routeCoordinates && routeCoordinates.length > 1) {
					newItem = {
						...baseItem,
						ten: formData.title,
						loai: formData.loai,
						mucdo: formData.mucdo,
						type: "line",
						lng: routeCoordinates[0][0],
						lat: routeCoordinates[0][1],
						coordinates: routeCoordinates,
					};
				} else {
					newItem = {
						...baseItem,
						ten: formData.title,
						loai: formData.loai,
						mucdo: formData.mucdo,
						type: "point",
					};
				}
				break;
		}

		const newData: GISData = { ...data };
		if (formData.category === "vuviec-list") newData.vuviec = [...data.vuviec, newItem];
		else if (formData.category === "xa-list") newData.xaphuong = [...data.xaphuong, newItem];
		else if (formData.category === "camera-list") newData.camera = [...data.camera, newItem];
		else if (formData.category === "doituong-list") newData.doituong = [...data.doituong, newItem];
		else if (formData.category === "coquan-list") newData.coquan = [...data.coquan, newItem];
		else if (formData.category === "cskd-list") newData.cskd = [...data.cskd, newItem];
		else if (formData.category === "diemnong-list") newData.diemnong = [...data.diemnong, newItem];
		else if (formData.category === "tuyenduong-list") newData.tuyenduong = [...data.tuyenduong, newItem];

		saveOfflineData(newData);
		const catName = getCategoryDisplayName(formData.category);
		const itemName = getEntityTitle(newItem);
		const coordSummary =
			formData.category === "tuyenduong-list" && newItem.type === "line"
				? `${newItem.coordinates?.length || 0} điểm tọa độ`
				: Number.isFinite(Number(newItem.lng)) && Number.isFinite(Number(newItem.lat))
					? `${Number(newItem.lng).toFixed(5)}, ${Number(newItem.lat).toFixed(5)}`
					: "Chưa có tọa độ";
		authService.logAction({
			eventType: "DATA_CREATED",
			status: "success",
			category: formData.category,
			targetName: itemName,
			message: `Thêm mới ${catName}: "${itemName}" (${coordSummary})`,
		});
		setShowForm(false);
		setSelectedCoords(null);
		setRouteCoordinates([]);
		setFormData({
			title: "",
			category: "vuviec-list",
			description: "",
			loai: "",
			mucdo: "Trung bình",
			trangthai: "Mới",
			xaphuong: "Phường Bình Minh",
			thoigian: "",
			ketqua: "",
			groupId: "",
			chu_camera: "",
			sdt_chu: "",
			cccd: "",
			sdt: "",
			hinh_anh: "",
			nhom_nhan: [],
			lich_su_hoat_dong: [],
			mst: "",
			loai_hinh_kd: "Hộ kinh doanh cá thể",
			giay_phep: "",
			giay_phep_antt: {},
			giay_phep_pccc: {},
			lich_su_kiem_tra: [],
			chu_co_so: "",
			chu_ngaysinh: "",
			chu_cccd: "",
			chu_sdt: "",
			chu_diachi: "",
			quan_ly: "",
			quan_ly_ngaysinh: "",
			quan_ly_cccd: "",
			quan_ly_sdt: "",
			quan_ly_diachi: "",
			radius: 300,
			diachi: "",
			suspectIds: [],
		});
	};

	const handleDelete = (id: string | number, category: string) => {
		const newData = { ...data };
		const targetIdStr = id ? String(id) : "";
		let deletedItem: any = null;

		if (category === "vuviec-list") {
			deletedItem = newData.vuviec.find((v) => String(v.id || v.loai) === targetIdStr);
			newData.vuviec = newData.vuviec.filter((v) => String(v.id || v.loai) !== targetIdStr);
		} else if (category === "xa-list") {
			deletedItem = newData.xaphuong.find((x) => String(x.ten_xa) === targetIdStr);
			newData.xaphuong = newData.xaphuong.filter((x) => String(x.ten_xa) !== targetIdStr);
		} else if (category === "camera-list") {
			deletedItem = newData.camera.find((c) => String(c.id || c.ten) === targetIdStr);
			newData.camera = newData.camera.filter((c) => String(c.id || c.ten) !== targetIdStr);
		} else if (category === "doituong-list") {
			deletedItem = newData.doituong.find((d) => String(d.id || d.hoten) === targetIdStr);
			newData.doituong = newData.doituong.filter(
				(d) => String(d.id || d.hoten) !== targetIdStr,
			);
		} else if (category === "coquan-list") {
			deletedItem = newData.coquan.find(
				(c) => String(c.id || c.ten) === targetIdStr || String(c.ten) === targetIdStr,
			);
			newData.coquan = newData.coquan.filter(
				(c) => String(c.id || c.ten) !== targetIdStr && String(c.ten) !== targetIdStr,
			);
		} else if (category === "cskd-list") {
			deletedItem = newData.cskd.find(
				(c) => String(c.id || c.ten) === targetIdStr || String(c.ten) === targetIdStr,
			);
			newData.cskd = newData.cskd.filter(
				(c) => String(c.id || c.ten) !== targetIdStr && String(c.ten) !== targetIdStr,
			);
		} else if (category === "diemnong-list") {
			deletedItem = newData.diemnong.find((d) => String(d.id || d.ten) === targetIdStr);
			newData.diemnong = newData.diemnong.filter(
				(d) => String(d.id || d.ten) !== targetIdStr,
			);
		} else if (category === "tuyenduong-list") {
			deletedItem = newData.tuyenduong.find((t) => String(t.id || t.ten) === targetIdStr);
			newData.tuyenduong = newData.tuyenduong.filter(
				(t) => String(t.id || t.ten) !== targetIdStr,
			);
		}

		saveOfflineData(newData);
		const catName = getCategoryDisplayName(category);
		const delTitle = deletedItem ? getEntityTitle(deletedItem) : targetIdStr;
		const creatorNote = deletedItem?.nguoi_tao
			? ` (do tài khoản ${deletedItem.nguoi_tao} tạo)`
			: "";
		authService.logAction({
			eventType: "DATA_DELETED",
			status: "danger",
			category,
			targetName: delTitle,
			message: `Xóa ${catName}: "${delTitle}"${creatorNote}`,
		});
	};

	const handleBulkDelete = (ids: (string | number)[], category: string) => {
		if (!ids.length) return;
		const idSet = new Set(ids.map((x) => String(x)));
		const newData = { ...data };

		if (category === "vuviec-list") {
			newData.vuviec = newData.vuviec.filter((v) => !idSet.has(String(v.id || v.loai)));
		} else if (category === "camera-list") {
			newData.camera = newData.camera.filter((c) => !idSet.has(String(c.id || c.ten)));
		} else if (category === "doituong-list") {
			newData.doituong = newData.doituong.filter((d) => !idSet.has(String(d.id || d.hoten)));
		} else if (category === "coquan-list") {
			newData.coquan = newData.coquan.filter(
				(c) => !idSet.has(String(c.id || c.ten)) && !idSet.has(String(c.ten)),
			);
		} else if (category === "cskd-list") {
			newData.cskd = newData.cskd.filter(
				(c) => !idSet.has(String(c.id || c.ten)) && !idSet.has(String(c.ten)),
			);
		} else if (category === "diemnong-list") {
			newData.diemnong = newData.diemnong.filter((d) => !idSet.has(String(d.id || d.ten)));
		} else if (category === "tuyenduong-list") {
			newData.tuyenduong = newData.tuyenduong.filter(
				(t) => !idSet.has(String(t.id || t.ten)),
			);
		}

		saveOfflineData(newData);
		const catName = getCategoryDisplayName(category);
		authService.logAction({
			eventType: "DATA_DELETED",
			status: "danger",
			category,
			message: `Xóa hàng loạt ${ids.length} bản ghi trong danh mục ${catName}`,
		});
	};

	const handleAddNewDoiTuongFromVuViec = (newDt: any) => {
		const actorUser = getCurrentActorUsername();
		const stampedDt = {
			...newDt,
			ngay_tao: newDt.ngay_tao || getLocalDateStr(),
			nguoi_tao: newDt.nguoi_tao || actorUser,
			nguoi_cap_nhat: actorUser,
			ngay_cap_nhat: getLocalDateTimeStr(),
		};
		const newData: GISData = {
			...data,
			doituong: [...data.doituong, stampedDt],
		};
		saveOfflineData(newData);
		const dtName = getEntityTitle(stampedDt);
		authService.logAction({
			eventType: "DATA_CREATED",
			status: "success",
			category: "doituong-list",
			targetName: dtName,
			message: `Thêm nhanh Đối tượng nghi vấn từ hồ sơ Vụ việc: "${dtName}"`,
		});
	};

	const handleViewDetails = (id: string | number, category: string) => {
		if (!canAccessCategory(category)) return;
		let foundItem = null;
		const targetIdStr = id ? String(id) : "";

		if (category === "vuviec-list")
			foundItem = data.vuviec.find((v) => String(v.id || v.loai) === targetIdStr);
		else if (category === "xa-list")
			foundItem = data.xaphuong.find((x) => String(x.ten_xa) === targetIdStr);
		else if (category === "camera-list")
			foundItem = data.camera.find((c) => String(c.id || c.ten) === targetIdStr);
		else if (category === "doituong-list")
			foundItem = data.doituong.find((d) => String(d.id || d.hoten) === targetIdStr);
		else if (category === "coquan-list")
			foundItem = data.coquan.find((c) => String(c.ten) === targetIdStr);
		else if (category === "cskd-list")
			foundItem = data.cskd.find((c) => String(c.ten) === targetIdStr);
		else if (category === "diemnong-list")
			foundItem = data.diemnong.find((d) => String(d.id || d.ten) === targetIdStr);
		else if (category === "tuyenduong-list")
			foundItem = data.tuyenduong.find((t) => String(t.id || t.ten) === targetIdStr);

		if (foundItem) {
			setSelectedDetails({ ...foundItem, category });
			const viewedTitle = getEntityTitle(foundItem);
			authService.logAction({
				eventType: "DATA_VIEWED",
				status: "info",
				category,
				targetName: viewedTitle,
				message: `Xem chi tiết hồ sơ ${getCategoryDisplayName(category)}: "${viewedTitle}"`,
			});

			const markerObj = markersRef.current.find((m) => {
				if (m.category !== category) return false;
				const mid = String(m.id).trim().toLowerCase();
				const fid = foundItem.id ? String(foundItem.id).trim().toLowerCase() : "";
				const floai = foundItem.loai ? String(foundItem.loai).trim().toLowerCase() : "";
				const ften = foundItem.ten ? String(foundItem.ten).trim().toLowerCase() : "";
				const ften_xa = foundItem.ten_xa
					? String(foundItem.ten_xa).trim().toLowerCase()
					: "";
				const fhoten = foundItem.hoten ? String(foundItem.hoten).trim().toLowerCase() : "";

				return (
					(fid && mid === fid) ||
					(floai && mid === floai) ||
					(ften && mid === ften) ||
					(ften_xa && mid === ften_xa) ||
					(fhoten && mid === fhoten)
				);
			});

			/*
      // @ts-ignore
      if (window.ipcRenderer) {
        // @ts-ignore
        window.ipcRenderer.send('db:log-debug', {
          msg: 'handleViewDetails called',
          id,
          category,
          foundItem: { id: foundItem.id, loai: foundItem.loai },
          markers: markersRef.current.map(m => ({ id: m.id, category: m.category })),
          hasMarkerObj: !!markerObj
        });
      }
      */

			if (markerObj) {
				flyTo(
					foundItem.lng || (foundItem.coordinates?.[0]?.[0] ?? 0),
					foundItem.lat || (foundItem.coordinates?.[0]?.[1] ?? 0),
					15,
				);

				// Close all popups on the map
				markersRef.current.forEach((m) => {
					const popup = m.marker.getPopup();
					if (popup && popup.isOpen()) {
						popup.remove();
					}
				});

				// Open the target popup explicitly and safely using marker togglePopup
				setTimeout(() => {
					const popup = markerObj.marker.getPopup();
					if (popup && !popup.isOpen()) {
						markerObj.marker.togglePopup();
					}
				}, 200);
			} else {
				const lng = foundItem.lng || foundItem.coordinates?.[0]?.[0];
				const lat = foundItem.lat || foundItem.coordinates?.[0]?.[1];
				if (typeof lng === "number" && typeof lat === "number") {
					flyTo(lng, lat, 15);
				}
			}
		}
	};

	const withUpdateAuditFields = <T extends Record<string, any>>(
		prevItem: any,
		nextItem: T,
	): T => {
		const actorUser = getCurrentActorUsername();
		return {
			...nextItem,
			ngay_tao: prevItem?.ngay_tao || nextItem.ngay_tao,
			nguoi_tao: prevItem?.nguoi_tao || nextItem.nguoi_tao,
			nguoi_cap_nhat: actorUser,
			ngay_cap_nhat: getLocalDateTimeStr(),
		};
	};

	const handleUpdateIncident = (updated: any) => {
		const newData = { ...data };
		const updatedIdStr = String(updated.id || updated.loai);
		const index = newData.vuviec.findIndex((v) => String(v.id || v.loai) === updatedIdStr);
		if (index > -1) {
			const prevItem = newData.vuviec[index];
			const audited = withUpdateAuditFields(prevItem, updated);
			newData.vuviec[index] = audited;
			saveOfflineData(newData);
			const itemTitle = getEntityTitle(audited);
			authService.logAction({
				eventType: "DATA_UPDATED",
				status: "info",
				category: "vuviec-list",
				targetName: itemTitle,
				message: `Cập nhật Vụ việc "${itemTitle}" — ${describeEntityChanges(prevItem, audited)}`,
			});
			if (
				selectedDetails &&
				String(selectedDetails.id || selectedDetails.loai) === updatedIdStr &&
				selectedDetails.category === "vuviec-list"
			) {
				setSelectedDetails({ ...audited, category: "vuviec-list" });
			}
		}
		setEditIncidentData(null);
	};

	const handleUpdateCamera = (updated: any) => {
		const newData = { ...data };
		const updatedIdStr = String(updated.id || updated.ten);
		const index = newData.camera.findIndex((c) => String(c.id || c.ten) === updatedIdStr);
		if (index > -1) {
			const prevItem = newData.camera[index];
			const audited = withUpdateAuditFields(prevItem, updated);
			newData.camera[index] = audited;
			saveOfflineData(newData);
			const itemTitle = getEntityTitle(audited);
			authService.logAction({
				eventType: "DATA_UPDATED",
				status: "info",
				category: "camera-list",
				targetName: itemTitle,
				message: `Cập nhật Camera "${itemTitle}" — ${describeEntityChanges(prevItem, audited)}`,
			});
			if (
				selectedDetails &&
				String(selectedDetails.id || selectedDetails.ten) === updatedIdStr &&
				selectedDetails.category === "camera-list"
			) {
				setSelectedDetails({ ...audited, category: "camera-list" });
			}
		}
		setEditCameraData(null);
	};

	const handleUpdateDoiTuong = (updated: any) => {
		const newData = { ...data };
		const updatedIdStr = String(updated.id || updated.hoten);
		const index = newData.doituong.findIndex((d) => String(d.id || d.hoten) === updatedIdStr);
		if (index > -1) {
			const prevItem = newData.doituong[index];
			const audited = withUpdateAuditFields(prevItem, updated);
			newData.doituong[index] = audited;
			saveOfflineData(newData);
			const itemTitle = getEntityTitle(audited);
			authService.logAction({
				eventType: "DATA_UPDATED",
				status: "info",
				category: "doituong-list",
				targetName: itemTitle,
				message: `Cập nhật Đối tượng "${itemTitle}" — ${describeEntityChanges(prevItem, audited)}`,
			});
			if (
				selectedDetails &&
				String(selectedDetails.id || selectedDetails.hoten) === updatedIdStr &&
				selectedDetails.category === "doituong-list"
			) {
				setSelectedDetails({ ...audited, category: "doituong-list" });
			}
		}
		setEditDoiTuongData(null);
	};

	const handleUpdateCoQuan = (updated: any) => {
		const newData = { ...data };
		const originalName = updated._originalTen || updated.ten;
		const index = newData.coquan.findIndex((c) => String(c.ten) === String(originalName));
		if (index > -1) {
			const prevItem = newData.coquan[index];
			const cleanUpdated = { ...updated };
			delete cleanUpdated._originalTen;
			const audited = withUpdateAuditFields(prevItem, cleanUpdated);
			newData.coquan[index] = audited;
			saveOfflineData(newData);
			const itemTitle = getEntityTitle(audited);
			authService.logAction({
				eventType: "DATA_UPDATED",
				status: "info",
				category: "coquan-list",
				targetName: itemTitle,
				message: `Cập nhật Cơ quan nhà nước "${itemTitle}" — ${describeEntityChanges(prevItem, audited)}`,
			});
			if (
				selectedDetails &&
				String(selectedDetails.ten) === String(originalName) &&
				selectedDetails.category === "coquan-list"
			) {
				setSelectedDetails({ ...audited, category: "coquan-list" });
			}
		}
		setEditCoQuanData(null);
	};

	const handleUpdateCskd = (updated: any) => {
		const newData = { ...data };
		const originalName = updated._originalTen || updated.ten;
		const index = newData.cskd.findIndex((c) => String(c.ten) === String(originalName));
		if (index > -1) {
			const prevItem = newData.cskd[index];
			const cleanUpdated = { ...updated };
			delete cleanUpdated._originalTen;
			const audited = withUpdateAuditFields(prevItem, cleanUpdated);
			newData.cskd[index] = audited;
			saveOfflineData(newData);
			const itemTitle = getEntityTitle(audited);
			authService.logAction({
				eventType: "DATA_UPDATED",
				status: "info",
				category: "cskd-list",
				targetName: itemTitle,
				message: `Cập nhật Cơ sở kinh doanh "${itemTitle}" — ${describeEntityChanges(prevItem, audited)}`,
			});
			if (
				selectedDetails &&
				String(selectedDetails.ten) === String(originalName) &&
				selectedDetails.category === "cskd-list"
			) {
				setSelectedDetails({ ...audited, category: "cskd-list" });
			}
		}
		setEditCskdData(null);
	};

	const handleUpdateDiemNong = (updated: any) => {
		const newData = { ...data };
		const originalName = updated._originalTen || updated.ten;
		const index = newData.diemnong.findIndex(
			(d) => String(d.id || d.ten) === String(updated.id || originalName),
		);
		if (index > -1) {
			const prevItem = newData.diemnong[index];
			const cleanUpdated = { ...updated };
			delete cleanUpdated._originalTen;
			cleanUpdated.radius =
				cleanUpdated.radius === "" || isNaN(parseInt(cleanUpdated.radius))
					? 0
					: parseInt(cleanUpdated.radius);
			const audited = withUpdateAuditFields(prevItem, cleanUpdated);
			newData.diemnong[index] = audited;
			saveOfflineData(newData);
			const itemTitle = getEntityTitle(audited);
			authService.logAction({
				eventType: "DATA_UPDATED",
				status: "info",
				category: "diemnong-list",
				targetName: itemTitle,
				message: `Cập nhật Điểm nóng "${itemTitle}" — ${describeEntityChanges(prevItem, audited)}`,
			});
			if (
				selectedDetails &&
				String(selectedDetails.id || selectedDetails.ten) ===
					String(updated.id || originalName) &&
				selectedDetails.category === "diemnong-list"
			) {
				setSelectedDetails({ ...audited, category: "diemnong-list" });
			}
		}
		setEditDiemNongData(null);
	};

	const handleUpdateTuyenDuong = (updated: any) => {
		const newData = { ...data };
		const originalName = updated._originalTen || updated.ten;
		const index = newData.tuyenduong.findIndex(
			(t) => String(t.id || t.ten) === String(updated.id || originalName),
		);
		if (index > -1) {
			const prevItem = newData.tuyenduong[index];
			const cleanUpdated = { ...updated };
			delete cleanUpdated._originalTen;
			const audited = withUpdateAuditFields(prevItem, cleanUpdated);
			newData.tuyenduong[index] = audited;
			saveOfflineData(newData);
			const itemTitle = getEntityTitle(audited);
			authService.logAction({
				eventType: "DATA_UPDATED",
				status: "info",
				category: "tuyenduong-list",
				targetName: itemTitle,
				message: `Cập nhật Tuyến đường "${itemTitle}" — ${describeEntityChanges(prevItem, audited)}`,
			});
			if (
				selectedDetails &&
				String(selectedDetails.id || selectedDetails.ten) ===
					String(updated.id || originalName) &&
				selectedDetails.category === "tuyenduong-list"
			) {
				setSelectedDetails({ ...audited, category: "tuyenduong-list" });
			}
		}
		setEditTuyenDuongData(null);
	};

	const handleStartEditCoordinates = (routeData: any) => {
		// Hide any open MapLibre popups
		document.querySelectorAll(".maplibregl-popup").forEach((el) => el.remove());

		setPendingEditTuyenDuongData(routeData);
		setEditTuyenDuongData(null); // hide the edit modal
		setIsEditingRouteCoords(true);
		setRouteCoordinates(routeData.coordinates || []);
	};

	const handleImportExcelData = (targetCategory: string, importedItems: any[]) => {
		const actorUser = getCurrentActorUsername();
		const nowDate = getLocalDateStr();
		const nowDateTime = getLocalDateTimeStr();
		const stampedItems = importedItems.map((item) => ({
			...item,
			ngay_tao: item.ngay_tao || nowDate,
			nguoi_tao: item.nguoi_tao || actorUser,
			nguoi_cap_nhat: actorUser,
			ngay_cap_nhat: nowDateTime,
		}));

		const newData = { ...data };
		if (targetCategory === "vuviec-list") {
			newData.vuviec = [...newData.vuviec, ...stampedItems];
		} else if (targetCategory === "camera-list") {
			newData.camera = [...newData.camera, ...stampedItems];
		} else if (targetCategory === "doituong-list") {
			newData.doituong = [...newData.doituong, ...stampedItems];
		} else if (targetCategory === "coquan-list") {
			newData.coquan = [...newData.coquan, ...stampedItems];
		} else if (targetCategory === "cskd-list") {
			newData.cskd = [...newData.cskd, ...stampedItems];
		} else if (targetCategory === "diemnong-list") {
			newData.diemnong = [...newData.diemnong, ...stampedItems];
		} else if (targetCategory === "tuyenduong-list") {
			newData.tuyenduong = [...newData.tuyenduong, ...stampedItems];
		}
		saveOfflineData(newData);
		const catName = getCategoryDisplayName(targetCategory);
		authService.logAction({
			eventType: "DATA_IMPORTED",
			status: "success",
			category: targetCategory,
			message: `Nhập dữ liệu hàng loạt từ Excel vào danh mục ${catName}: Thêm mới ${stampedItems.length} bản ghi`,
		});
		setShowImportModal(false);
	};

	// Event listener for popup actions
	useEffect(() => {
		const handler = (e: any) => {
			const { id, category } = e.detail;
			handleDelete(id, category);
		};
		// @ts-ignore
		window.handleDeleteGis = (id: string, category: string) => {
			window.dispatchEvent(new CustomEvent("delete-gis", { detail: { id, category } }));
		};
		window.addEventListener("delete-gis", handler);

		const viewHandler = (e: any) => {
			const { id, category } = e.detail;
			handleViewDetails(id, category);
		};
		// @ts-ignore
		window.handleViewDetailsGis = (id: string, category: string) => {
			window.dispatchEvent(new CustomEvent("view-details-gis", { detail: { id, category } }));
		};
		window.addEventListener("view-details-gis", viewHandler);

		const editHandler = (e: any) => setEditIncidentData(e.detail);
		window.addEventListener("edit-incident", editHandler);

		const editCameraHandler = (e: any) => setEditCameraData(e.detail);
		window.addEventListener("edit-camera", editCameraHandler);

		const editDoiTuongHandler = (e: any) => setEditDoiTuongData(e.detail);
		window.addEventListener("edit-doituong", editDoiTuongHandler);

		const editCoQuanHandler = (e: any) => setEditCoQuanData(e.detail);
		window.addEventListener("edit-coquan", editCoQuanHandler);

		const editCskdHandler = (e: any) => setEditCskdData(e.detail);
		window.addEventListener("edit-cskd", editCskdHandler);

		const editDiemNongHandler = (e: any) => setEditDiemNongData(e.detail);
		window.addEventListener("edit-diemnong", editDiemNongHandler);

		const editTuyenDuongHandler = (e: any) => setEditTuyenDuongData(e.detail);
		window.addEventListener("edit-tuyenduong", editTuyenDuongHandler);

		const importHandler = () => setShowImportModal(true);
		window.addEventListener("import-incidents", importHandler);

		return () => {
			window.removeEventListener("delete-gis", handler);
			window.removeEventListener("view-details-gis", viewHandler);
			window.removeEventListener("edit-incident", editHandler);
			window.removeEventListener("edit-camera", editCameraHandler);
			window.removeEventListener("edit-doituong", editDoiTuongHandler);
			window.removeEventListener("edit-coquan", editCoQuanHandler);
			window.removeEventListener("edit-cskd", editCskdHandler);
			window.removeEventListener("edit-diemnong", editDiemNongHandler);
			window.removeEventListener("edit-tuyenduong", editTuyenDuongHandler);
			window.removeEventListener("import-incidents", importHandler);
		};
	}, [data]);

	const flyTo = (lng: number, lat: number, zoom = 15) => {
		map.current?.flyTo({ center: [lng, lat], zoom, speed: 1.5 });
	};

	const getFilteredData = (type: string) => {
		switch (type) {
			case "xa-list":
				return data.xaphuong.map((x) => ({
					label: x.ten_xa,
					lng: x.lng,
					lat: x.lat,
					category: type,
					id: x.ten_xa,
				}));
			case "vuviec-list":
				return scopedData.vuviec.map((v) => ({
					label: v.loai,
					lng: v.lng,
					lat: v.lat,
					category: type,
					id: v.id || v.loai,
					area: v.diachi || "",
					extra: `${v.mota || ""} ${v.diachi || ""} ${v.ketqua || ""}`,
					trangthai: v.trangthai,
					thoigian: v.thoigian,
					groupId: v.groupId,
				}));
			case "camera-list":
				return scopedData.camera.map((c) => ({
					label: c.ten,
					lng: c.lng,
					lat: c.lat,
					category: type,
					id: c.id || c.ten,
					loai: c.chu_camera,
					area: c.diachi || "",
					extra: `${c.diachi || ""} ${c.sdt_chu || ""} ${c.description || ""}`,
				}));
			case "doituong-list":
				return scopedData.doituong.map((d) => {
					const linkedIncidentsText = scopedData.vuviec
						.filter(
							(vv) =>
								Array.isArray(vv.suspectIds) &&
								vv.suspectIds.map(String).includes(String(d.id)),
						)
						.map((vv) => `${vv.loai || ""} ${vv.groupId || ""} ${vv.diachi || ""}`)
						.join(" ");
					const tagsText = Array.isArray(d.nhom_nhan) ? d.nhom_nhan.join(" ") : "";
					const historyText = Array.isArray(d.lich_su_hoat_dong)
						? d.lich_su_hoat_dong
								.map((h) => `${h.loai_su_kien} ${h.noi_dung}`)
								.join(" ")
						: "";
					return {
						label: d.hoten,
						lng: d.lng,
						lat: d.lat,
						category: type,
						id: d.id || d.hoten,
						loai: d.loai,
						area: d.diachi || "",
						extra: `${d.cccd || ""} ${d.sdt || ""} ${d.diachi || ""} ${tagsText} ${historyText} ${linkedIncidentsText}`,
					};
				});
			case "coquan-list":
				return scopedData.coquan.map((c) => ({
					label: c.ten,
					lng: c.lng,
					lat: c.lat,
					category: type,
					id: c.ten,
					loai: c.loai,
					area: c.xaphuong || "",
					extra: c.xaphuong || "",
				}));
			case "cskd-list":
				return scopedData.cskd.map((c) => ({
					label: c.ten,
					lng: c.lng,
					lat: c.lat,
					category: type,
					id: c.ten,
					loai: c.loai,
					trangthai: c.trangthai,
					area: c.chu_diachi || "",
					extra: `${c.mst || ""} ${c.chu_co_so || ""} ${c.chu_diachi || ""} ${c.giay_phep || ""}`,
				}));
			case "diemnong-list":
				return scopedData.diemnong.map((d) => ({
					label: d.ten,
					lng: d.lng,
					lat: d.lat,
					category: type,
					id: d.id,
					loai: d.loai,
					mucdo: d.mucdo,
					area: d.xaphuong || "",
					extra: `${d.xaphuong || ""} ${d.mota || ""}`,
				}));
			case "tuyenduong-list":
				return scopedData.tuyenduong.map((t) => ({
					label: t.ten,
					lng: t.lng || (t.coordinates?.[0]?.[0] ?? 0),
					lat: t.lat || (t.coordinates?.[0]?.[1] ?? 0),
					category: type,
					id: t.id || t.ten,
					loai: t.loai,
					area: "",
				}));
			default:
				return [];
		}
	};

	const handleItemHover = (id: string | number, category: string, isHovering: boolean) => {
		const found = markersRef.current.find((m) => m.id === id && m.category === category);
		if (found) {
			const inner = found.marker.getElement().querySelector(".marker-inner") as HTMLElement;
			if (inner) {
				inner.style.transform = isHovering ? "scale(1.15) translateY(-6px)" : "";
			}
			found.marker.getElement().style.zIndex = isHovering ? "50" : "";
		}

		// Handle Mapbox drawn layers (Lines and Polygons)
		if (map.current) {
			if (category === "tuyenduong-list") {
				const sourceId = `route-${id}`;
				if (map.current.getLayer(sourceId)) {
					map.current.setPaintProperty(sourceId, "line-width", isHovering ? 8 : 4);
					map.current.setPaintProperty(sourceId, "line-opacity", isHovering ? 1 : 0.7);
				}
			}
			if (category === "diemnong-list") {
				const sourceId = `hotspot-${id}`;
				if (map.current.getLayer(sourceId)) {
					map.current.setPaintProperty(sourceId, "fill-opacity", isHovering ? 0.4 : 0.1);
				}
			}
		}
	};

	const handleItemClick = (item: any) => {
		flyTo(item.lng, item.lat, 15);
		const itemId = item.id || item.label;

		// Close all other popups first
		markersRef.current.forEach((m) => {
			const isTarget = m.id === itemId && m.category === item.category;
			if (!isTarget && m.marker.getPopup()?.isOpen()) {
				m.marker.getPopup()?.remove();
			}
		});

		const found = markersRef.current.find(
			(m) => m.id === itemId && m.category === item.category,
		);
		if (found) {
			const popup = found.marker.getPopup();
			if (popup && !popup.isOpen()) {
				found.marker.togglePopup();
			}
		}
	};

	const activeMenuObj = data.menu.find((m) => m.id === activeMenu);
	const activeListData = activeMenuObj ? getFilteredData(activeMenuObj.target) : [];
	const filteredActiveList = activeListData.filter((item) =>
		String(item.label ?? "").toLowerCase().includes(String(searchQuery ?? "").toLowerCase()),
	);

	const panToHomeCenter = () => {
		// Đưa khung nhìn về trọn vẹn địa giới Phường Bình Minh
		map.current?.fitBounds(BINH_MINH_BOUNDS, {
			padding: { top: 100, bottom: 50, left: isMenuOpen ? 360 : 60, right: 80 },
			duration: 1000,
		});
	};

	const fitToProvince = () => {
		// Đưa khung nhìn ra toàn cảnh Tỉnh Tây Ninh
		map.current?.fitBounds(TAY_NINH_BOUNDS, {
			padding: { top: 90, bottom: 40, left: isMenuOpen ? 350 : 50, right: 70 },
			duration: 1200,
		});
	};

	const toggleBoundaryVisibility = () => {
		const nextVisible = !showBoundary;
		setShowBoundary(nextVisible);
		authService.logAction({
			eventType: "SYSTEM_ACTION",
			status: "info",
			message: nextVisible
				? "Bật hiển thị đường địa giới hành chính Phường Bình Minh"
				: "Ẩn đường địa giới hành chính Phường Bình Minh",
		});
		if (map.current) {
			BOUNDARY_LAYER_IDS.forEach((layerId) => {
				if (map.current?.getLayer(layerId)) {
					map.current.setLayoutProperty(
						layerId,
						"visibility",
						nextVisible ? "visible" : "none",
					);
				}
			});
		}
	};

	const totalManagedRecords =
		data.vuviec.length +
		data.camera.length +
		data.doituong.length +
		data.coquan.length +
		data.cskd.length +
		data.diemnong.length +
		data.tuyenduong.length;

	if (!isLoggedIn) {
		return <Login onLogin={handleLogin} />;
	}

	return (
		<div
			className={`relative w-full h-screen font-sans bg-slate-50 overflow-hidden ${pickingLocationFor ? "picking-location-active" : ""}`}>
			<TopBar
				isMenuOpen={isMenuOpen}
				setIsMenuOpen={setIsMenuOpen}
				isAdding={isAdding}
				setIsAdding={setIsAdding}
				setSelectedCoords={setSelectedCoords}
				setShowForm={setShowForm}
				totalRecordsCount={totalManagedRecords}
				onOpenCatalog={() => setShowCatalogModal(true)}
				onOpenStats={() => {
					setShowStatsModal(true);
					authService.logAction({
						eventType: "SYSTEM_ACTION",
						status: "info",
						message: "Mở bảng điều khiển Báo cáo Thống kê ANTT",
					});
				}}
				showSettings={showSettings}
				setShowSettings={setShowSettings}
				isUpdatingMap={isUpdatingMap}
				onOpenBackupRestore={() => setShowBackupRestoreModal(true)}
				onOpenOfflineMap={() => setShowOfflineMapModal(true)}
				onOpenSystemHistory={() => setShowSystemHistoryModal(true)}
				onOpenChangePassword={() => setShowChangePasswordModal(true)}
				onOpenUserManagement={() => setShowUserManagementModal(true)}
				onReloadApp={() => window.location.reload()}
				onLogout={handleLogout}
				activeUsername={activeUsername}
				activeUserRole={activeUserRole}
			/>

			<Sidebar
				isMenuOpen={isMenuOpen}
				searchQuery={searchQuery}
				setSearchQuery={setSearchQuery}
				data={scopedData}
				hiddenLayers={hiddenLayers}
				setHiddenLayers={setHiddenLayers}
				getFilteredData={getFilteredData}
				handleItemHover={handleItemHover}
				handleItemClick={handleItemClick}
				onOpenCatalog={(menuId) => {
					if (menuId) setActiveMenu(menuId);
					setShowCatalogModal(true);
				}}
			/>

			<OfflineMapModal
				show={showOfflineMapModal}
				onClose={() => setShowOfflineMapModal(false)}
				mapStatus={mapStatus}
				isUpdatingMap={isUpdatingMap}
				updateMessage={updateMessage}
				onTriggerUpdateMap={triggerUpdateMap}
			/>

			<SystemHistoryModal
				show={showSystemHistoryModal}
				onClose={() => setShowSystemHistoryModal(false)}
			/>

			<ChangePasswordModal
				show={showChangePasswordModal}
				onClose={() => setShowChangePasswordModal(false)}
				isOwner={activeUserRole === "owner"}
			/>

			<UserManagementModal
				show={showUserManagementModal}
				onClose={() => setShowUserManagementModal(false)}
				activeUsername={activeUsername}
			/>

			<BackupRestoreModal
				show={showBackupRestoreModal}
				onClose={() => setShowBackupRestoreModal(false)}
				onDataRestored={(restoredData) => {
					setData(restoredData);
					setSelectedDetails(null);
				}}
			/>

			<AddFormModal
				showForm={showForm}
				setShowForm={setShowForm}
				formData={formData}
				setFormData={setFormData}
				menu={scopedData.menu}
				selectedCoords={selectedCoords}
				setSelectedCoords={setSelectedCoords}
				onPickOnMap={() => {
					setShowForm(false);
					setIsAdding(true);
				}}
				handleAdd={handleAdd}
				routeCoordinates={routeCoordinates}
				setRouteCoordinates={setRouteCoordinates}
				doituongList={scopedData.doituong}
				onAddNewDoiTuong={handleAddNewDoiTuongFromVuViec}
			/>

			<DetailsModal
				details={selectedDetails}
				onClose={() => setSelectedDetails(null)}
				vuviecList={scopedData.vuviec}
				doituongList={scopedData.doituong}
				cameraList={scopedData.camera}
			/>

			<DataCatalogModal
				show={showCatalogModal}
				initialMenuId={activeMenu}
				onClose={() => setShowCatalogModal(false)}
				data={scopedData}
				allowedCategories={effectiveAllowedCategories}
				hiddenLayers={hiddenLayers}
				setHiddenLayers={setHiddenLayers}
				suspendOverlay={Boolean(
					isAdding ||
					pickingLocationFor ||
					isEditingRouteCoords ||
					(showForm && formData.category === "tuyenduong-list"),
				)}
				onLocateOnMap={(item, category) => {
					setShowCatalogModal(false);
					let lookupId = "";
					if (category === "vuviec-list") lookupId = item.id || item.loai;
					else if (category === "camera-list") lookupId = item.id || item.ten;
					else if (category === "doituong-list") lookupId = item.id || item.hoten;
					else if (category === "coquan-list") lookupId = item.ten;
					else if (category === "cskd-list") lookupId = item.ten;
					else if (category === "diemnong-list") lookupId = item.id || item.ten;
					else if (category === "tuyenduong-list") lookupId = item.id || item.ten;

					const wasHidden = hiddenLayers.includes(category);
					if (wasHidden) {
						setHiddenLayers((prev) => prev.filter((l) => l !== category));
					}
					setTimeout(
						() => {
							handleViewDetails(lookupId, category);
						},
						wasHidden ? 350 : 80,
					);
				}}
				onOpenAddForCategory={(category) => {
					setSelectedCoords(null);
					setRouteCoordinates([]);
					setFormData((prev: any) => ({
						...prev,
						category,
						thoigian: getLocalDateTimeStr(),
					}));
					setShowForm(true);
				}}
				onOpenImportForMenu={(menuId) => {
					setActiveMenu(menuId);
					setShowImportModal(true);
				}}
				onDeleteSingle={handleDelete}
				onBulkDelete={handleBulkDelete}
			/>

			<StatsDashboardModal
				show={showStatsModal}
				onClose={() => setShowStatsModal(false)}
				data={scopedData}
				onSelectCategory={(category) => {
					setActiveMenu(category);
					setShowCatalogModal(true);
					setShowStatsModal(false);
				}}
				onSelectItem={(item) => {
					setShowStatsModal(false);

					let lookupId = "";
					if (item.category === "vuviec-list") {
						lookupId = item.id || item.loai;
					} else if (item.category === "xa-list") {
						lookupId = item.ten_xa;
					} else if (item.category === "camera-list") {
						lookupId = item.id || item.ten;
					} else if (item.category === "doituong-list") {
						lookupId = item.id || item.hoten;
					} else if (item.category === "coquan-list") {
						lookupId = item.ten;
					} else if (item.category === "cskd-list") {
						lookupId = item.ten;
					} else if (item.category === "diemnong-list") {
						lookupId = item.id || item.ten;
					} else if (item.category === "tuyenduong-list") {
						lookupId = item.id || item.ten;
					} else {
						lookupId = item.id || item.loai || item.ten || item.hoten;
					}

					const isHidden = hiddenLayers.includes(item.category);
					if (isHidden) {
						setHiddenLayers((prev) => prev.filter((l) => l !== item.category));
					}

					setTimeout(
						() => {
							handleViewDetails(lookupId, item.category);
						},
						isHidden ? 350 : 80,
					);
				}}
			/>

			<EditIncidentModal
				editData={editIncidentData}
				setEditData={setEditIncidentData}
				handleSave={handleUpdateIncident}
				doituongList={data.doituong}
				onAddNewDoiTuong={handleAddNewDoiTuongFromVuViec}
				onPickLocationOnMap={handleStartPickingLocation}
			/>

			<EditCameraModal
				editData={editCameraData}
				setEditData={setEditCameraData}
				handleSave={handleUpdateCamera}
				onPickLocationOnMap={handleStartPickingLocation}
			/>

			<EditDoiTuongModal
				editData={editDoiTuongData}
				setEditData={setEditDoiTuongData}
				handleSave={handleUpdateDoiTuong}
				onPickLocationOnMap={handleStartPickingLocation}
			/>

			<EditCoQuanModal
				editData={editCoQuanData}
				setEditData={setEditCoQuanData}
				handleSave={handleUpdateCoQuan}
				onPickLocationOnMap={handleStartPickingLocation}
			/>

			<EditCskdModal
				editData={editCskdData}
				setEditData={setEditCskdData}
				handleSave={handleUpdateCskd}
				onPickLocationOnMap={handleStartPickingLocation}
			/>

			<EditDiemNongModal
				editData={editDiemNongData}
				setEditData={setEditDiemNongData}
				handleSave={handleUpdateDiemNong}
				onPickLocationOnMap={handleStartPickingLocation}
			/>

			<EditTuyenDuongModal
				editData={editTuyenDuongData}
				setEditData={setEditTuyenDuongData}
				handleSave={handleUpdateTuyenDuong}
				onEditCoordinates={handleStartEditCoordinates}
				onPickLocationOnMap={handleStartPickingLocation}
			/>

			<ImportExcelModal
				showImport={showImportModal}
				setShowImport={setShowImportModal}
				activeMenu={activeMenu}
				allowedCategories={effectiveAllowedCategories}
				handleImport={handleImportExcelData}
			/>

			<AppConfirmModal />

			<MapControls
				zoomIn={() => map.current?.zoomIn()}
				zoomOut={() => map.current?.zoomOut()}
				onFitWard={panToHomeCenter}
				onFitProvince={fitToProvince}
				showBoundary={showBoundary}
				onToggleBoundary={toggleBoundaryVisibility}
			/>

			<AnimatePresence>
				{pickingLocationFor && (
					<motion.div
						initial={{ opacity: 0, y: -20, x: "-50%" }}
						animate={{ opacity: 1, y: 0, x: "-50%" }}
						exit={{ opacity: 0, y: -20, x: "-50%" }}
						className="absolute top-6 left-1/2 transform z-[2000] w-[460px] glass p-4 rounded-3xl shadow-2xl border border-white/50 space-y-3 flex flex-col text-slate-800 text-center select-none">
						<div>
							<span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500 text-white animate-pulse">
								Chế độ thay đổi vị trí điểm ghim
							</span>
							<h3 className="text-xs font-black text-slate-850 mt-1.5 uppercase truncate max-w-full">
								Chọn vị trí mới cho:{" "}
								{pickingLocationFor.originalData.ten ||
									pickingLocationFor.originalData.hoten ||
									pickingLocationFor.originalData.loai ||
									"Đối tượng"}
							</h3>
							<p className="text-[9px] text-slate-450 font-bold uppercase tracking-wider mt-0.5">
								Nhấp lên bản đồ để chọn tọa độ mới
							</p>
							{tempPickedCoords && (
								<p className="text-[10px] font-mono text-rose-650 mt-1 font-bold">
									Tọa độ đã chọn: {tempPickedCoords[0].toFixed(6)},{" "}
									{tempPickedCoords[1].toFixed(6)}
								</p>
							)}
						</div>

						<div className="flex items-center justify-center gap-2">
							<button
								type="button"
								onClick={() => {
									const updatedData = {
										...pickingLocationFor.originalData,
										lng: tempPickedCoords
											? tempPickedCoords[0]
											: pickingLocationFor.originalData.lng,
										lat: tempPickedCoords
											? tempPickedCoords[1]
											: pickingLocationFor.originalData.lat,
									};

									if (pickingLocationFor.category === "vuviec-list")
										setEditIncidentData(updatedData);
									else if (pickingLocationFor.category === "camera-list")
										setEditCameraData(updatedData);
									else if (pickingLocationFor.category === "doituong-list")
										setEditDoiTuongData(updatedData);
									else if (pickingLocationFor.category === "coquan-list")
										setEditCoQuanData(updatedData);
									else if (pickingLocationFor.category === "cskd-list")
										setEditCskdData(updatedData);
									else if (pickingLocationFor.category === "diemnong-list")
										setEditDiemNongData(updatedData);
									else if (pickingLocationFor.category === "tuyenduong-list")
										setEditTuyenDuongData(updatedData);

									setPickingLocationFor(null);
									setTempPickedCoords(null);
								}}
								className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[10px] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5">
								Xác nhận tọa độ
							</button>
							<button
								type="button"
								onClick={() => {
									if (pickingLocationFor.category === "vuviec-list")
										setEditIncidentData(pickingLocationFor.originalData);
									else if (pickingLocationFor.category === "camera-list")
										setEditCameraData(pickingLocationFor.originalData);
									else if (pickingLocationFor.category === "doituong-list")
										setEditDoiTuongData(pickingLocationFor.originalData);
									else if (pickingLocationFor.category === "coquan-list")
										setEditCoQuanData(pickingLocationFor.originalData);
									else if (pickingLocationFor.category === "cskd-list")
										setEditCskdData(pickingLocationFor.originalData);
									else if (pickingLocationFor.category === "diemnong-list")
										setEditDiemNongData(pickingLocationFor.originalData);
									else if (pickingLocationFor.category === "tuyenduong-list")
										setEditTuyenDuongData(pickingLocationFor.originalData);

									setPickingLocationFor(null);
									setTempPickedCoords(null);
								}}
								className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-[10px] uppercase tracking-wider transition-colors cursor-pointer">
								Hủy bỏ
							</button>
						</div>
					</motion.div>
				)}
				{isEditingRouteCoords && (
					<motion.div
						initial={{ opacity: 0, y: -20, x: "-50%" }}
						animate={{ opacity: 1, y: 0, x: "-50%" }}
						exit={{ opacity: 0, y: -20, x: "-50%" }}
						className="absolute top-6 left-1/2 transform z-[2000] w-[460px] glass p-4 rounded-3xl shadow-2xl border border-white/50 space-y-3 flex flex-col text-slate-800 text-center select-none">
						<div>
							<span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-sky-500 text-white animate-pulse">
								Chế độ vẽ / Chọn lại tọa độ
							</span>
							<h3 className="text-xs font-black text-slate-850 mt-1.5 uppercase truncate max-w-full">
								Sửa tọa độ: {pendingEditTuyenDuongData?.ten || "Tuyến đường"}
							</h3>
							<p className="text-[9px] text-slate-450 font-bold uppercase tracking-wider mt-0.5">
								Nhấp lên bản đồ để vẽ • Đã chọn {routeCoordinates.length} điểm
							</p>
						</div>

						<div className="flex items-center justify-center gap-2">
							<button
								type="button"
								onClick={() => {
									if (routeCoordinates.length > 0) {
										setRouteCoordinates((prev) => prev.slice(0, -1));
									}
								}}
								disabled={routeCoordinates.length === 0}
								className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-[10px] rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
								<RotateCcw className="w-3.5 h-3.5" /> Hoàn tác
							</button>

							<button
								type="button"
								onClick={() => setRouteCoordinates([])}
								disabled={routeCoordinates.length === 0}
								className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-rose-50 border border-slate-200 text-slate-700 hover:text-rose-600 font-bold text-[10px] rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
								<Trash2 className="w-3.5 h-3.5" /> Vẽ lại
							</button>

							<button
								type="button"
								onClick={() => {
									if (routeCoordinates.length < 2) {
										alert(
											"Tuyến đường phải có ít nhất 2 điểm tọa độ để kết nối!",
										);
										return;
									}
									// Confirm coordinates
									const updatedData = {
										...pendingEditTuyenDuongData,
										coordinates: routeCoordinates,
									};
									setEditTuyenDuongData(updatedData);
									setPendingEditTuyenDuongData(null);
									setIsEditingRouteCoords(false);
								}}
								className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer">
								<Check className="w-3.5 h-3.5" /> Hoàn thành
							</button>

							<button
								type="button"
								onClick={() => {
									// Cancel and restore
									setEditTuyenDuongData(pendingEditTuyenDuongData);
									setPendingEditTuyenDuongData(null);
									setIsEditingRouteCoords(false);
								}}
								className="flex items-center gap-1.5 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white font-bold text-[10px] rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer">
								<X className="w-3.5 h-3.5" /> Hủy
							</button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			<div ref={mapContainer} className="w-full h-full" />
		</div>
	);
}
