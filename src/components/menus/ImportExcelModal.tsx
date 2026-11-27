import React, { useState, useEffect } from "react";
import { X, UploadCloud, Download, Check, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import * as XLSX from "xlsx";
import { authService, getCategoryDisplayName } from "../../utils/authService";
import { getLocalDateStr, getLocalDateTimeStr } from "../../utils/dateUtils";

interface ImportExcelModalProps {
	showImport: boolean;
	setShowImport: (val: boolean) => void;
	activeMenu: string | null;
	handleImport: (category: string, data: any[]) => void;
	allowedCategories?: string[];
}

const IMPORT_CATEGORIES = [
	{ value: "vuviec-list", menuId: "menu-vuviec", label: "Vụ việc an ninh trật tự" },
	{ value: "camera-list", menuId: "menu-camera", label: "Camera giám sát" },
	{ value: "doituong-list", menuId: "menu-doituong", label: "Đối tượng quản lý" },
	{ value: "coquan-list", menuId: "menu-coquan", label: "Cơ quan nhà nước" },
	{ value: "cskd-list", menuId: "menu-cskd", label: "Cơ sở kinh doanh" },
	{ value: "diemnong-list", menuId: "menu-diemnong", label: "Điểm nóng an ninh" },
	{ value: "tuyenduong-list", menuId: "menu-tuyenduong", label: "Tuyến đường & Chốt tuần tra" },
];

/** Phân tích chuỗi tọa độ tuyến: hỗ trợ "lng,lat ; lng,lat" hoặc JSON "[[lng,lat],...]" */
function parseRouteCoordinateList(raw: any): [number, number][] {
	if (!raw) return [];
	const str = String(raw).trim();
	if (!str) return [];

	if (str.startsWith("[")) {
		try {
			const parsed = JSON.parse(str);
			if (Array.isArray(parsed)) {
				return parsed
					.map((pair: any) => [Number(pair?.[0]), Number(pair?.[1])] as [number, number])
					.filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat));
			}
		} catch {
			// Fall through to delimiter parser
		}
	}

	return str
		.split(/[;|\n]+/)
		.map((part) => part.trim())
		.filter(Boolean)
		.map((pairStr) => {
			const nums = pairStr.split(/[,:\s]+/).map((n) => parseFloat(n.trim()));
			return [nums[0], nums[1]] as [number, number];
		})
		.filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat));
}

export default function ImportExcelModal({
	showImport,
	setShowImport,
	activeMenu,
	handleImport,
	allowedCategories,
}: ImportExcelModalProps) {
	const visibleImportCategories =
		Array.isArray(allowedCategories) && allowedCategories.length > 0
			? IMPORT_CATEGORIES.filter((c) => allowedCategories.includes(c.value))
			: IMPORT_CATEGORIES;

	const [category, setCategory] = useState(
		visibleImportCategories[0]?.value || "vuviec-list",
	);
	const [dragActive, setDragActive] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [fileName, setFileName] = useState<string | null>(null);
	const [pendingData, setPendingData] = useState<any[] | null>(null);

	// Đồng bộ danh mục đang mở trên Bảng lớn / Sidebar
	useEffect(() => {
		if (showImport) {
			setErrorMessage(null);
			setFileName(null);
			setPendingData(null);
			const matched = visibleImportCategories.find(
				(c) => c.menuId === activeMenu || c.value === activeMenu,
			);
			setCategory(
				matched ? matched.value : visibleImportCategories[0]?.value || "vuviec-list",
			);
		}
	}, [activeMenu, showImport, allowedCategories]);

	if (!showImport) return null;

	const getHeaderTitle = () => {
		if (category === "camera-list") return "Nhập dữ liệu Camera";
		if (category === "doituong-list") return "Nhập dữ liệu Đối tượng";
		if (category === "coquan-list") return "Nhập dữ liệu Cơ quan nhà nước";
		if (category === "cskd-list") return "Nhập dữ liệu Cơ sở kinh doanh";
		if (category === "diemnong-list") return "Nhập dữ liệu Điểm nóng";
		if (category === "tuyenduong-list") return "Nhập dữ liệu Tuyến đường";
		return "Nhập dữ liệu Vụ việc";
	};

	const getHeaderDesc = () => {
		if (category === "camera-list") return "Tải lên danh sách camera giám sát";
		if (category === "doituong-list") return "Tải lên hồ sơ đối tượng theo dõi";
		if (category === "coquan-list") return "Tải lên danh sách cơ quan hành chính, trường học, y tế";
		if (category === "cskd-list") return "Tải lên danh sách cơ sở kinh doanh";
		if (category === "diemnong-list") return "Tải lên danh sách điểm nóng an ninh";
		if (category === "tuyenduong-list") return "Tải lên danh sách tuyến tuần tra & điểm chốt";
		return "Tải lên danh sách vụ việc an ninh";
	};

	// Tạo và tải biểu mẫu Excel chuẩn ngoại tuyến cho đủ 7 danh mục
	const downloadTemplate = () => {
		let templateData: any[] = [];
		let dlFileName = "";
		let sheetName = "";

		if (category === "vuviec-list") {
			dlFileName = "template_vuviec.xlsx";
			sheetName = "VuViec";
			templateData = [
				{
					"Tên vụ việc": "Trộm cắp xe máy",
					"Kinh độ": 106.105,
					"Vĩ độ": 11.31,
					"Địa chỉ": "Phường Bình Minh",
					"Thời gian": "2026-11-17T10:30",
					"Trạng thái": "Đang xử lý",
					"Kết quả": "Đang điều tra",
					"Group ID": "GRP-001",
					"Mô tả": "Mất xe máy Honda SH màu xám tại khu dân cư",
				},
				{
					"Tên vụ việc": "Cướp giật tài sản",
					"Kinh độ": 106.13,
					"Vĩ độ": 11.275,
					"Địa chỉ": "Phường Bình Minh",
					"Thời gian": "2026-11-16T19:15",
					"Trạng thái": "Mới",
					"Kết quả": "",
					"Group ID": "",
					"Mô tả": "Giật điện thoại của người đi đường",
				},
			];
		} else if (category === "camera-list") {
			dlFileName = "template_camera.xlsx";
			sheetName = "Camera";
			templateData = [
				{
					"Tên camera": "Camera ngã tư Bình Minh",
					"Kinh độ": 106.118307,
					"Vĩ độ": 11.338781,
					"Địa chỉ": "Phường Bình Minh",
					"Chủ sở hữu": "Công an Phường Bình Minh",
					"Số điện thoại": "02763822115",
					"Mô tả": "Lắp ở cột đèn tín hiệu giao thông, hướng Tây Bắc",
					"Trạng thái": "Hoạt động",
				},
				{
					"Tên camera": "Camera ngõ 12 Đường 30/4",
					"Kinh độ": 106.11,
					"Vĩ độ": 11.32,
					"Địa chỉ": "Phường Bình Minh",
					"Chủ sở hữu": "Nguyễn Văn A (Dân cư)",
					"Số điện thoại": "0987654321",
					"Mô tả": "Camera gia đình quan sát toàn bộ hẻm",
					"Trạng thái": "Tạm ngưng",
				},
			];
		} else if (category === "doituong-list") {
			dlFileName = "template_doituong.xlsx";
			sheetName = "DoiTuong";
			templateData = [
				{
					"Họ và tên": "Nguyễn Văn A",
					"Kinh độ": 106.11,
					"Vĩ độ": 11.29,
					"Địa chỉ": "Phường Bình Minh",
					"Số CCCD": "072096001234",
					"Loại đối tượng": "Tội phạm ma túy",
					"Số điện thoại": "0912345678",
					"Mô tả": "Đối tượng có tiền án tàng trữ ma túy, đang diện theo dõi",
				},
				{
					"Họ và tên": "Trần Văn B",
					"Kinh độ": 106.09,
					"Vĩ độ": 11.27,
					"Địa chỉ": "Phường Bình Minh",
					"Số CCCD": "072095009876",
					"Loại đối tượng": "Trộm cắp tài sản",
					"Số điện thoại": "0988888888",
					"Mô tả": "Nghi phạm trộm xe chuyên nghiệp khu vực chợ",
				},
			];
		} else if (category === "coquan-list") {
			dlFileName = "template_coquan.xlsx";
			sheetName = "CoQuan";
			templateData = [
				{
					"Tên cơ quan": "UBND Phường Bình Minh",
					"Kinh độ": 106.118307,
					"Vĩ độ": 11.338781,
					"Phân loại": "Ủy ban nhân dân",
					"Địa bàn": "Phường Bình Minh",
				},
				{
					"Tên cơ quan": "Công an Phường Bình Minh",
					"Kinh độ": 106.11912,
					"Vĩ độ": 11.33925,
					"Phân loại": "Công an",
					"Địa bàn": "Phường Bình Minh",
				},
			];
		} else if (category === "cskd-list") {
			dlFileName = "template_cosokinhdoanh.xlsx";
			sheetName = "CoSoKinhDoanh";
			templateData = [
				{
					"Tên cơ sở": "Karaoke GOLD",
					"Kinh độ": 106.106096,
					"Vĩ độ": 11.319872,
					"Mã số thuế": "3901234567",
					"Loại hình kinh doanh": "Công ty TNHH",
					"Ngành nghề chính": "Karaoke",
					"Trạng thái hoạt động": "Đang hoạt động",
					"Giấy phép liên quan": "GPKD số 123/2024, ANTT số 456/2024",
					"Họ tên chủ": "Nguyễn Văn A",
					"Ngày sinh chủ": "01/01/1980",
					"CCCD chủ": "072090012345",
					"SĐT chủ": "0912345678",
					"Địa chỉ chủ": "Phường Bình Minh, Tây Ninh",
					"Họ tên quản lý": "Trần Văn B",
					"Ngày sinh quản lý": "02/02/1985",
					"CCCD quản lý": "072085009876",
					"SĐT quản lý": "0987654321",
					"Địa chỉ quản lý": "Phường Bình Minh, Tây Ninh",
				},
			];
		} else if (category === "diemnong-list") {
			dlFileName = "template_diemnong.xlsx";
			sheetName = "DiemNong";
			templateData = [
				{
					"Tên điểm nóng": "Khu vực chợ trung tâm",
					"Kinh độ": 106.101234,
					"Vĩ độ": 11.314567,
					"Phân loại": "Tệ nạn xã hội",
					"Mức độ cảnh báo": "Cao",
					"Địa bàn": "Phường Bình Minh",
					"Bán kính ảnh hưởng (mét)": 200,
					"Mô tả tình hình":
						"Điểm tập trung mua bán, sử dụng trái phép chất ma túy phức tạp",
				},
				{
					"Tên điểm nóng": "Ngã tư đường Hùng Vương",
					"Kinh độ": 106.115432,
					"Vĩ độ": 11.325432,
					"Phân loại": "Tụ tập cờ bạc",
					"Mức độ cảnh báo": "Trung bình",
					"Địa bàn": "Phường Bình Minh",
					"Bán kính ảnh hưởng (mét)": 150,
					"Mô tả tình hình":
						"Thường xuyên có nhóm đối tượng tụ tập đánh bài ăn tiền vào buổi tối",
				},
			];
		} else if (category === "tuyenduong-list") {
			dlFileName = "template_tuyenduong.xlsx";
			sheetName = "TuyenDuong";
			templateData = [
				{
					"Tên tuyến đường": "Tuyến tuần tra liên khu phố",
					"Phân loại": "Tuần tra an ninh",
					"Kiểu hình học": "Tuyến vẽ",
					"Mức độ cảnh báo": "Cao",
					"Kinh độ": 106.1125,
					"Vĩ độ": 11.3342,
					"Danh sách tọa độ tuyến":
						"106.112500,11.334200 ; 106.118307,11.338781 ; 106.123400,11.341800",
				},
				{
					"Tên tuyến đường": "Chốt kiểm soát cửa ngõ phía Bắc",
					"Phân loại": "Chốt kiểm soát",
					"Kiểu hình học": "Điểm chốt",
					"Mức độ cảnh báo": "Trung bình",
					"Kinh độ": 106.118307,
					"Vĩ độ": 11.34512,
					"Danh sách tọa độ tuyến": "",
				},
			];
		}

		const ws = XLSX.utils.json_to_sheet(templateData);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, sheetName);

		const maxCols = Object.keys(templateData[0]).map((key) => ({
			wch: Math.max(key.length + 6, 22),
		}));
		ws["!cols"] = maxCols;

		XLSX.writeFile(wb, dlFileName);
		authService.logAction({
			eventType: "TEMPLATE_DOWNLOADED",
			status: "info",
			category,
			targetName: dlFileName,
			message: `Tải xuống tệp Excel mẫu quy ước "${dlFileName}" cho danh mục ${getCategoryDisplayName(category)}`,
		});
	};

	// Đọc file Excel và chuẩn hóa dữ liệu cho cả 7 danh mục
	const processFile = (file: File) => {
		setErrorMessage(null);
		const reader = new FileReader();
		reader.onload = (event) => {
			try {
				const fileData = event.target?.result;
				const workbook = XLSX.read(fileData, { type: "binary" });
				const firstSheetName = workbook.SheetNames[0];
				const worksheet = workbook.Sheets[firstSheetName];

				const json = XLSX.utils.sheet_to_json(worksheet) as any[];
				const dataToImport: any[] = [];

				if (!json || json.length === 0) {
					setErrorMessage("File Excel không chứa bất kỳ dữ liệu nào.");
					return;
				}

				const todayLocalStr = getLocalDateStr();
				const nowLocalDateTime = getLocalDateTimeStr();

				for (let i = 0; i < json.length; i++) {
					const row = json[i];
					const rowCreatedDate = String(row["Ngày tạo"] || "").trim() || todayLocalStr;

					if (category === "tuyenduong-list") {
						const routeName = String(row["Tên tuyến đường"] || "").trim();
						if (!routeName) continue;

						const parsedCoords = parseRouteCoordinateList(
							row["Danh sách tọa độ tuyến"],
						);
						const itemLng = parseFloat(row["Kinh độ"]);
						const itemLat = parseFloat(row["Vĩ độ"]);
						const geometryHint = String(row["Kiểu hình học"] || "")
							.trim()
							.toLowerCase();

						if (
							parsedCoords.length >= 2 &&
							!geometryHint.includes("điểm")
						) {
							dataToImport.push({
								id: Date.now() + i,
								ten: routeName,
								loai: String(row["Phân loại"] || "Tuần tra an ninh").trim(),
								mucdo: String(row["Mức độ cảnh báo"] || "Trung bình").trim(),
								type: "line",
								lng: parsedCoords[0][0],
								lat: parsedCoords[0][1],
								coordinates: parsedCoords,
								ngay_tao: rowCreatedDate,
							});
						} else if (!isNaN(itemLng) && !isNaN(itemLat)) {
							dataToImport.push({
								id: Date.now() + i,
								ten: routeName,
								loai: String(row["Phân loại"] || "Chốt tuần tra").trim(),
								mucdo: String(row["Mức độ cảnh báo"] || "Trung bình").trim(),
								type: "point",
								lng: itemLng,
								lat: itemLat,
								ngay_tao: rowCreatedDate,
							});
						} else if (parsedCoords.length === 1) {
							dataToImport.push({
								id: Date.now() + i,
								ten: routeName,
								loai: String(row["Phân loại"] || "Chốt tuần tra").trim(),
								mucdo: String(row["Mức độ cảnh báo"] || "Trung bình").trim(),
								type: "point",
								lng: parsedCoords[0][0],
								lat: parsedCoords[0][1],
								ngay_tao: rowCreatedDate,
							});
						}
						continue;
					}

					const itemLng = parseFloat(row["Kinh độ"]);
					const itemLat = parseFloat(row["Vĩ độ"]);

					if (isNaN(itemLng) || isNaN(itemLat)) {
						continue;
					}

					if (category === "vuviec-list") {
						if (row["Tên vụ việc"]) {
							dataToImport.push({
								id: "INC-" + Date.now() + "-" + i,
								loai: String(row["Tên vụ việc"] || "").trim(),
								lng: itemLng,
								lat: itemLat,
								diachi: String(row["Địa chỉ"] || "").trim(),
								thoigian:
									String(row["Thời gian"] || "").trim() || nowLocalDateTime,
								trangthai: String(row["Trạng thái"] || "").trim() || "Mới",
								ketqua: String(row["Kết quả"] || "").trim(),
								groupId: String(row["Group ID"] || "").trim(),
								mota: String(row["Mô tả"] || "").trim(),
								ngay_tao: rowCreatedDate,
							});
						}
					} else if (category === "camera-list") {
						if (row["Tên camera"]) {
							dataToImport.push({
								id: "CAM-" + Date.now() + "-" + i,
								ten: String(row["Tên camera"] || "").trim(),
								lng: itemLng,
								lat: itemLat,
								diachi: String(row["Địa chỉ"] || "").trim(),
								chu_camera: String(row["Chủ sở hữu"] || "").trim(),
								sdt_chu: String(row["Số điện thoại"] || "").trim(),
								description: String(row["Mô tả"] || "").trim(),
								trangthai: String(row["Trạng thái"] || "").trim() || "Hoạt động",
								ngay_tao: rowCreatedDate,
							});
						}
					} else if (category === "doituong-list") {
						if (row["Họ và tên"]) {
							dataToImport.push({
								id: "DT-" + Date.now() + "-" + i,
								hoten: String(row["Họ và tên"] || "").trim(),
								lng: itemLng,
								lat: itemLat,
								diachi: String(row["Địa chỉ"] || "").trim(),
								cccd: String(row["Số CCCD"] || "").trim(),
								loai: String(row["Loại đối tượng"] || "").trim(),
								sdt: String(row["Số điện thoại"] || "").trim(),
								mota: String(row["Mô tả"] || "").trim(),
								ngay_tao: rowCreatedDate,
							});
						}
					} else if (category === "coquan-list") {
						if (row["Tên cơ quan"]) {
							dataToImport.push({
								ten: String(row["Tên cơ quan"] || "").trim(),
								lng: itemLng,
								lat: itemLat,
								loai: String(row["Phân loại"] || "Cơ quan hành chính").trim(),
								xaphuong: String(row["Địa bàn"] || "Phường Bình Minh").trim(),
								ngay_tao: rowCreatedDate,
							});
						}
					} else if (category === "cskd-list") {
						if (row["Tên cơ sở"]) {
							dataToImport.push({
								id: "CSKD-" + Date.now() + "-" + i,
								ten: String(row["Tên cơ sở"] || "").trim(),
								lng: itemLng,
								lat: itemLat,
								mst: String(row["Mã số thuế"] || "").trim(),
								loai_hinh_kd: String(
									row["Loại hình kinh doanh"] || "Hộ kinh doanh cá thể",
								).trim(),
								loai: String(row["Ngành nghề chính"] || "").trim(),
								trangthai: String(
									row["Trạng thái hoạt động"] || "Đang hoạt động",
								).trim(),
								giay_phep: String(row["Giấy phép liên quan"] || "").trim(),
								chu_co_so: String(row["Họ tên chủ"] || "").trim(),
								chu_ngaysinh: String(row["Ngày sinh chủ"] || "").trim(),
								chu_cccd: String(row["CCCD chủ"] || "").trim(),
								chu_sdt: String(row["SĐT chủ"] || "").trim(),
								chu_diachi: String(row["Địa chỉ chủ"] || "").trim(),
								quan_ly: String(row["Họ tên quản lý"] || "").trim(),
								quan_ly_ngaysinh: String(row["Ngày sinh quản lý"] || "").trim(),
								quan_ly_cccd: String(row["CCCD quản lý"] || "").trim(),
								quan_ly_sdt: String(row["SĐT quản lý"] || "").trim(),
								quan_ly_diachi: String(row["Địa chỉ quản lý"] || "").trim(),
								ngay_tao: rowCreatedDate,
							});
						}
					} else if (category === "diemnong-list") {
						if (row["Tên điểm nóng"]) {
							dataToImport.push({
								id: Date.now() + i,
								ten: String(row["Tên điểm nóng"] || "").trim(),
								lng: itemLng,
								lat: itemLat,
								loai: String(row["Phân loại"] || "").trim(),
								mucdo: String(row["Mức độ cảnh báo"] || "Trung bình").trim(),
								xaphuong: String(row["Địa bàn"] || "").trim(),
								radius:
									row["Bán kính ảnh hưởng (mét)"] !== undefined &&
									row["Bán kính ảnh hưởng (mét)"] !== null &&
									!isNaN(parseInt(row["Bán kính ảnh hưởng (mét)"]))
										? parseInt(row["Bán kính ảnh hưởng (mét)"])
										: 300,
								mota: String(row["Mô tả tình hình"] || "").trim(),
								ngay_tao: rowCreatedDate,
							});
						}
					}
				}

				if (dataToImport.length > 0) {
					setPendingData(dataToImport);
					setFileName(file.name);
				} else {
					const errorHints: Record<string, string> = {
						"vuviec-list":
							"Vui lòng kiểm tra lại file. Mẫu Vụ việc yêu cầu các cột: 'Tên vụ việc', 'Kinh độ', 'Vĩ độ'.",
						"camera-list":
							"Vui lòng kiểm tra lại file. Mẫu Camera yêu cầu các cột: 'Tên camera', 'Kinh độ', 'Vĩ độ'.",
						"doituong-list":
							"Vui lòng kiểm tra lại file. Mẫu Đối tượng yêu cầu các cột: 'Họ và tên', 'Kinh độ', 'Vĩ độ'.",
						"coquan-list":
							"Vui lòng kiểm tra lại file. Mẫu Cơ quan nhà nước yêu cầu các cột: 'Tên cơ quan', 'Kinh độ', 'Vĩ độ'.",
						"cskd-list":
							"Vui lòng kiểm tra lại file. Mẫu Cơ sở kinh doanh yêu cầu các cột: 'Tên cơ sở', 'Kinh độ', 'Vĩ độ'.",
						"diemnong-list":
							"Vui lòng kiểm tra lại file. Mẫu Điểm nóng yêu cầu các cột: 'Tên điểm nóng', 'Kinh độ', 'Vĩ độ'.",
						"tuyenduong-list":
							"Vui lòng kiểm tra lại file. Mẫu Tuyến đường yêu cầu cột 'Tên tuyến đường' kèm ('Kinh độ', 'Vĩ độ') hoặc cột 'Danh sách tọa độ tuyến'.",
					};
					setErrorMessage(
						errorHints[category] || "Không tìm thấy dòng dữ liệu hợp lệ trong tệp Excel.",
					);
				}
			} catch (error) {
				console.error(error);
				setErrorMessage("Đã xảy ra lỗi khi đọc tệp Excel. Định dạng file có thể bị hỏng.");
			}
		};
		reader.readAsBinaryString(file);
	};

	const handleDrag = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.type === "dragenter" || e.type === "dragover") {
			setDragActive(true);
		} else if (e.type === "dragleave") {
			setDragActive(false);
		}
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);
		if (e.dataTransfer.files && e.dataTransfer.files[0]) {
			processFile(e.dataTransfer.files[0]);
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			processFile(e.target.files[0]);
		}
	};

	return (
		<AnimatePresence>
			<div className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm z-[2100] flex items-center justify-center p-6">
				<motion.div
					initial={{ scale: 0.94, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					exit={{ scale: 0.94, opacity: 0 }}
					className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col border border-slate-200">
					{/* Header */}
					<div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
						<div>
							<h2 className="text-base font-extrabold text-slate-800 uppercase tracking-wide">
								{getHeaderTitle()}
							</h2>
							<p className="text-xs text-slate-500 font-medium mt-0.5">
								{getHeaderDesc()}
							</p>
						</div>
						<button
							type="button"
							onClick={() => setShowImport(false)}
							className="text-slate-400 hover:text-slate-700 p-2 hover:bg-slate-200/60 rounded-xl transition-all cursor-pointer">
							<X className="w-5 h-5" />
						</button>
					</div>

					<div className="p-6 space-y-4">
						{/* Chọn danh mục nhập Excel trực tiếp */}
						<div className="space-y-1.5">
							<label className="text-xs font-bold text-slate-600 block">
								Danh mục cần nhập dữ liệu:
							</label>
							<select
								value={category}
								onChange={(e) => {
									setCategory(e.target.value);
									setPendingData(null);
									setFileName(null);
									setErrorMessage(null);
								}}
								className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 rounded-xl px-3.5 py-2.5 text-[13px] font-bold text-slate-800 outline-none cursor-pointer">
								{visibleImportCategories.map((c) => (
									<option key={c.value} value={c.value}>
										{c.label}
									</option>
								))}
							</select>
						</div>

						{errorMessage && (
							<div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-700 text-xs font-semibold leading-relaxed">
								<AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
								<span>{errorMessage}</span>
							</div>
						)}

						{pendingData ? (
							<div className="space-y-4">
								<div className="p-6 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex flex-col items-center text-center gap-3">
									<div className="w-12 h-12 bg-white border border-emerald-200 rounded-2xl flex items-center justify-center text-emerald-600 shadow-xs">
										<Check className="w-6 h-6" />
									</div>
									<div className="space-y-1">
										<h4 className="text-sm font-bold text-slate-800">
											Tệp dữ liệu hợp lệ và sẵn sàng nhập
										</h4>
										<p className="text-xs text-slate-600 font-mono truncate max-w-[340px] bg-white border border-slate-200 px-3 py-1 rounded-lg mt-1 inline-block">
											{fileName}
										</p>
									</div>
									<p className="text-[13px] text-slate-700 font-semibold">
										Số lượng bản ghi đọc được:{" "}
										<span className="text-emerald-700 font-extrabold text-base font-mono">
											{pendingData.length}
										</span>{" "}
										bản ghi.
									</p>
								</div>

								<div className="grid grid-cols-2 gap-3 pt-1">
									<button
										type="button"
										onClick={() => {
											setPendingData(null);
											setFileName(null);
											setErrorMessage(null);
										}}
										className="py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 transition-all text-center cursor-pointer">
										Chọn tệp khác
									</button>
									<button
										type="button"
										onClick={() => handleImport(category, pendingData)}
										className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[13px] font-bold transition-all text-center cursor-pointer shadow-sm flex items-center justify-center gap-1.5">
										<Check className="w-4 h-4" /> Xác nhận nhập
									</button>
								</div>
							</div>
						) : (
							<div
								onDragEnter={handleDrag}
								onDragOver={handleDrag}
								onDragLeave={handleDrag}
								onDrop={handleDrop}
								className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all ${
									dragActive
										? "border-sky-500 bg-sky-50/50"
										: "border-slate-300 bg-slate-50/40 hover:bg-slate-50 hover:border-sky-400"
								}`}>
								<div className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-sky-600 shadow-2xs mb-3">
									<UploadCloud className="w-6 h-6" />
								</div>
								<h4 className="text-[13px] font-bold text-slate-800">
									Bấm vào đây để chọn file Excel hoặc kéo thả vào khung
								</h4>
								<p className="text-xs text-slate-500 font-medium mt-1">
									Hỗ trợ định dạng: .xlsx hoặc .xls
								</p>

								<input
									type="file"
									accept=".xlsx, .xls"
									onChange={handleFileChange}
									className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
								/>
							</div>
						)}

						{/* Tải file mẫu quy ước */}
						<div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-100 flex items-center justify-between gap-4">
							<div className="text-left">
								<h5 className="text-xs font-bold text-slate-800">
									Chưa có biểu mẫu chuẩn?
								</h5>
								<p className="text-[11px] text-slate-500 font-medium mt-0.5">
									Tải file Excel mẫu đúng cột của danh mục đang chọn
								</p>
							</div>
							<button
								type="button"
								onClick={downloadTemplate}
								className="py-2.5 px-3.5 bg-white hover:bg-sky-600 text-sky-700 hover:text-white border border-sky-200 hover:border-sky-600 rounded-xl transition-all text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0">
								<Download className="w-4 h-4" /> Tải Excel Mẫu
							</button>
						</div>
					</div>
				</motion.div>
			</div>
		</AnimatePresence>
	);
}
