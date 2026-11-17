/**
 * Tiện ích xử lý thời gian theo múi giờ nội bộ của máy trạm (Local Time - UTC+7)
 * Tránh lỗi lệch -7 tiếng khi dùng Date.prototype.toISOString() (UTC).
 */

const pad2 = (n: number): string => String(n).padStart(2, "0");

/** Trả về ngày hiện tại theo giờ máy trạm: YYYY-MM-DD */
export function getLocalDateStr(date: Date = new Date()): string {
	return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** Trả về ngày giờ hiện tại theo giờ máy trạm: YYYY-MM-DDTHH:mm (chuẩn input datetime-local) */
export function getLocalDateTimeStr(date: Date = new Date()): string {
	return `${getLocalDateStr(date)}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

/** Định dạng hiển thị ngày giờ tiếng Việt: HH:mm - DD/MM/YYYY */
export function formatVnDateTime(date: Date = new Date()): string {
	return `${pad2(date.getHours())}:${pad2(date.getMinutes())} - ${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/**
 * Phân tích chuỗi ngày tháng từ nhiều định dạng (ISO, datetime-local, DD/MM/YYYY, Excel serial...)
 * về đối tượng Date theo múi giờ máy trạm (Local Time).
 */
export function parseFlexibleLocalDate(
	raw?: string | number | null,
	fallbackId?: string | number,
): Date | null {
	if (raw !== undefined && raw !== null && String(raw).trim() !== "") {
		const str = String(raw).trim();

		// 1. YYYY-MM-DD hoặc YYYY-MM-DDTHH:mm(:ss) hoặc YYYY-MM-DD HH:mm(:ss)
		const isoMatch = str.match(
			/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/,
		);
		if (isoMatch) {
			const [, y, m, d, hh = "0", mm = "0", ss = "0"] = isoMatch;
			const dt = new Date(
				Number(y),
				Number(m) - 1,
				Number(d),
				Number(hh),
				Number(mm),
				Number(ss),
			);
			if (!isNaN(dt.getTime())) return dt;
		}

		// 2. DD/MM/YYYY hoặc DD-MM-YYYY (kèm giờ trước hoặc sau)
		const vnDateFirst = str.match(
			/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/,
		);
		if (vnDateFirst) {
			const [, d, m, y, hh = "0", mm = "0", ss = "0"] = vnDateFirst;
			const dt = new Date(
				Number(y),
				Number(m) - 1,
				Number(d),
				Number(hh),
				Number(mm),
				Number(ss),
			);
			if (!isNaN(dt.getTime())) return dt;
		}

		const vnTimeFirst = str.match(
			/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?\s+(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/,
		);
		if (vnTimeFirst) {
			const [, hh, mm, ss = "0", d, m, y] = vnTimeFirst;
			const dt = new Date(
				Number(y),
				Number(m) - 1,
				Number(d),
				Number(hh),
				Number(mm),
				Number(ss),
			);
			if (!isNaN(dt.getTime())) return dt;
		}

		// 3. Số serial ngày của Excel (ví dụ 45000..55000)
		if (/^\d{5}(\.\d+)?$/.test(str)) {
			const serial = parseFloat(str);
			if (serial > 30000 && serial < 70000) {
				const utcDays = Math.floor(serial - 25569);
				const fracDay = serial - Math.floor(serial);
				const totalSeconds = Math.round(fracDay * 86400);
				const tempUtc = new Date(utcDays * 86400 * 1000);
				return new Date(
					tempUtc.getUTCFullYear(),
					tempUtc.getUTCMonth(),
					tempUtc.getUTCDate(),
					Math.floor(totalSeconds / 3600),
					Math.floor((totalSeconds % 3600) / 60),
					totalSeconds % 60,
				);
			}
		}

		// 4. Fallback chuẩn ISO có timezone (ví dụ ...Z hoặc +07:00)
		const parsed = new Date(str);
		if (!isNaN(parsed.getTime())) return parsed;
	}

	// 5. Nếu bản ghi cũ (nhập từ Excel trước đây) chưa lưu ngay_tao, suy xuất từ timestamp trong ID nếu có
	if (fallbackId !== undefined && fallbackId !== null) {
		const idStr = String(fallbackId);
		const epochMatch = idStr.match(/(1[6-9]\d{11}|2\d{12})/);
		if (epochMatch) {
			const ts = Number(epochMatch[1]);
			const dt = new Date(ts);
			if (!isNaN(dt.getTime())) return dt;
		}
	}

	return null;
}

