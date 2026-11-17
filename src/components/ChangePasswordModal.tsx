import React, { useState } from "react";
import { X, KeyRound, Lock, Eye, EyeOff, CheckCircle2, AlertTriangle, Copy, Check } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { authService } from "../utils/authService";

interface ChangePasswordModalProps {
	show: boolean;
	onClose: () => void;
}

export default function ChangePasswordModal({ show, onClose }: ChangePasswordModalProps) {
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [rotateRecoveryKey, setRotateRecoveryKey] = useState(false);

	const [showCurr, setShowCurr] = useState(false);
	const [showNew, setShowNew] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);
	const [issuedRecoveryKey, setIssuedRecoveryKey] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);

	const resetAndClose = () => {
		setCurrentPassword("");
		setNewPassword("");
		setConfirmPassword("");
		setRotateRecoveryKey(false);
		setError(null);
		setSuccessMsg(null);
		setIssuedRecoveryKey(null);
		onClose();
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setSuccessMsg(null);

		if (!currentPassword || !newPassword) {
			setError("Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.");
			return;
		}
		if (newPassword.length < 6) {
			setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
			return;
		}
		if (newPassword !== confirmPassword) {
			setError("Xác nhận mật khẩu mới không trùng khớp.");
			return;
		}

		setIsSubmitting(true);
		try {
			const res = await authService.changePassword(
				currentPassword,
				newPassword,
				rotateRecoveryKey,
			);
			setIsSubmitting(false);

			if (!res.success) {
				setError(res.error || "Đổi mật khẩu thất bại.");
				return;
			}

			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
			setRotateRecoveryKey(false);
			setSuccessMsg("Đã cập nhật mật khẩu bảo mật thành công!");
			if (res.newRecoveryKey) {
				setIssuedRecoveryKey(res.newRecoveryKey);
			}
		} catch (err: any) {
			setIsSubmitting(false);
			setError(err?.message || "Lỗi hệ thống khi đổi mật khẩu.");
		}
	};

	return (
		<AnimatePresence>
			{show && (
				<div className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm z-[2200] flex items-center justify-center p-4">
					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 10 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 10 }}
						transition={{ duration: 0.2 }}
						className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
						<div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-200">
									<KeyRound className="w-5 h-5" />
								</div>
								<div>
									<h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
										Bảo mật & Đổi mật khẩu
									</h3>
									<p className="text-[11px] font-semibold text-slate-500">
										Cập nhật mật khẩu và Mã Mở Khóa Chủ Quản
									</p>
								</div>
							</div>
							<button
								onClick={resetAndClose}
								className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
								<X className="w-5 h-5" />
							</button>
						</div>

						<form onSubmit={handleSubmit} className="p-6 space-y-4">
							<div className="space-y-1.5">
								<label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
									Mật khẩu hiện tại
								</label>
								<div className="relative flex items-center">
									<Lock className="w-4 h-4 absolute left-3.5 text-slate-400" />
									<input
										type={showCurr ? "text" : "password"}
										value={currentPassword}
										onChange={(e) => setCurrentPassword(e.target.value)}
										placeholder="Nhập mật khẩu đang dùng..."
										className="w-full pl-10 pr-10 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-bold text-slate-800 outline-none transition-all"
									/>
									<button
										type="button"
										onClick={() => setShowCurr(!showCurr)}
										className="absolute right-3.5 text-slate-400 hover:text-slate-600 cursor-pointer">
										{showCurr ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
									</button>
								</div>
							</div>

							<div className="space-y-1.5">
								<label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
									Mật khẩu mới (Tối thiểu 6 ký tự)
								</label>
								<div className="relative flex items-center">
									<Lock className="w-4 h-4 absolute left-3.5 text-slate-400" />
									<input
										type={showNew ? "text" : "password"}
										value={newPassword}
										onChange={(e) => setNewPassword(e.target.value)}
										placeholder="Nhập mật khẩu mới..."
										className="w-full pl-10 pr-10 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-bold text-slate-800 outline-none transition-all"
									/>
									<button
										type="button"
										onClick={() => setShowNew(!showNew)}
										className="absolute right-3.5 text-slate-400 hover:text-slate-600 cursor-pointer">
										{showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
										type={showNew ? "text" : "password"}
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										placeholder="Nhập lại mật khẩu mới..."
										className="w-full pl-10 pr-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-bold text-slate-800 outline-none transition-all"
									/>
								</div>
							</div>

							<label className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200/80 cursor-pointer">
								<input
									type="checkbox"
									checked={rotateRecoveryKey}
									onChange={(e) => setRotateRecoveryKey(e.target.checked)}
									className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
								/>
								<span className="text-xs font-semibold text-slate-700">
									Đồng thời cấp lại Mã Mở Khóa Chủ Quản mới (hủy mã cũ)
								</span>
							</label>

							{error && (
								<div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">
									<AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
									<span>{error}</span>
								</div>
							)}

							{successMsg && (
								<div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl space-y-2.5">
									<div className="flex items-center gap-2 text-xs font-bold">
										<CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
										<span>{successMsg}</span>
									</div>
									{issuedRecoveryKey && (
										<div className="space-y-1.5 pt-1">
											<p className="text-[11px] font-semibold text-amber-800">
												Mã Mở Khóa Chủ Quản mới (vui lòng ghi vào Sổ mật thay cho mã cũ):
											</p>
											<div className="bg-slate-900 text-amber-300 px-3.5 py-2.5 rounded-xl flex items-center justify-between font-mono text-sm font-black tracking-wider">
												<span>{issuedRecoveryKey}</span>
												<button
													type="button"
													onClick={async () => {
														await navigator.clipboard.writeText(issuedRecoveryKey);
														setCopied(true);
														setTimeout(() => setCopied(false), 2000);
													}}
													className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-white font-sans font-bold flex items-center gap-1 cursor-pointer">
													{copied ? (
														<>
															<Check className="w-3.5 h-3.5 text-emerald-400" />
															<span>Đã chép</span>
														</>
													) : (
														<>
															<Copy className="w-3.5 h-3.5" />
															<span>Chép</span>
														</>
													)}
												</button>
											</div>
										</div>
									)}
								</div>
							)}

							<button
								type="submit"
								disabled={isSubmitting}
								className="w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 transition-all shadow-md cursor-pointer">
								{isSubmitting ? "Đang lưu thay đổi..." : "Lưu thay đổi bảo mật"}
							</button>
						</form>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
}

