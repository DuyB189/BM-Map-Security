export interface AuthStatus {
	initialized: boolean;
	isLocked: boolean;
	tampered?: boolean;
	failedAttempts: number;
	maxAttempts: number;
	lockedAt: string | null;
}

export type AuditEventType =
	| "INIT_ACCOUNT"
	| "LOGIN_SUCCESS"
	| "LOGIN_FAILED"
	| "ACCOUNT_LOCKED"
	| "UNLOCK_SUCCESS"
	| "UNLOCK_FAILED"
	| "PASSWORD_CHANGED"
	| "RECOVERY_KEY_ROTATED"
	| "LOGOUT"
	| "MAP_UPDATED"
	| "DATA_CREATED"
	| "DATA_UPDATED"
	| "DATA_DELETED"
	| "DATA_VIEWED"
	| "DATA_IMPORTED"
	| "TEMPLATE_DOWNLOADED"
	| "DB_RESET"
	| "SYSTEM_ACTION";

export interface SystemAuditLog {
	id: string;
	timestamp: string;
	eventType: AuditEventType;
	status: "success" | "warning" | "danger" | "info";
	username: string;
	category?: string;
	targetName?: string;
	message: string;
}

export const CATEGORY_LABELS: Record<string, string> = {
	"vuviec-list": "Vụ việc",
	"camera-list": "Camera",
	"doituong-list": "Đối tượng",
	"coquan-list": "Cơ quan nhà nước",
	"cskd-list": "Cơ sở kinh doanh",
	"diemnong-list": "Điểm nóng",
	"tuyenduong-list": "Tuyến đường",
	"xa-list": "Địa bàn Phường/Xã",
};

export const getCategoryDisplayName = (category?: string): string => {
	if (!category) return "Hệ thống";
	return CATEGORY_LABELS[category] || category;
};

export interface VerifyUnlockCodeResult {
	success: boolean;
	codeType?: "owner" | "master";
	username?: string;
	recoveredPassword?: string | null;
	error?: string;
}

const getIpc = (): any => (window as any).ipcRenderer;

// Browser-only dev fallback (used ONLY if opened in plain browser without Electron shell)
const BROWSER_FALLBACK_KEY = "gis_browser_dev_auth_v1";
const RECOVERY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const BROWSER_MASTER_DIGEST = "110957a56bf0df1108e5658a2b650bc51d60aad2de4653c3b57b70b97af4da63";

const normalizeKey = (raw: string) => (raw || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

const sha256Hex = async (msg: string): Promise<string> => {
	const buf = new TextEncoder().encode(msg);
	const hashBuf = await crypto.subtle.digest("SHA-256", buf);
	return Array.from(new Uint8Array(hashBuf))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
};

const generateBrowserRecoveryKey = () => {
	const groups = ["BM"];
	for (let g = 0; g < 3; g++) {
		let p = "";
		for (let i = 0; i < 4; i++) {
			p += RECOVERY_ALPHABET[Math.floor(Math.random() * RECOVERY_ALPHABET.length)];
		}
		groups.push(p);
	}
	return groups.join("-");
};

const readBrowserStore = () => {
	try {
		const raw = localStorage.getItem(BROWSER_FALLBACK_KEY);
		if (!raw) return { account: null, logs: [] as SystemAuditLog[] };
		return JSON.parse(raw);
	} catch {
		return { account: null, logs: [] as SystemAuditLog[] };
	}
};

const writeBrowserStore = (data: any) => {
	localStorage.setItem(BROWSER_FALLBACK_KEY, JSON.stringify(data));
};

export const authService = {
	async getStatus(): Promise<AuthStatus> {
		const ipc = getIpc();
		if (ipc) {
			return ipc.invoke("auth:get-status");
		}
		const store = readBrowserStore();
		if (!store.account) {
			return {
				initialized: false,
				isLocked: false,
				failedAttempts: 0,
				maxAttempts: 5,
				lockedAt: null,
			};
		}
		return {
			initialized: true,
			isLocked: !!store.account.isLocked,
			failedAttempts: store.account.failedAttempts || 0,
			maxAttempts: 5,
			lockedAt: store.account.lockedAt || null,
		};
	},

	async setupAccount(
		username: string,
		password: string,
	): Promise<{ success: boolean; username?: string; recoveryKey?: string; error?: string }> {
		const ipc = getIpc();
		if (ipc) {
			return ipc.invoke("auth:setup", { username, password });
		}
		const store = readBrowserStore();
		if (store.account) {
			return { success: false, error: "Tài khoản đã được khởi tạo." };
		}
		const cleanUser = username.trim();
		if (cleanUser.length < 3) {
			return { success: false, error: "Tên tài khoản phải có ít nhất 3 ký tự." };
		}
		if (password.length < 6) {
			return { success: false, error: "Mật khẩu phải có ít nhất 6 ký tự." };
		}
		const recoveryKey = generateBrowserRecoveryKey();
		store.account = {
			username: cleanUser,
			password,
			recoveryKey: normalizeKey(recoveryKey),
			failedAttempts: 0,
			isLocked: false,
			lockedAt: null,
		};
		store.logs.unshift({
			id: `LOG-${Date.now()}`,
			timestamp: new Date().toISOString(),
			eventType: "INIT_ACCOUNT",
			status: "info",
			username: cleanUser,
			message: "Khởi tạo tài khoản quản trị hệ thống lần đầu và cấp Mã Mở Khóa Chủ Quản",
		});
		writeBrowserStore(store);
		return { success: true, username: cleanUser, recoveryKey };
	},

	async login(
		username: string,
		password: string,
	): Promise<{
		success: boolean;
		username?: string;
		isLocked?: boolean;
		failedAttempts?: number;
		remainingAttempts?: number;
		lockedAt?: string | null;
		error?: string;
	}> {
		const ipc = getIpc();
		if (ipc) {
			return ipc.invoke("auth:login", { username, password });
		}
		const store = readBrowserStore();
		if (!store.account) {
			return { success: false, error: "Hệ thống chưa khởi tạo tài khoản." };
		}
		const acc = store.account;
		if (acc.isLocked) {
			store.logs.unshift({
				id: `LOG-${Date.now()}`,
				timestamp: new Date().toISOString(),
				eventType: "LOGIN_FAILED",
				status: "danger",
				username: username.trim() || acc.username,
				message: "Cố gắng đăng nhập khi hệ thống đang ở trạng thái khóa bảo vệ",
			});
			writeBrowserStore(store);
			return {
				success: false,
				isLocked: true,
				failedAttempts: acc.failedAttempts,
				remainingAttempts: 0,
				lockedAt: acc.lockedAt,
				error: "Hệ thống đang bị khóa do nhập sai mật khẩu quá 5 lần.",
			};
		}
		if (
			username.trim().toLowerCase() !== acc.username.toLowerCase() ||
			password !== acc.password
		) {
			acc.failedAttempts = Math.min(5, (acc.failedAttempts || 0) + 1);
			if (acc.failedAttempts >= 5) {
				acc.isLocked = true;
				acc.lockedAt = new Date().toISOString();
				store.logs.unshift({
					id: `LOG-${Date.now()}-1`,
					timestamp: new Date().toISOString(),
					eventType: "LOGIN_FAILED",
					status: "warning",
					username: username.trim() || "Không rõ",
					message: "Đăng nhập thất bại lần 5/5",
				});
				store.logs.unshift({
					id: `LOG-${Date.now()}-2`,
					timestamp: new Date().toISOString(),
					eventType: "ACCOUNT_LOCKED",
					status: "danger",
					username: acc.username,
					message: "Tự động khóa hệ thống do đăng nhập sai liên tiếp 5 lần",
				});
				writeBrowserStore(store);
				return {
					success: false,
					isLocked: true,
					failedAttempts: 5,
					remainingAttempts: 0,
					lockedAt: acc.lockedAt,
					error: "Bạn đã nhập sai 5/5 lần liên tiếp. Hệ thống đã tự động khóa bảo vệ!",
				};
			}
			const rem = 5 - acc.failedAttempts;
			store.logs.unshift({
				id: `LOG-${Date.now()}`,
				timestamp: new Date().toISOString(),
				eventType: "LOGIN_FAILED",
				status: "warning",
				username: username.trim() || "Không rõ",
				message: `Đăng nhập thất bại lần ${acc.failedAttempts}/5 — Còn ${rem} lần thử`,
			});
			writeBrowserStore(store);
			return {
				success: false,
				isLocked: false,
				failedAttempts: acc.failedAttempts,
				remainingAttempts: rem,
				error: `Tài khoản hoặc mật khẩu không chính xác. Còn ${rem}/5 lần thử trước khi khóa hệ thống.`,
			};
		}

		acc.failedAttempts = 0;
		acc.isLocked = false;
		acc.lockedAt = null;
		store.logs.unshift({
			id: `LOG-${Date.now()}`,
			timestamp: new Date().toISOString(),
			eventType: "LOGIN_SUCCESS",
			status: "success",
			username: acc.username,
			message: "Đăng nhập vào hệ thống thành công",
		});
		writeBrowserStore(store);
		return { success: true, username: acc.username };
	},

	async verifyUnlockCode(recoveryKey: string): Promise<VerifyUnlockCodeResult> {
		const ipc = getIpc();
		if (ipc) {
			return ipc.invoke("auth:verify-unlock-code", { recoveryKey });
		}
		const store = readBrowserStore();
		if (!store.account) {
			return { success: false, error: "Chưa có tài khoản." };
		}
		const norm = normalizeKey(recoveryKey);
		if (!norm) {
			return { success: false, error: "Vui lòng nhập Mã Mở Khóa." };
		}
		if (norm === store.account.recoveryKey) {
			return {
				success: true,
				codeType: "owner",
				username: store.account.username,
				recoveredPassword: null,
			};
		}
		const digest = await sha256Hex(`bm-browser-kdf:${norm}`);
		if (digest === BROWSER_MASTER_DIGEST) {
			return {
				success: true,
				codeType: "master",
				username: store.account.username,
				recoveredPassword: store.account.password || null,
			};
		}
		store.logs.unshift({
			id: `LOG-${Date.now()}`,
			timestamp: new Date().toISOString(),
			eventType: "UNLOCK_FAILED",
			status: "danger",
			username: store.account.username,
			message: "Nhập sai Mã Mở Khóa khi yêu cầu xác minh khôi phục tài khoản",
		});
		writeBrowserStore(store);
		return { success: false, error: "Mã mở khóa không chính xác. Vui lòng kiểm tra lại." };
	},

	async unlockWithRecoveryKey(
		recoveryKey: string,
		newPassword: string,
		rotateRecoveryKey = false,
		keepOldPassword = false,
	): Promise<{
		success: boolean;
		username?: string;
		newRecoveryKey?: string;
		error?: string;
	}> {
		const ipc = getIpc();
		if (ipc) {
			return ipc.invoke("auth:unlock", {
				recoveryKey,
				newPassword,
				rotateRecoveryKey,
				keepOldPassword,
			});
		}
		const store = readBrowserStore();
		if (!store.account) {
			return { success: false, error: "Chưa có tài khoản." };
		}
		if (!keepOldPassword && newPassword.length < 6) {
			return { success: false, error: "Mật khẩu mới phải có ít nhất 6 ký tự." };
		}
		const norm = normalizeKey(recoveryKey);
		const isOwner = norm === store.account.recoveryKey;
		const isMaster =
			!isOwner && (await sha256Hex(`bm-browser-kdf:${norm}`)) === BROWSER_MASTER_DIGEST;

		if (!isOwner && !isMaster) {
			store.logs.unshift({
				id: `LOG-${Date.now()}`,
				timestamp: new Date().toISOString(),
				eventType: "UNLOCK_FAILED",
				status: "danger",
				username: store.account.username,
				message: "Nhập sai Mã Mở Khóa khi yêu cầu mở khóa",
			});
			writeBrowserStore(store);
			return { success: false, error: "Mã mở khóa không chính xác." };
		}
		if (!keepOldPassword) {
			store.account.password = newPassword;
		}
		store.account.isLocked = false;
		store.account.failedAttempts = 0;
		store.account.lockedAt = null;
		let newKey: string | undefined;
		if (rotateRecoveryKey) {
			newKey = generateBrowserRecoveryKey();
			store.account.recoveryKey = normalizeKey(newKey);
		}
		store.logs.unshift({
			id: `LOG-${Date.now()}`,
			timestamp: new Date().toISOString(),
			eventType: "UNLOCK_SUCCESS",
			status: "success",
			username: store.account.username,
			message: isMaster
				? "Khôi phục quyền truy cập qua Mã Hỗ Trợ Kỹ Thuật"
				: "Mở khóa hệ thống thành công bằng Mã Mở Khóa Chủ Quản",
		});
		writeBrowserStore(store);
		return { success: true, username: store.account.username, newRecoveryKey: newKey };
	},

	async changePassword(
		currentPassword: string,
		newPassword: string,
		rotateRecoveryKey = false,
	): Promise<{ success: boolean; newRecoveryKey?: string; error?: string }> {
		const ipc = getIpc();
		if (ipc) {
			return ipc.invoke("auth:change-password", {
				currentPassword,
				newPassword,
				rotateRecoveryKey,
			});
		}
		const store = readBrowserStore();
		if (!store.account) return { success: false, error: "Chưa có tài khoản." };
		if (store.account.password !== currentPassword) {
			store.logs.unshift({
				id: `LOG-${Date.now()}`,
				timestamp: new Date().toISOString(),
				eventType: "LOGIN_FAILED",
				status: "warning",
				username: store.account.username,
				message: "Nhập sai mật khẩu hiện tại khi đổi mật khẩu",
			});
			writeBrowserStore(store);
			return { success: false, error: "Mật khẩu hiện tại không chính xác." };
		}
		if (newPassword.length < 6) {
			return { success: false, error: "Mật khẩu mới phải có ít nhất 6 ký tự." };
		}
		store.account.password = newPassword;
		let newKey: string | undefined;
		if (rotateRecoveryKey) {
			newKey = generateBrowserRecoveryKey();
			store.account.recoveryKey = normalizeKey(newKey);
		}
		store.logs.unshift({
			id: `LOG-${Date.now()}`,
			timestamp: new Date().toISOString(),
			eventType: "PASSWORD_CHANGED",
			status: "info",
			username: store.account.username,
			message: "Đổi mật khẩu tài khoản quản trị thành công",
		});
		writeBrowserStore(store);
		return { success: true, newRecoveryKey: newKey };
	},

	async logout(username?: string): Promise<void> {
		const ipc = getIpc();
		if (ipc) {
			await ipc.invoke("auth:logout", { username });
			return;
		}
		const store = readBrowserStore();
		store.logs.unshift({
			id: `LOG-${Date.now()}`,
			timestamp: new Date().toISOString(),
			eventType: "LOGOUT",
			status: "info",
			username: username || store.account?.username || "Quản trị viên",
			message: "Đăng xuất khỏi phiên làm việc",
		});
		writeBrowserStore(store);
	},

	async logAction(params: {
		eventType: AuditEventType;
		status?: "success" | "warning" | "danger" | "info";
		username?: string;
		category?: string;
		targetName?: string;
		message: string;
	}): Promise<void> {
		const activeUser =
			params.username || sessionStorage.getItem("gis_user") || "Quản trị viên";
		const ipc = getIpc();
		if (ipc) {
			try {
				await ipc.invoke("auth:log-action", {
					...params,
					username: activeUser,
				});
			} catch (err) {
				console.error("Failed to log system action:", err);
			}
			return;
		}
		const store = readBrowserStore();
		store.logs.unshift({
			id: `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
			timestamp: new Date().toISOString(),
			eventType: params.eventType,
			status: params.status || "info",
			username: activeUser,
			category: params.category,
			targetName: params.targetName,
			message: params.message,
		});
		store.logs = store.logs.slice(0, 5000);
		writeBrowserStore(store);
	},

	async getLogs(): Promise<{ logs: SystemAuditLog[]; accountUsername: string | null }> {
		const ipc = getIpc();
		if (ipc) {
			return ipc.invoke("auth:get-logs");
		}
		const store = readBrowserStore();
		return {
			logs: store.logs || [],
			accountUsername: store.account?.username || null,
		};
	},
};
