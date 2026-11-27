import { BusinessLicenseInfo } from "../types";

export const PERSON_TAG_OPTIONS: string[] = [
	"Ma túy",
	"Trộm cắp",
	"Cờ bạc",
	"Hình sự",
	"Cướp giật",
	"Gây rối TTCC",
	"Cố ý gây thương tích",
	"Nghi vấn",
];

export const PERSON_ACTIVITY_TYPES: string[] = [
	"Tiền án",
	"Tiền sự",
	"Nghi vấn",
	"Kiểm tra hành chính",
	"Khác",
];

export const INSPECTION_RESULT_OPTIONS: string[] = [
	"Đạt",
	"Nhắc nhở",
	"Xử phạt",
	"Đình chỉ",
];

/** Tính khoảng cách giữa 2 tọa độ WGS84 theo công thức Haversine (đơn vị: mét) */
export function calculateDistanceMeters(
	lat1: number,
	lng1: number,
	lat2: number,
	lng2: number,
): number {
	const toRad = (deg: number) => (deg * Math.PI) / 180;
	const R = 6371000;
	const dLat = toRad(lat2 - lat1);
	const dLng = toRad(lng2 - lng1);
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(toRad(lat1)) *
			Math.cos(toRad(lat2)) *
			Math.sin(dLng / 2) *
			Math.sin(dLng / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

export function formatDistanceMeters(meters: number): string {
	if (!Number.isFinite(meters)) return "—";
	if (meters < 1000) return `${Math.round(meters)} m`;
	return `${(meters / 1000).toFixed(2)} km`;
}

/** Nén ảnh tải lên thành Data URL JPEG nhỏ gọn để lưu hoàn toàn offline */
export function compressImageToDataUrl(
	file: File,
	maxSize = 480,
	quality = 0.78,
): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onerror = () => reject(new Error("Không thể đọc tệp hình ảnh."));
		reader.onload = () => {
			const img = new Image();
			img.onerror = () => reject(new Error("Tệp hình ảnh không hợp lệ."));
			img.onload = () => {
				let { width, height } = img;
				if (width > maxSize || height > maxSize) {
					if (width >= height) {
						height = Math.round((height * maxSize) / width);
						width = maxSize;
					} else {
						width = Math.round((width * maxSize) / height);
						height = maxSize;
					}
				}
				const canvas = document.createElement("canvas");
				canvas.width = width;
				canvas.height = height;
				const ctx = canvas.getContext("2d");
				if (!ctx) {
					resolve(String(reader.result || ""));
					return;
				}
				ctx.drawImage(img, 0, 0, width, height);
				resolve(canvas.toDataURL("image/jpeg", quality));
			};
			img.src = String(reader.result || "");
		};
		reader.readAsDataURL(file);
	});
}

/** Đánh giá trạng thái thực tế của giấy phép ANTT / PCCC theo ngày hết hạn */
export function evaluateLicenseStatus(license?: BusinessLicenseInfo): {
	label: string;
	tone: "emerald" | "amber" | "rose" | "slate";
} {
	if (!license || (!license.so_giay_phep && !license.ngay_cap && !license.ngay_het_han && !license.trang_thai)) {
		return { label: "Chưa cập nhật", tone: "slate" };
	}

	if (license.trang_thai === "Chưa có") {
		return { label: "Chưa có", tone: "slate" };
	}

	if (license.ngay_het_han) {
		const exp = new Date(license.ngay_het_han);
		if (!isNaN(exp.getTime())) {
			const now = new Date();
			const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
			if (diffDays < 0) return { label: "Hết hạn", tone: "rose" };
			if (diffDays <= 30) return { label: `Sắp hết hạn (${diffDays} ngày)`, tone: "amber" };
			return { label: "Còn hạn", tone: "emerald" };
		}
	}

	if (license.trang_thai === "Hết hạn") return { label: "Hết hạn", tone: "rose" };
	if (license.trang_thai === "Sắp hết hạn") return { label: "Sắp hết hạn", tone: "amber" };
	if (license.trang_thai === "Còn hạn" || license.so_giay_phep) {
		return { label: "Còn hạn", tone: "emerald" };
	}
	return { label: "Chưa cập nhật", tone: "slate" };
}
