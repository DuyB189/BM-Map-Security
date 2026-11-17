import React, { useEffect, useState } from "react";
import {
	User,
	Lock,
	Eye,
	EyeOff,
	ShieldAlert,
	ShieldCheck,
	AlertTriangle,
	KeyRound,
	Copy,
	Check,
	ArrowLeft,
	CheckCircle2,
} from "lucide-react";
import { motion } from "motion/react";
import { authService } from "../utils/authService";

interface LoginProps {
	onLogin: (username: string) => void;
}

type AuthViewMode = "loading" | "setup" | "recovery-receipt" | "login" | "locked" | "unlock";

const formatLockTime = (iso: string | null): string => {
	if (!iso) return "";
	try {
		const d = new Date(iso);
		if (isNaN(d.getTime())) return iso;
		return d.toLocaleString("vi-VN", {
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		});
	} catch {
		return iso;
	}
};

export default function Login({ onLogin }: LoginProps) {
	const [mode, setMode] = useState<AuthViewMode>("loading");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	// Unlock / Recovery 2-step state
	const [recoveryKeyInput, setRecoveryKeyInput] = useState("");
	const [verifiedUnlockInfo, setVerifiedUnlockInfo] = useState<{
		codeType: "owner" | "master";
		username: string;
		recoveredPassword: string | null;
	} | null>(null);
	const [showRecoveredPass, setShowRecoveredPass] = useState(false);
	const [wantResetNewPassInMaster, setWantResetNewPassInMaster] = useState(false);
	const [rotateRecoveryKey, setRotateRecoveryKey] = useState(false);
	const [copiedUsername, setCopiedUsername] = useState(false);
	const [copiedOldPass, setCopiedOldPass] = useState(false);

	// Newly generated Customer Recovery Key receipt state
	const [generatedRecoveryKey, setGeneratedRecoveryKey] = useState("");
	const [pendingAuthenticatedUser, setPendingAuthenticatedUser] = useState("");
	const [confirmedSavedKey, setConfirmedSavedKey] = useState(false);
	const [copiedKey, setCopiedKey] = useState(false);

	const [failedAttempts, setFailedAttempts] = useState(0);
	const [maxAttempts, setMaxAttempts] = useState(5);
	const [lockedAt, setLockedAt] = useState<string | null>(null);
	const [tampered, setTampered] = useState(false);

	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const resetUnlockFlowState = () => {
		setRecoveryKeyInput("");
		setVerifiedUnlockInfo(null);
		setShowRecoveredPass(false);
		setWantResetNewPassInMaster(false);
		setRotateRecoveryKey(false);
		setPassword("");
		setConfirmPassword("");
		setError(null);
	};

	const refreshAuthStatus = async () => {
		try {
			const status = await authService.getStatus();
			setFailedAttempts(status.failedAttempts || 0);
			setMaxAttempts(status.maxAttempts || 5);
			setLockedAt(status.lockedAt || null);
			setTampered(!!status.tampered);

			if (!status.initialized) {
				setMode("setup");
			} else if (status.isLocked) {
				setMode("locked");
			} else {
				setMode("login");
			}
		} catch (err) {
			console.error("Failed to check auth status:", err);
			setMode("login");
		}
	};

	useEffect(() => {
		refreshAuthStatus();
	}, []);

	const handleCopyText = async (
		text: string,
		setter: React.Dispatch<React.SetStateAction<boolean>>,
	) => {
		if (!text) return;
		try {
			await navigator.clipboard.writeText(text);
			setter(true);
			setTimeout(() => setter(false), 2200);
		} catch {
			// Ignore if clipboard blocked
		}
	};

	const handleSetupSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!username.trim() || !password) {
			setError("Vui lòng nhập đầy đủ tên tài khoản và mật khẩu khởi tạo.");
			return;
		}
		if (username.trim().length < 3) {
			setError("Tên tài khoản phải có ít nhất 3 ký tự.");
			return;
		}
		if (password.length < 6) {
			setError("Mật khẩu phải có ít nhất 6 ký tự.");
			return;
		}
		if (password !== confirmPassword) {
			setError("Mật khẩu xác nhận không trùng khớp.");
			return;
		}

		setIsLoading(true);
		try {
			const res = await authService.setupAccount(username.trim(), password);
			setIsLoading(false);
			if (res.success && res.recoveryKey && res.username) {
				setGeneratedRecoveryKey(res.recoveryKey);
				setPendingAuthenticatedUser(res.username);
				setConfirmedSavedKey(false);
				setMode("recovery-receipt");
			} else {
				setError(res.error || "Không thể khởi tạo tài khoản hệ thống.");
			}
		} catch (err: any) {
			setIsLoading(false);
			setError(err?.message || "Lỗi kết nối mô-đun bảo mật nội bộ.");
		}
	};

	const handleLoginSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!username.trim() || !password) {
			setError("Vui lòng nhập đầy đủ tài khoản và mật khẩu.");
			return;
		}

		setIsLoading(true);
		try {
			const res = await authService.login(username.trim(), password);
			setIsLoading(false);

			if (res.success && res.username) {
				onLogin(res.username);
				return;
			}

			if (typeof res.failedAttempts === "number") {
				setFailedAttempts(res.failedAttempts);
			}
			if (res.lockedAt) {
				setLockedAt(res.lockedAt);
			}

			if (res.isLocked) {
				setPassword("");
				setMode("locked");
				setError(
					res.error ||
						"Hệ thống đã bị khóa bảo vệ do nhập sai mật khẩu 5 lần liên tiếp.",
				);
			} else {
				setError(res.error || "Tài khoản hoặc mật khẩu không chính xác.");
			}
		} catch (err: any) {
			setIsLoading(false);
			setError(err?.message || "Lỗi kiểm tra thông tin đăng nhập.");
		}
	};

	const handleVerifyUnlockCode = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!recoveryKeyInput.trim()) {
			setError("Vui lòng nhập Mã Mở Khóa Chủ Quản để xác minh.");
			return;
		}

		setIsLoading(true);
		try {
			const res = await authService.verifyUnlockCode(recoveryKeyInput.trim());
			setIsLoading(false);

			if (!res.success || !res.username || !res.codeType) {
				setError(res.error || "Mã mở khóa không chính xác.");
				return;
			}

			setVerifiedUnlockInfo({
				codeType: res.codeType,
				username: res.username,
				recoveredPassword: res.recoveredPassword ?? null,
			});
			setWantResetNewPassInMaster(!res.recoveredPassword);
		} catch (err: any) {
			setIsLoading(false);
			setError(err?.message || "Không thể kiểm tra mã mở khóa.");
		}
	};

	const executeUnlockAction = async (keepOldPassword: boolean) => {
		setError(null);

		if (!keepOldPassword) {
			if (!password || password.length < 6) {
				setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
				return;
			}
			if (password !== confirmPassword) {
				setError("Mật khẩu xác nhận không trùng khớp.");
				return;
			}
		}

		setIsLoading(true);
		try {
			const res = await authService.unlockWithRecoveryKey(
				recoveryKeyInput.trim(),
				password,
				rotateRecoveryKey,
				keepOldPassword,
			);
			setIsLoading(false);

			if (!res.success || !res.username) {
				setError(res.error || "Không thể hoàn tất mở khóa hệ thống.");
				return;
			}

			setFailedAttempts(0);
			setLockedAt(null);
			const targetUser = res.username;
			const newIssuedKey = res.newRecoveryKey;
			resetUnlockFlowState();

			if (newIssuedKey) {
				setGeneratedRecoveryKey(newIssuedKey);
				setPendingAuthenticatedUser(targetUser);
				setConfirmedSavedKey(false);
				setMode("recovery-receipt");
			} else {
				onLogin(targetUser);
			}
		} catch (err: any) {
			setIsLoading(false);
			setError(err?.message || "Không thể xử lý mở khóa hệ thống.");
		}
	};

	return (
		<div className="relative w-full h-screen flex items-center justify-center bg-slate-100 overflow-hidden font-sans select-none text-slate-800">
			{/* Background decoration */}
			<div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-sky-500/10 blur-[150px] pointer-events-none" />
			<div className="absolute bottom-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-slate-300/30 blur-[150px] pointer-events-none" />
			<div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1.5px,transparent_1.5px),linear-gradient(to_bottom,#e2e8f0_1.5px,transparent_1.5px)] bg-[size:5rem_5rem] opacity-30 pointer-events-none" />

			<motion.div
				initial={{ opacity: 0, y: 15 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4, ease: "easeOut" }}
				className="w-[465px] max-w-[94vw] max-h-[94vh] overflow-y-auto custom-scrollbar glass p-8 rounded-3xl shadow-2xl border border-white/60 relative z-10 flex flex-col items-center mx-4">
				{/* Emblem / Logo Container */}
				<div className="w-20 h-20 rounded-2xl bg-white/90 flex items-center justify-center shadow-md border border-slate-100 p-2 mb-5 shrink-0">
					<img
						src="logo.png"
						alt="Logo Công an"
						className="w-full h-full object-contain"
						onError={(e) => {
							(e.target as HTMLElement).style.display = "none";
							const parent = (e.target as HTMLElement).parentElement;
							if (parent) {
								const fallback = document.createElement("div");
								fallback.className = "text-sky-600";
								fallback.innerHTML = `<svg viewBox="0 0 24 24" width="44" height="44" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`;
								parent.appendChild(fallback);
							}
						}}
					/>
				</div>

				{/* Brand Header */}
				<div className="text-center mb-5 space-y-1 w-full">
					<h1 className="text-base font-extrabold text-slate-800 uppercase tracking-wide leading-tight">
						Bản đồ An ninh Trật tự
					</h1>
					<span className="text-[10px] font-bold text-sky-600 uppercase tracking-widest block">
						{mode === "setup"
							? "Khởi tạo Tài khoản Quản trị Lần đầu"
							: mode === "recovery-receipt"
								? "Cấp Phát Mã Mở Khóa Chủ Quản"
								: mode === "locked"
									? "Cảnh Báo Khóa An Ninh Hệ Thống"
									: mode === "unlock"
										? "Khôi Phục Tài Khoản & Mở Khóa"
										: "Hệ thống Quản lý Dữ liệu Bản đồ"}
					</span>
				</div>

				{/* MODE: LOADING */}
				{mode === "loading" && (
					<div className="py-10 flex flex-col items-center gap-3 text-slate-500 text-xs font-bold">
						<div className="w-7 h-7 border-3 border-sky-500 border-t-transparent rounded-full animate-spin" />
						<span>Đang kiểm tra trạng thái bảo mật...</span>
					</div>
				)}

				{/* MODE: FIRST-RUN SETUP */}
				{mode === "setup" && (
					<form onSubmit={handleSetupSubmit} className="w-full space-y-4">
						<div className="p-3 bg-sky-50 border border-sky-100 rounded-xl text-[11px] text-sky-800 font-semibold leading-relaxed">
							Thiết bị chưa có tài khoản quản trị. Vui lòng thiết lập tài khoản duy nhất
							cho máy trạm ngoại tuyến này.
						</div>

						<div className="space-y-1.5 text-left">
							<label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
								Tên tài khoản quản trị
							</label>
							<div className="relative flex items-center">
								<User className="w-4 h-4 absolute left-3.5 text-slate-400" />
								<input
									type="text"
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									placeholder="Ví dụ: quan_tri_bm"
									disabled={isLoading}
									className="w-full pl-10 pr-4 py-2.5 bg-white/90 focus:bg-white border border-slate-200 focus:border-sky-500 rounded-xl text-xs font-bold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:ring-4 focus:ring-sky-500/10"
								/>
							</div>
						</div>

						<div className="space-y-1.5 text-left">
							<label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
								Mật khẩu truy cập (Tối thiểu 6 ký tự)
							</label>
							<div className="relative flex items-center">
								<Lock className="w-4 h-4 absolute left-3.5 text-slate-400" />
								<input
									type={showPassword ? "text" : "password"}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="Nhập mật khẩu..."
									disabled={isLoading}
									className="w-full pl-10 pr-10 py-2.5 bg-white/90 focus:bg-white border border-slate-200 focus:border-sky-500 rounded-xl text-xs font-bold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:ring-4 focus:ring-sky-500/10"
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-3.5 text-slate-400 hover:text-slate-600 cursor-pointer">
									{showPassword ? (
										<EyeOff className="w-4 h-4" />
									) : (
										<Eye className="w-4 h-4" />
									)}
								</button>
							</div>
						</div>

						<div className="space-y-1.5 text-left">
							<label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
								Xác nhận mật khẩu
							</label>
							<div className="relative flex items-center">
								<Lock className="w-4 h-4 absolute left-3.5 text-slate-400" />
								<input
									type={showConfirmPassword ? "text" : "password"}
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									placeholder="Nhập lại mật khẩu..."
									disabled={isLoading}
									className="w-full pl-10 pr-10 py-2.5 bg-white/90 focus:bg-white border border-slate-200 focus:border-sky-500 rounded-xl text-xs font-bold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:ring-4 focus:ring-sky-500/10"
								/>
								<button
									type="button"
									onClick={() => setShowConfirmPassword(!showConfirmPassword)}
									className="absolute right-3.5 text-slate-400 hover:text-slate-600 cursor-pointer">
									{showConfirmPassword ? (
										<EyeOff className="w-4 h-4" />
									) : (
										<Eye className="w-4 h-4" />
									)}
								</button>
							</div>
						</div>

						{error && (
							<div className="flex items-center gap-2.5 p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-[11px] font-bold text-left">
								<AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
								<span>{error}</span>
							</div>
						)}

						<button
							type="submit"
							disabled={isLoading}
							className="w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-sky-600 hover:bg-sky-700 transition-all shadow-md cursor-pointer disabled:bg-slate-300">
							{isLoading ? "Đang khởi tạo..." : "Tạo tài khoản & Nhận Mã Chủ Quản"}
						</button>
					</form>
				)}

				{/* MODE: RECOVERY KEY RECEIPT */}
				{mode === "recovery-receipt" && (
					<div className="w-full space-y-4 select-text">
						<div className="p-3 bg-sky-50 border border-sky-200 rounded-xl flex items-center justify-between">
							<span className="text-[11px] font-bold text-slate-600">
								Tên đăng nhập hệ thống:
							</span>
							<span className="font-mono text-xs font-black text-sky-700 bg-white px-2.5 py-1 rounded-lg border border-sky-100">
								{pendingAuthenticatedUser || username.trim()}
							</span>
						</div>

						<div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs space-y-1.5 leading-relaxed">
							<div className="flex items-center gap-2 font-extrabold uppercase text-[11px] text-amber-800">
								<ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
								<span>Lưu giữ Mã Mở Khóa Chủ Quản</span>
							</div>
							<p className="text-[11px] font-medium">
								Máy tính hoạt động cô lập hoàn toàn. Hãy ghi chính xác mã dưới đây vào{" "}
								<b>Sổ mật / Biên bản bàn giao</b> để mở khóa khi nhập sai mật khẩu quá 5
								lần.
							</p>
						</div>

						<div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-700 flex items-center justify-between gap-3 shadow-inner">
							<code className="text-base font-mono font-black tracking-widest text-amber-300 select-all">
								{generatedRecoveryKey}
							</code>
							<button
								type="button"
								onClick={() => handleCopyText(generatedRecoveryKey, setCopiedKey)}
								className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 text-slate-200 transition-colors cursor-pointer shrink-0">
								{copiedKey ? (
									<>
										<Check className="w-3.5 h-3.5 text-emerald-400" />
										<span className="text-emerald-300">Đã chép</span>
									</>
								) : (
									<>
										<Copy className="w-3.5 h-3.5" />
										<span>Sao chép</span>
									</>
								)}
							</button>
						</div>

						<label className="flex items-start gap-2.5 p-3 bg-white/80 rounded-xl border border-slate-200 cursor-pointer select-none">
							<input
								type="checkbox"
								checked={confirmedSavedKey}
								onChange={(e) => setConfirmedSavedKey(e.target.checked)}
								className="mt-0.5 w-4 h-4 accent-sky-600 rounded cursor-pointer"
							/>
							<span className="text-[11px] font-bold text-slate-700 leading-snug">
								Tôi xác nhận đã ghi chép Tên đăng nhập và Mã Mở Khóa Chủ Quản này.
							</span>
						</label>

						<button
							type="button"
							disabled={!confirmedSavedKey}
							onClick={() => {
								const targetUser = pendingAuthenticatedUser || username.trim();
								setGeneratedRecoveryKey("");
								onLogin(targetUser);
							}}
							className="w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-md cursor-pointer">
							Hoàn tất & Vào hệ thống
						</button>
					</div>
				)}

				{/* MODE: NORMAL LOGIN */}
				{mode === "login" && (
					<form onSubmit={handleLoginSubmit} className="w-full space-y-4">
						{failedAttempts > 0 && failedAttempts < maxAttempts && (
							<div className="flex items-center justify-between px-3.5 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] font-bold text-amber-800">
								<span className="flex items-center gap-2">
									<AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
									Cảnh báo nhập sai: {failedAttempts}/{maxAttempts} lần
								</span>
								<span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px]">
									Còn {maxAttempts - failedAttempts} lần
								</span>
							</div>
						)}

						<div className="space-y-1.5 text-left">
							<label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
								Tài khoản quản trị
							</label>
							<div className="relative flex items-center">
								<User className="w-4 h-4 absolute left-3.5 text-slate-400" />
								<input
									type="text"
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									placeholder="Nhập tên tài khoản"
									disabled={isLoading}
									className="w-full pl-10 pr-4 py-2.5 bg-white/80 focus:bg-white border border-slate-200 focus:border-sky-500 rounded-xl text-xs font-bold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:ring-4 focus:ring-sky-500/10 shadow-sm"
								/>
							</div>
						</div>

						<div className="space-y-1.5 text-left">
							<label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
								Mật khẩu
							</label>
							<div className="relative flex items-center">
								<Lock className="w-4 h-4 absolute left-3.5 text-slate-400" />
								<input
									type={showPassword ? "text" : "password"}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="Nhập mật khẩu truy cập"
									disabled={isLoading}
									className="w-full pl-10 pr-10 py-2.5 bg-white/80 focus:bg-white border border-slate-200 focus:border-sky-500 rounded-xl text-xs font-bold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:ring-4 focus:ring-sky-500/10 shadow-sm"
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									disabled={isLoading}
									className="absolute right-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
									{showPassword ? (
										<EyeOff className="w-4 h-4" />
									) : (
										<Eye className="w-4 h-4" />
									)}
								</button>
							</div>
						</div>

						{error && (
							<motion.div
								initial={{ opacity: 0, y: -5 }}
								animate={{ opacity: 1, y: 0 }}
								className="flex items-center gap-2.5 p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-[11px] font-bold text-left leading-normal">
								<AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
								<span>{error}</span>
							</motion.div>
						)}

						<button
							type="submit"
							disabled={isLoading}
							className={`w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
								isLoading
									? "bg-slate-300 border border-slate-300 text-slate-500 shadow-none cursor-not-allowed"
									: "bg-sky-600 border border-sky-600 hover:bg-sky-700 hover:border-sky-700 active:scale-[0.98] shadow-sky-100 hover:shadow-lg"
							}`}>
							<span>{isLoading ? "Đang xác thực..." : "Đăng nhập hệ thống"}</span>
						</button>

						<div className="pt-1 text-center">
							<button
								type="button"
								onClick={() => {
									resetUnlockFlowState();
									setMode("unlock");
								}}
								className="text-[11px] font-bold text-slate-500 hover:text-sky-600 transition-colors cursor-pointer inline-flex items-center gap-1.5">
								<KeyRound className="w-3.5 h-3.5" />
								<span>Quên tài khoản / mật khẩu? Mở khóa bằng Mã Chủ Quản</span>
							</button>
						</div>
					</form>
				)}

				{/* MODE: LOCKED AFTER 5 FAILED ATTEMPTS */}
				{mode === "locked" && (
					<div className="w-full space-y-4">
						<div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 space-y-2 text-left">
							<div className="flex items-center gap-2.5 text-rose-700 font-extrabold text-xs uppercase tracking-wide">
								<ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
								<span>
									{tampered
										? "Phát hiện can thiệp tệp bảo mật"
										: "Hệ thống đã bị khóa tạm thời"}
								</span>
							</div>
							<p className="text-xs font-medium text-rose-800 leading-relaxed">
								{tampered
									? "Tệp lưu trữ xác thực dưới máy trạm có dấu hiệu bị chỉnh sửa trái phép bên ngoài ứng dụng."
									: `Đã phát hiện ${maxAttempts}/${maxAttempts} lần nhập sai thông tin đăng nhập liên tiếp. Chức năng đăng nhập bằng mật khẩu đã bị vô hiệu hóa để bảo vệ dữ liệu.`}
							</p>
							{lockedAt && !tampered && (
								<div className="text-[11px] font-bold text-rose-700 bg-white/80 px-3 py-1.5 rounded-lg border border-rose-100">
									Thời điểm khóa: {formatLockTime(lockedAt)}
								</div>
							)}
						</div>

						{!tampered && (
							<button
								type="button"
								onClick={() => {
									resetUnlockFlowState();
									setMode("unlock");
								}}
								className="w-full py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-md shadow-rose-100 flex items-center justify-center gap-2 cursor-pointer">
								<KeyRound className="w-4 h-4" />
								<span>Mở khóa bằng Mã Chủ Quản</span>
							</button>
						)}
					</div>
				)}

				{/* MODE: 2-STEP UNLOCK & ACCOUNT/PASSWORD RECOVERY */}
				{mode === "unlock" && (
					<div className="w-full space-y-4">
						{!verifiedUnlockInfo ? (
							/* STEP 1: ENTER & VERIFY UNLOCK CODE */
							<form onSubmit={handleVerifyUnlockCode} className="space-y-4">
								<div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] font-medium text-amber-900 leading-relaxed text-left">
									Nhập <b>Mã Mở Khóa Chủ Quản</b> của đơn vị để xem lại{" "}
									<b>Tên đăng nhập</b> và mở khóa / cấp lại mật khẩu cho hệ thống.
								</div>

								<div className="space-y-1.5 text-left">
									<label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
										Mã Mở Khóa
									</label>
									<div className="relative flex items-center">
										<KeyRound className="w-4 h-4 absolute left-3.5 text-amber-600" />
										<input
											type="text"
											value={recoveryKeyInput}
											onChange={(e) =>
												setRecoveryKeyInput(e.target.value.toUpperCase())
											}
											placeholder="BM-XXXX-XXXX-XXXX"
											disabled={isLoading}
											className="w-full pl-10 pr-4 py-2.5 bg-white border border-amber-200 focus:border-amber-500 rounded-xl text-xs font-mono font-bold text-slate-800 tracking-wider outline-none transition-all uppercase shadow-xs"
										/>
									</div>
								</div>

								{error && (
									<div className="flex items-center gap-2.5 p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-[11px] font-bold text-left">
										<AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
										<span>{error}</span>
									</div>
								)}

								<div className="flex items-center gap-2.5 pt-1">
									<button
										type="button"
										onClick={() => {
											resetUnlockFlowState();
											refreshAuthStatus();
										}}
										className="px-4 py-3 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer">
										<ArrowLeft className="w-4 h-4" />
										<span>Quay lại</span>
									</button>
									<button
										type="submit"
										disabled={isLoading}
										className="flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-amber-600 hover:bg-amber-700 transition-all shadow-md cursor-pointer disabled:bg-slate-300">
										{isLoading ? "Đang kiểm tra..." : "Xác minh Mã Mở Khóa"}
									</button>
								</div>
							</form>
						) : (
							/* STEP 2: REVEAL ACCOUNT USERNAME (+ OLD PASSWORD IF MASTER CODE) & COMPLETE UNLOCK */
							<div className="space-y-4 text-left select-text">
								{/* Account Username Reveal Card */}
								<div className="p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-2xl space-y-2.5">
									<div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide text-emerald-800">
										<CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
										<span>
											{verifiedUnlockInfo.codeType === "master"
												? "Xác minh Mã Kỹ Thuật Cấp Cao thành công"
												: "Xác minh Mã Đơn vị Chủ Quản thành công"}
										</span>
									</div>

									<div className="bg-white rounded-xl p-3 border border-emerald-100 flex items-center justify-between gap-2">
										<div>
											<div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
												Tên đăng nhập của máy này
											</div>
											<div className="text-sm font-mono font-black text-slate-800 mt-0.5 select-all">
												{verifiedUnlockInfo.username}
											</div>
										</div>
										<button
											type="button"
											onClick={() =>
												handleCopyText(
													verifiedUnlockInfo.username,
													setCopiedUsername,
												)
											}
											className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700 flex items-center gap-1 cursor-pointer shrink-0">
											{copiedUsername ? (
												<>
													<Check className="w-3.5 h-3.5 text-emerald-600" />
													<span className="text-emerald-700">Đã chép</span>
												</>
											) : (
												<>
													<Copy className="w-3.5 h-3.5" />
													<span>Chép tên</span>
												</>
											)}
										</button>
									</div>

									{/* DEVELOPER MASTER CODE EXCLUSIVE: RECOVERED OLD PASSWORD */}
									{verifiedUnlockInfo.codeType === "master" && (
										<div className="bg-slate-900 text-white rounded-xl p-3 border border-slate-700 space-y-2">
											<div className="flex items-center justify-between">
												<span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
													Mật khẩu cũ đã cứu lại
												</span>
												{verifiedUnlockInfo.recoveredPassword && (
													<div className="flex items-center gap-1.5">
														<button
															type="button"
															onClick={() =>
																setShowRecoveredPass(!showRecoveredPass)
															}
															className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-200 flex items-center gap-1 cursor-pointer">
															{showRecoveredPass ? (
																<>
																	<EyeOff className="w-3 h-3" />
																	<span>Ẩn</span>
																</>
															) : (
																<>
																	<Eye className="w-3 h-3" />
																	<span>Hiện</span>
																</>
															)}
														</button>
														<button
															type="button"
															onClick={() =>
																handleCopyText(
																	verifiedUnlockInfo.recoveredPassword ||
																		"",
																	setCopiedOldPass,
																)
															}
															className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-200 flex items-center gap-1 cursor-pointer">
															{copiedOldPass ? (
																<>
																	<Check className="w-3 h-3 text-emerald-400" />
																	<span className="text-emerald-300">
																		Đã chép
																	</span>
																</>
															) : (
																<>
																	<Copy className="w-3 h-3" />
																	<span>Chép</span>
																</>
															)}
														</button>
													</div>
												)}
											</div>

											{verifiedUnlockInfo.recoveredPassword ? (
												<div className="font-mono text-sm font-black tracking-wider text-emerald-300 bg-slate-950/70 px-3 py-2 rounded-lg border border-slate-800 select-all break-all">
													{showRecoveredPass
														? verifiedUnlockInfo.recoveredPassword
														: "•".repeat(
																Math.max(
																	8,
																	verifiedUnlockInfo.recoveredPassword
																		.length,
																),
															)}
												</div>
											) : (
												<p className="text-[11px] text-slate-300 font-medium">
													Tài khoản này được tạo trước khi bật lưu trữ khôi phục.
													Vui lòng đặt mật khẩu mới bên dưới.
												</p>
											)}
										</div>
									)}
								</div>

								{/* Quick action when Master Code recovered old password */}
								{verifiedUnlockInfo.codeType === "master" &&
									verifiedUnlockInfo.recoveredPassword && (
										<div className="space-y-2.5">
											<button
												type="button"
												disabled={isLoading}
												onClick={() => executeUnlockAction(true)}
												className="w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-md cursor-pointer disabled:bg-slate-300">
												{isLoading
													? "Đang mở khóa..."
													: "Mở khóa ngay & Giữ nguyên mật khẩu cũ"}
											</button>

											<button
												type="button"
												onClick={() =>
													setWantResetNewPassInMaster(!wantResetNewPassInMaster)
												}
												className="w-full py-2 text-[11px] font-bold text-sky-700 hover:text-sky-800 text-center cursor-pointer">
												{wantResetNewPassInMaster
													? "Ẩn phần đặt lại mật khẩu mới"
													: "Hoặc bấm vào đây nếu muốn đặt mật khẩu mới"}
											</button>
										</div>
									)}

								{/* Password Reset Form (always shown for Owner Code, toggleable for Master Code) */}
								{(verifiedUnlockInfo.codeType === "owner" ||
									wantResetNewPassInMaster) && (
									<form
										onSubmit={(e) => {
											e.preventDefault();
											executeUnlockAction(false);
										}}
										className="space-y-3.5 pt-1">
										<div className="space-y-1.5">
											<label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
												Đặt mật khẩu mới (Tối thiểu 6 ký tự)
											</label>
											<div className="relative flex items-center">
												<Lock className="w-4 h-4 absolute left-3.5 text-slate-400" />
												<input
													type={showPassword ? "text" : "password"}
													value={password}
													onChange={(e) => setPassword(e.target.value)}
													placeholder="Nhập mật khẩu mới..."
													disabled={isLoading}
													className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 focus:border-sky-500 rounded-xl text-xs font-bold text-slate-800 outline-none transition-all"
												/>
												<button
													type="button"
													onClick={() => setShowPassword(!showPassword)}
													className="absolute right-3.5 text-slate-400 hover:text-slate-600 cursor-pointer">
													{showPassword ? (
														<EyeOff className="w-4 h-4" />
													) : (
														<Eye className="w-4 h-4" />
													)}
												</button>
											</div>
										</div>

										<div className="space-y-1.5">
											<label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
												Xác nhận mật khẩu mới
											</label>
											<div className="relative flex items-center">
												<Lock className="w-4 h-4 absolute left-3.5 text-slate-400" />
												<input
													type={showConfirmPassword ? "text" : "password"}
													value={confirmPassword}
													onChange={(e) => setConfirmPassword(e.target.value)}
													placeholder="Nhập lại mật khẩu mới..."
													disabled={isLoading}
													className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 focus:border-sky-500 rounded-xl text-xs font-bold text-slate-800 outline-none transition-all"
												/>
												<button
													type="button"
													onClick={() =>
														setShowConfirmPassword(!showConfirmPassword)
													}
													className="absolute right-3.5 text-slate-400 hover:text-slate-600 cursor-pointer">
													{showConfirmPassword ? (
														<EyeOff className="w-4 h-4" />
													) : (
														<Eye className="w-4 h-4" />
													)}
												</button>
											</div>
										</div>

										<label className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 cursor-pointer select-none">
											<input
												type="checkbox"
												checked={rotateRecoveryKey}
												onChange={(e) => setRotateRecoveryKey(e.target.checked)}
												className="w-4 h-4 accent-sky-600 rounded cursor-pointer"
											/>
											<span className="text-[11px] font-semibold text-slate-600">
												Đồng thời cấp mới Mã Mở Khóa Chủ Quản cho đơn vị (hủy mã
												Chủ Quản cũ)
											</span>
										</label>

										{error && (
											<div className="flex items-center gap-2.5 p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-[11px] font-bold">
												<AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
												<span>{error}</span>
											</div>
										)}

										<div className="flex items-center gap-2.5 pt-1">
											<button
												type="button"
												onClick={() => {
													resetUnlockFlowState();
													refreshAuthStatus();
												}}
												className="px-4 py-3 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer">
												<ArrowLeft className="w-4 h-4" />
												<span>Hủy</span>
											</button>
											<button
												type="submit"
												disabled={isLoading}
												className="flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-sky-600 hover:bg-sky-700 transition-all shadow-md cursor-pointer disabled:bg-slate-300">
												{isLoading
													? "Đang lưu..."
													: "Lưu mật khẩu mới & Mở khóa"}
											</button>
										</div>
									</form>
								)}

								{verifiedUnlockInfo.codeType === "master" &&
									verifiedUnlockInfo.recoveredPassword &&
									!wantResetNewPassInMaster && (
										<div className="pt-1">
											<button
												type="button"
												onClick={() => {
													resetUnlockFlowState();
													refreshAuthStatus();
												}}
												className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
												<ArrowLeft className="w-4 h-4" />
												<span>Quay lại màn hình đăng nhập</span>
											</button>
										</div>
									)}
							</div>
						)}
					</div>
				)}

				{/* Footer branding */}
				<div className="mt-7 pt-4 border-t border-slate-100 w-full text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest">
					Công an Phường Bình Minh • Tây Ninh
				</div>
			</motion.div>
		</div>
	);
}
