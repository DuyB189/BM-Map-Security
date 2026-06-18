import React, { useState } from "react";
import { User, Lock, Eye, EyeOff, Shield, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";

interface LoginProps {
	onLogin: (username: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!username.trim() || !password.trim()) {
			setError("Vui lòng nhập đầy đủ tài khoản và mật khẩu.");
			return;
		}

		setIsLoading(true);

		// Simulated verification delay
		setTimeout(() => {
			const normalizedUser = username.trim().toLowerCase();
			if (
				(normalizedUser === "admin" && password === "admin") ||
				(normalizedUser === "admin" && password === "123456")
			) {
				setIsLoading(false);
				onLogin(username.trim());
			} else {
				setIsLoading(false);
				setError("Tài khoản hoặc mật khẩu không chính xác.");
			}
		}, 800);
	};

	return (
		<div className="relative w-full h-screen flex items-center justify-center bg-slate-100 overflow-hidden font-sans select-none text-slate-800">
			{/* Background decoration matching system UI gradients */}
			<div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-sky-500/10 blur-[150px] pointer-events-none" />
			<div className="absolute bottom-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-slate-300/30 blur-[150px] pointer-events-none" />

			{/* Subtle coordinate grid to indicate mapping/GIS context */}
			<div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1.5px,transparent_1.5px),linear-gradient(to_bottom,#e2e8f0_1.5px,transparent_1.5px)] bg-[size:5rem_5rem] opacity-30 pointer-events-none" />

			<motion.div
				initial={{ opacity: 0, y: 15 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, ease: "easeOut" }}
				className="w-[420px] glass p-8 rounded-2xl shadow-2xl border border-white/50 relative z-10 flex flex-col items-center mx-4">
				{/* Emblem / Logo Container */}
				<div className="w-20 h-20 rounded-2xl bg-white/90 flex items-center justify-center shadow-md border border-slate-100 p-2 mb-6">
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
				<div className="text-center mb-6 space-y-1 w-full">
					<span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
						Ủy ban Nhân dân Phường Bình Minh
					</span>
					<h1 className="text-base font-extrabold text-slate-800 uppercase tracking-wide leading-tight">
						Bản đồ An ninh Trật tự
					</h1>
					<span className="text-[10px] font-bold text-sky-600 uppercase tracking-widest block">
						Hệ thống Quản lý Dữ liệu GIS
					</span>
				</div>

				{/* Login Form */}
				<form onSubmit={handleSubmit} className="w-full space-y-4">
					{/* Username Input */}
					<div className="space-y-1.5 text-left">
						<label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
							Tài khoản quản trị
						</label>
						<div className="relative flex items-center">
							<div className="absolute left-3.5 text-slate-450">
								<User className="w-4 h-4" />
							</div>
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

					{/* Password Input */}
					<div className="space-y-1.5 text-left">
						<label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
							Mật khẩu
						</label>
						<div className="relative flex items-center">
							<div className="absolute left-3.5 text-slate-450">
								<Lock className="w-4 h-4" />
							</div>
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

					{/* Error Message Box */}
					{error && (
						<motion.div
							initial={{ opacity: 0, y: -5 }}
							animate={{ opacity: 1, y: 0 }}
							className="flex items-center gap-2.5 p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-[10px] font-bold uppercase tracking-wider text-left leading-normal">
							<AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
							<span>{error}</span>
						</motion.div>
					)}

					{/* Submit Button */}
					<button
						type="submit"
						disabled={isLoading}
						className={`w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
							isLoading
								? "bg-slate-300 border border-slate-300 text-slate-450 shadow-none cursor-not-allowed"
								: "bg-sky-600 border border-sky-600 hover:bg-sky-700 hover:border-sky-700 active:scale-[0.98] shadow-sky-100 hover:shadow-lg"
						}`}>
						{isLoading ? (
							<>
								<svg
									className="animate-spin h-4 w-4 text-white"
									fill="none"
									viewBox="0 0 24 24">
									<circle
										className="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									/>
									<path
										className="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									/>
								</svg>
								<span>Đang kết nối...</span>
							</>
						) : (
							<span>Đăng nhập hệ thống</span>
						)}
					</button>
				</form>

				{/* Footer branding */}
				<div className="mt-8 pt-4 border-t border-slate-100 w-full text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest">
					Công an Phường Bình Minh • Tây Ninh
				</div>
			</motion.div>
		</div>
	);
}
