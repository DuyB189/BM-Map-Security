import React, { useEffect, useState } from "react";
import {
	X,
	Users,
	UserPlus,
	ShieldCheck,
	ShieldAlert,
	KeyRound,
	Lock,
	Unlock,
	Trash2,
	Eye,
	EyeOff,
	CheckCircle2,
	AlertTriangle,
	RefreshCw,
	UserCheck,
	UserX,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
	authService,
	getRoleDisplayName,
	ManagedUserAccount,
} from "../utils/authService";

interface UserManagementModalProps {
	show: boolean;
	onClose: () => void;
	activeUsername: string;
}

const formatCreatedDate = (iso: string): string => {
	if (!iso) return "—";
	try {
		const d = new Date(iso);
		if (isNaN(d.getTime())) return iso;
		return d.toLocaleDateString("vi-VN", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	} catch {
		return iso;
	}
};

export default function UserManagementModal({
	show,
	onClose,
	activeUsername,
}: UserManagementModalProps) {
	const [users, setUsers] = useState<ManagedUserAccount[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	// Form tạo tài khoản mới
	const [newUsername, setNewUsername] = useState("");
	const [newFullName, setNewFullName] = useState("");
	const [newRole, setNewRole] = useState<"staff" | "admin">("staff");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPass, setShowPass] = useState(false);
	const [isCreating, setIsCreating] = useState(false);

	// Reset password inline state
	const [resetTargetUser, setResetTargetUser] = useState<string | null>(null);
	const [resetPassValue, setResetPassValue] = useState("");
	const [showResetPass, setShowResetPass] = useState(false);

	// Feedback messages
	const [error, setError] = useState<string | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);

	const showToast = (msg: string, isErr = false) => {
		if (isErr) {
			setError(msg);
			setSuccessMsg(null);
		} else {
			setSuccessMsg(msg);
			setError(null);
			setTimeout(() => setSuccessMsg(null), 4000);
		}
	};

	const loadUsers = async () => {
		setIsLoading(true);
		try {
			const res = await authService.listUsers();
			if (res.success) {
				setUsers(res.users || []);
			} else if (res.error) {
				showToast(res.error, true);
			}
		} catch (err: any) {
			showToast(err?.message || "Không thể tải danh sách tài khoản.", true);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (show) {
			setError(null);
			setSuccessMsg(null);
			setResetTargetUser(null);
			setResetPassValue("");
			loadUsers();
		}
	}, [show]);

	const handleCreateUser = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setSuccessMsg(null);

		const cleanUser = newUsername.trim();
		if (cleanUser.length < 3) {
			showToast("Tên đăng nhập phải có ít nhất 3 ký tự.", true);
			return;
		}
		if (!/^[a-zA-Z0-9._-]+$/.test(cleanUser)) {
			showToast("Tên đăng nhập chỉ được chứa chữ không dấu, số và ký tự . _ -", true);
			return;
		}
		if (newPassword.length < 6) {
			showToast("Mật khẩu phải có ít nhất 6 ký tự.", true);
			return;
		}
		if (newPassword !== confirmPassword) {
			showToast("Xác nhận mật khẩu không trùng khớp.", true);
			return;
		}

		setIsCreating(true);
		try {
			const res = await authService.createUser({
				username: cleanUser,
				fullName: newFullName.trim() || cleanUser,
				password: newPassword,
				role: newRole,
			});
			setIsCreating(false);
			if (!res.success) {
				showToast(res.error || "Không thể tạo tài khoản mới.", true);
				return;
			}
			setNewUsername("");
			setNewFullName("");
			setNewPassword("");
			setConfirmPassword("");
			setNewRole("staff");
			showToast(`Đã tạo tài khoản "${cleanUser}" thành công!`);
			loadUsers();
		} catch (err: any) {
			setIsCreating(false);
			showToast(err?.message || "Lỗi hệ thống khi tạo tài khoản.", true);
		}
	};

	const handleToggleActive = async (user: ManagedUserAccount) => {
		const nextActive = !user.isActive;
		const res = await authService.updateUser({
			username: user.username,
			isActive: nextActive,
		});
		if (res.success) {
			showToast(
				nextActive
					? `Đã kích hoạt lại tài khoản "${user.username}".`
					: `Đã tạm khóa tài khoản "${user.username}".`,
			);
			loadUsers();
		} else {
			showToast(res.error || "Không thể cập nhật trạng thái tài khoản.", true);
		}
	};

	const handleUnlockUser = async (user: ManagedUserAccount) => {
		const res = await authService.updateUser({
			username: user.username,
			unlock: true,
		});
		if (res.success) {
			showToast(`Đã mở khóa đăng nhập cho tài khoản "${user.username}".`);
			loadUsers();
		} else {
			showToast(res.error || "Không thể mở khóa tài khoản.", true);
		}
	};

	const handleConfirmResetPassword = async (username: string) => {
		if (resetPassValue.length < 6) {
			showToast("Mật khẩu mới phải có ít nhất 6 ký tự.", true);
			return;
		}
		const res = await authService.updateUser({
			username,
			newPassword: resetPassValue,
		});
		if (res.success) {
			setResetTargetUser(null);
			setResetPassValue("");
			showToast(`Đã đặt lại mật khẩu mới cho tài khoản "${username}".`);
			loadUsers();
		} else {
			showToast(res.error || "Không thể đặt lại mật khẩu.", true);
		}
	};

	const handleDeleteUser = async (user: ManagedUserAccount) => {
		if (
			!window.confirm(
				`Bạn có chắc chắn muốn xóa tài khoản "${user.username}" (${user.fullName})?\n\nLưu ý: Toàn bộ đối tượng GIS đã thêm và nhật ký lịch sử của tài khoản này vẫn được giữ nguyên vết trong hệ thống.`,
			)
		) {
			return;
		}
		const res = await authService.deleteUser(user.username);
		if (res.success) {
			showToast(`Đã xóa tài khoản "${user.username}".`);
			loadUsers();
		} else {
			showToast(res.error || "Không thể xóa tài khoản.", true);
		}
	};

	return (
		<AnimatePresence>
			{show && (
				<div className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm z-[2200] flex items-center justify-center p-4 md:p-6">
					<motion.div
						initial={{ opacity: 0, scale: 0.96, y: 10 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.96, y: 10 }}
						transition={{ duration: 0.2 }}
						className="bg-white rounded-3xl w-full max-w-5xl max-h-[88vh] shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
						{/* Header */}
						<div className="px-6 py-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
							<div className="flex items-center gap-3.5">
								<div className="w-11 h-11 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-md shadow-violet-200">
									<Users className="w-5 h-5" />
								</div>
								<div>
									<h2 className="text-base font-extrabold text-slate-800 uppercase tracking-wide">
										Quản lý Tài khoản Người dùng
									</h2>
									<p className="text-[11px] font-semibold text-slate-500 mt-0.5">
										Cấp tài khoản riêng cho từng cán bộ sử dụng • Mọi thao tác Thêm / Sửa / Xóa đều lưu rõ vết theo từng tài khoản
									</p>
								</div>
							</div>

							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={loadUsers}
									disabled={isLoading}
									className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer">
									<RefreshCw
										className={`w-3.5 h-3.5 text-violet-600 ${isLoading ? "animate-spin" : ""}`}
									/>
									<span>Làm mới</span>
								</button>
								<button
									type="button"
									onClick={onClose}
									className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
									<X className="w-5 h-5" />
								</button>
							</div>
						</div>

						{/* Feedback Banner */}
						{(error || successMsg) && (
							<div className="px-6 pt-4 shrink-0">
								{error && (
									<div className="flex items-center gap-2.5 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">
										<AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
										<span>{error}</span>
									</div>
								)}
								{successMsg && (
									<div className="flex items-center gap-2.5 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold">
										<CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
										<span>{successMsg}</span>
									</div>
								)}
							</div>
						)}

						{/* Body: 2-Column Responsive Layout */}
						<div className="flex-1 overflow-y-auto p-6 custom-scrollbar grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50/40">
							{/* Left: Create New Account Form */}
							<div className="lg:col-span-5">
								<form
									onSubmit={handleCreateUser}
									className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
									<div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
										<div className="p-2 rounded-xl bg-violet-50 text-violet-600">
											<UserPlus className="w-4 h-4" />
										</div>
										<div>
											<h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
												Tạo tài khoản mới
											</h3>
											<p className="text-[11px] text-slate-500 font-medium">
												Cấp tài khoản riêng cho cán bộ cùng sử dụng máy
											</p>
										</div>
									</div>

									<div className="space-y-1.5">
										<label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
											Tên đăng nhập *
										</label>
										<input
											type="text"
											value={newUsername}
											onChange={(e) => setNewUsername(e.target.value)}
											placeholder="Ví dụ: canbo_a, nguyenvana..."
											className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-violet-500 rounded-xl text-xs font-bold text-slate-800 outline-none transition-all font-mono"
										/>
									</div>

									<div className="space-y-1.5">
										<label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
											Họ và tên / Chức danh
										</label>
										<input
											type="text"
											value={newFullName}
											onChange={(e) => setNewFullName(e.target.value)}
											placeholder="Ví dụ: Nguyễn Văn A — Cán bộ Khu phố 1"
											className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-violet-500 rounded-xl text-xs font-semibold text-slate-800 outline-none transition-all"
										/>
									</div>

									<div className="space-y-1.5">
										<label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
											Vai trò sử dụng
										</label>
										<select
											value={newRole}
											onChange={(e) =>
												setNewRole(e.target.value as "staff" | "admin")
											}
											className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-violet-500 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-pointer">
											<option value="staff">
												Cán bộ nhập liệu (Thêm/Sửa/Xóa dữ liệu GIS)
											</option>
											<option value="admin">
												Quản trị viên (Toàn quyền + Quản lý tài khoản)
											</option>
										</select>
									</div>

									<div className="space-y-1.5">
										<label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
											Mật khẩu (Tối thiểu 6 ký tự) *
										</label>
										<div className="relative flex items-center">
											<Lock className="w-4 h-4 absolute left-3.5 text-slate-400" />
											<input
												type={showPass ? "text" : "password"}
												value={newPassword}
												onChange={(e) => setNewPassword(e.target.value)}
												placeholder="Nhập mật khẩu..."
												className="w-full pl-10 pr-10 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-violet-500 rounded-xl text-xs font-bold text-slate-800 outline-none transition-all"
											/>
											<button
												type="button"
												onClick={() => setShowPass(!showPass)}
												className="absolute right-3.5 text-slate-400 hover:text-slate-600 cursor-pointer">
												{showPass ? (
													<EyeOff className="w-4 h-4" />
												) : (
													<Eye className="w-4 h-4" />
												)}
											</button>
										</div>
									</div>

									<div className="space-y-1.5">
										<label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
											Xác nhận mật khẩu *
										</label>
										<input
											type={showPass ? "text" : "password"}
											value={confirmPassword}
											onChange={(e) => setConfirmPassword(e.target.value)}
											placeholder="Nhập lại mật khẩu..."
											className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-violet-500 rounded-xl text-xs font-bold text-slate-800 outline-none transition-all"
										/>
									</div>

									<button
										type="submit"
										disabled={isCreating}
										className="w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 transition-all shadow-md shadow-violet-100 flex items-center justify-center gap-2 cursor-pointer">
										<UserPlus className="w-4 h-4" />
										<span>
											{isCreating ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
										</span>
									</button>
								</form>
							</div>

							{/* Right: Existing Accounts List */}
							<div className="lg:col-span-7 space-y-3">
								<div className="flex items-center justify-between px-1">
									<h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
										Danh sách tài khoản hiện có ({users.length})
									</h3>
									<span className="text-[11px] font-semibold text-slate-400">
										Lưu mã hóa an toàn trong kho bảo mật nội bộ
									</span>
								</div>

								<div className="space-y-3">
									{users.map((user) => {
										const isCurrentUser =
											user.username.toLowerCase() ===
											activeUsername.toLowerCase();
										const isResetting = resetTargetUser === user.username;

										return (
											<div
												key={user.username}
												className={`bg-white rounded-2xl p-4 border shadow-xs transition-all ${
													user.isLocked
														? "border-rose-200 bg-rose-50/20"
														: !user.isActive
															? "border-slate-200 opacity-75"
															: "border-slate-200/80 hover:border-violet-200"
												}`}>
												<div className="flex flex-wrap items-start justify-between gap-3">
													<div className="space-y-1 min-w-0">
														<div className="flex items-center gap-2 flex-wrap">
															<span className="font-mono text-sm font-black text-slate-800">
																{user.username}
															</span>
															{isCurrentUser && (
																<span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-700 text-[10px] font-extrabold uppercase">
																	Đang dùng
																</span>
															)}
															<span
																className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${
																	user.isOwner
																		? "bg-amber-50 text-amber-800 border-amber-200"
																		: user.role === "admin"
																			? "bg-violet-50 text-violet-700 border-violet-200"
																			: "bg-slate-100 text-slate-700 border-slate-200"
																}`}>
																<ShieldCheck className="w-3 h-3" />
																{getRoleDisplayName(user.role)}
															</span>
															{user.isLocked ? (
																<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[10px] font-extrabold uppercase">
																	<ShieldAlert className="w-3 h-3" />
																	Khóa (sai MK 5 lần)
																</span>
															) : !user.isActive ? (
																<span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-600 text-[10px] font-extrabold uppercase">
																	Tạm ngưng
																</span>
															) : (
																<span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-extrabold uppercase">
																	Hoạt động
																</span>
															)}
														</div>

														<div className="text-xs font-bold text-slate-700">
															{user.fullName}
														</div>
														<div className="text-[11px] text-slate-400 font-medium">
															Tạo lúc: {formatCreatedDate(user.createdAt)} •
															Người tạo:{" "}
															<span className="font-mono font-bold text-slate-500">
																{user.createdBy}
															</span>
														</div>
													</div>

													{/* Actions for sub-accounts */}
													{!user.isOwner && (
														<div className="flex items-center gap-1.5 flex-wrap">
															{user.isLocked && (
																<button
																	type="button"
																	onClick={() =>
																		handleUnlockUser(user)
																	}
																	className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
																	title="Mở khóa đăng nhập">
																	<Unlock className="w-3.5 h-3.5" />
																	<span>Mở khóa</span>
																</button>
															)}

															<button
																type="button"
																onClick={() => {
																	if (isResetting) {
																		setResetTargetUser(null);
																		setResetPassValue("");
																	} else {
																		setResetTargetUser(
																			user.username,
																		);
																		setResetPassValue("");
																	}
																}}
																className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
																title="Đặt lại mật khẩu cho tài khoản này">
																<KeyRound className="w-3.5 h-3.5" />
																<span>Đổi MK</span>
															</button>

															{!isCurrentUser && (
																<>
																	<button
																		type="button"
																		onClick={() =>
																			handleToggleActive(user)
																		}
																		className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
																			user.isActive
																				? "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
																				: "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
																		}`}
																		title={
																			user.isActive
																				? "Tạm khóa tài khoản"
																				: "Kích hoạt lại tài khoản"
																		}>
																		{user.isActive ? (
																			<>
																				<UserX className="w-3.5 h-3.5" />
																				<span>Khóa</span>
																			</>
																		) : (
																			<>
																				<UserCheck className="w-3.5 h-3.5" />
																				<span>Mở lại</span>
																			</>
																		)}
																	</button>

																	<button
																		type="button"
																		onClick={() =>
																			handleDeleteUser(user)
																		}
																		className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 transition-colors cursor-pointer"
																		title="Xóa tài khoản">
																		<Trash2 className="w-3.5 h-3.5" />
																	</button>
																</>
															)}
														</div>
													)}
												</div>

												{/* Inline Reset Password Bar */}
												{isResetting && (
													<div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
														<div className="relative flex-1 min-w-[200px]">
															<input
																type={
																	showResetPass
																		? "text"
																		: "password"
																}
																value={resetPassValue}
																onChange={(e) =>
																	setResetPassValue(
																		e.target.value,
																	)
																}
																placeholder="Nhập mật khẩu mới (≥ 6 ký tự)..."
																className="w-full pl-3 pr-9 py-2 bg-slate-50 focus:bg-white border border-indigo-200 focus:border-indigo-500 rounded-xl text-xs font-bold text-slate-800 outline-none"
															/>
															<button
																type="button"
																onClick={() =>
																	setShowResetPass(!showResetPass)
																}
																className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
																{showResetPass ? (
																	<EyeOff className="w-3.5 h-3.5" />
																) : (
																	<Eye className="w-3.5 h-3.5" />
																)}
															</button>
														</div>
														<button
															type="button"
															onClick={() =>
																handleConfirmResetPassword(
																	user.username,
																)
															}
															className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer">
															Lưu mật khẩu
														</button>
														<button
															type="button"
															onClick={() => {
																setResetTargetUser(null);
																setResetPassValue("");
															}}
															className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold cursor-pointer">
															Hủy
														</button>
													</div>
												)}
											</div>
										);
									})}
								</div>
							</div>
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
}
