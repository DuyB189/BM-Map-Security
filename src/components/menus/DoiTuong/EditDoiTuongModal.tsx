import React, { useState } from "react";
import { X, Check, User, Camera, Tag, History, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
	compressImageToDataUrl,
	PERSON_ACTIVITY_TYPES,
	PERSON_TAG_OPTIONS,
} from "../../../utils/gisHelpers";
import { PersonActivityLog } from "../../../types";

interface EditDoiTuongModalProps {
	editData: any | null;
	setEditData: (val: any | null) => void;
	handleSave: (data: any) => void;
	onPickLocationOnMap?: (category: string, currentData: any) => void;
}

export default function EditDoiTuongModal({
	editData,
	setEditData,
	handleSave,
	onPickLocationOnMap,
}: EditDoiTuongModalProps) {
	const [imgError, setImgError] = useState<string | null>(null);
	const [actDate, setActDate] = useState(() => new Date().toISOString().slice(0, 10));
	const [actType, setActType] = useState<string>("Tiền án");
	const [actContent, setActContent] = useState("");

	if (!editData) return null;

	const selectedTags: string[] = Array.isArray(editData.nhom_nhan) ? editData.nhom_nhan : [];
	const activityLogs: PersonActivityLog[] = Array.isArray(editData.lich_su_hoat_dong)
		? editData.lich_su_hoat_dong
		: [];

	const handleToggleTag = (tag: string) => {
		const next = selectedTags.includes(tag)
			? selectedTags.filter((t) => t !== tag)
			: [...selectedTags, tag];
		setEditData({
			...editData,
			nhom_nhan: next,
			loai: editData.loai || next[0] || "",
		});
	};

	const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		setImgError(null);
		const file = e.target.files?.[0];
		if (!file) return;
		if (!file.type.startsWith("image/")) {
			setImgError("Vui lòng chọn tệp hình ảnh (.jpg, .png, .webp).");
			return;
		}
		try {
			const dataUrl = await compressImageToDataUrl(file, 480, 0.78);
			setEditData({ ...editData, hinh_anh: dataUrl });
		} catch (err: any) {
			setImgError(err?.message || "Không thể xử lý hình ảnh.");
		}
		e.target.value = "";
	};

	const handleAddActivity = () => {
		if (!actContent.trim()) return;
		const newLog: PersonActivityLog = {
			id: `ACT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
			ngay: actDate || new Date().toISOString().slice(0, 10),
			loai_su_kien: actType,
			noi_dung: actContent.trim(),
		};
		setEditData({
			...editData,
			lich_su_hoat_dong: [newLog, ...activityLogs],
		});
		setActContent("");
	};

	const handleRemoveActivity = (id: string) => {
		setEditData({
			...editData,
			lich_su_hoat_dong: activityLogs.filter((l) => l.id !== id),
		});
	};

	return (
		<AnimatePresence>
			<div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[2000] flex items-center justify-center p-6">
				<motion.div
					initial={{ scale: 0.9, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					exit={{ scale: 0.9, opacity: 0 }}
					className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
					{/* Header */}
					<div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-cyan-600 text-white rounded-xl shadow-md shadow-cyan-100">
								<User className="w-5 h-5" />
							</div>
							<div>
								<h2 className="text-base font-black text-slate-800 uppercase tracking-wide">
									Cập nhật Đối tượng
								</h2>
								<p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mt-0.5">
									ID: {editData.id || "Chưa định danh"}
								</p>
							</div>
						</div>
						<button
							onClick={() => setEditData(null)}
							className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-xl transition-all cursor-pointer">
							<X className="w-5 h-5" />
						</button>
					</div>

					{/* Form Content */}
					<div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
						{/* Ảnh chân dung */}
						<div className="bg-cyan-50/40 border border-cyan-100 rounded-2xl p-4 space-y-2">
							<label className="text-[10px] font-bold text-cyan-700 uppercase tracking-widest flex items-center gap-1.5">
								<Camera className="w-3.5 h-3.5" />
								Hình ảnh nhận dạng đối tượng
							</label>
							<div className="flex items-center gap-4">
								<div className="w-20 h-24 rounded-2xl bg-white border border-cyan-200 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
									{editData.hinh_anh ? (
										<img
											src={editData.hinh_anh}
											alt="Ảnh đối tượng"
											className="w-full h-full object-cover"
										/>
									) : (
										<Camera className="w-6 h-6 text-cyan-300" />
									)}
								</div>
								<div className="flex-1 space-y-2">
									<div className="flex flex-wrap items-center gap-2">
										<label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold cursor-pointer transition-colors">
											<Camera className="w-3.5 h-3.5" />
											<span>{editData.hinh_anh ? "Đổi ảnh" : "Tải ảnh lên"}</span>
											<input
												type="file"
												accept="image/*"
												onChange={handleImageChange}
												className="hidden"
											/>
										</label>
										{editData.hinh_anh && (
											<button
												type="button"
												onClick={() => setEditData({ ...editData, hinh_anh: "" })}
												className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold cursor-pointer transition-colors">
												<X className="w-3.5 h-3.5" />
												<span>Xóa ảnh</span>
											</button>
										)}
									</div>
									{imgError && <p className="text-xs font-bold text-rose-600">{imgError}</p>}
								</div>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-1.5">
								<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
									Họ và tên đối tượng <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									placeholder="Nhập họ và tên..."
									className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
									value={editData.hoten || ""}
									onChange={(e) => setEditData({ ...editData, hoten: e.target.value })}
								/>
							</div>

							<div className="space-y-1.5">
								<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
									Số CCCD / Định danh
								</label>
								<input
									type="text"
									placeholder="Nhập số CCCD (12 số)..."
									className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
									value={editData.cccd || ""}
									onChange={(e) => setEditData({ ...editData, cccd: e.target.value })}
								/>
							</div>

							<div className="space-y-1.5">
								<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
									Nhóm đối tượng chính
								</label>
								<select
									className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
									value={editData.loai || ""}
									onChange={(e) => setEditData({ ...editData, loai: e.target.value })}>
									<option value="">-- Chọn phân loại chính --</option>
									<option value="Tội phạm ma túy">Tội phạm ma túy</option>
									<option value="Trộm cắp tài sản">Trộm cắp tài sản</option>
									<option value="Cờ bạc">Cờ bạc</option>
									<option value="Hình sự">Hình sự</option>
									<option value="Cướp giật tài sản">Cướp giật tài sản</option>
									<option value="Gây rối trật tự công cộng">Gây rối trật tự công cộng</option>
									<option value="Cố ý gây thương tích">Cố ý gây thương tích</option>
									<option value="Đối tượng nghi vấn">Đối tượng nghi vấn</option>
									<option value="Khác">Khác / Chưa phân loại</option>
								</select>
							</div>

							<div className="space-y-1.5">
								<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
									Số điện thoại liên hệ
								</label>
								<input
									type="text"
									placeholder="Nhập số điện thoại..."
									className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
									value={editData.sdt || ""}
									onChange={(e) => setEditData({ ...editData, sdt: e.target.value })}
								/>
							</div>
						</div>

						{/* Multi-tag */}
						<div className="space-y-2">
							<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-1.5">
								<Tag className="w-3 h-3 text-cyan-500" />
								Gắn nhãn theo dõi (nhiều nhóm)
							</label>
							<div className="flex flex-wrap gap-2">
								{PERSON_TAG_OPTIONS.map((tag) => {
									const active = selectedTags.includes(tag);
									return (
										<button
											key={tag}
											type="button"
											onClick={() => handleToggleTag(tag)}
											className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
												active
													? "bg-cyan-600 text-white border-cyan-600 shadow-xs"
													: "bg-slate-50 text-slate-600 border-slate-200 hover:border-cyan-300"
											}`}>
											{active ? "✓ " : "+ "}
											{tag}
										</button>
									);
								})}
							</div>
						</div>

						<div className="space-y-1.5">
							<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
								Địa chỉ thường trú / Nơi ở hiện tại
							</label>
							<input
								type="text"
								placeholder="Phường Bình Minh"
								className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
								value={editData.diachi || ""}
								onChange={(e) => setEditData({ ...editData, diachi: e.target.value })}
							/>
						</div>

						<div className="space-y-1.5">
							<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
								Đặc điểm nhận dạng & Ghi chú
							</label>
							<textarea
								placeholder="Nhập đặc điểm nhận dạng, ghi chú đối tượng..."
								rows={2}
								className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all resize-none"
								value={editData.mota || ""}
								onChange={(e) => setEditData({ ...editData, mota: e.target.value })}
							/>
						</div>

						{/* Lịch sử hoạt động / Tiền án, tiền sự */}
						<div className="space-y-2.5 border-t border-slate-100 pt-4">
							<label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 flex items-center gap-1.5">
								<History className="w-3.5 h-3.5 text-cyan-600" />
								Tiền án, tiền sự & Lịch sử hoạt động ({activityLogs.length})
							</label>
							<div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2.5">
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
									<input
										type="date"
										value={actDate}
										onChange={(e) => setActDate(e.target.value)}
										className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-cyan-500"
									/>
									<select
										value={actType}
										onChange={(e) => setActType(e.target.value)}
										className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-cyan-500">
										{PERSON_ACTIVITY_TYPES.map((t) => (
											<option key={t} value={t}>
												{t}
											</option>
										))}
									</select>
								</div>
								<div className="flex gap-2">
									<input
										type="text"
										placeholder="Nhập nội dung tiền án, tiền sự hoặc hoạt động..."
										value={actContent}
										onChange={(e) => setActContent(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												e.preventDefault();
												handleAddActivity();
											}
										}}
										className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-cyan-500"
									/>
									<button
										type="button"
										onClick={handleAddActivity}
										disabled={!actContent.trim()}
										className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-300 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0">
										<Plus className="w-3.5 h-3.5" />
										<span>Thêm</span>
									</button>
								</div>
								{activityLogs.length > 0 && (
									<div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar pt-1">
										{activityLogs.map((log) => (
											<div
												key={log.id}
												className="flex items-start justify-between gap-2 p-2.5 bg-white rounded-xl border border-slate-200/80 text-xs">
												<div className="min-w-0 flex-1">
													<div className="flex items-center gap-1.5 flex-wrap">
														<span className="px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-700 border border-cyan-200 text-[10px] font-extrabold uppercase">
															{log.loai_su_kien}
														</span>
														<span className="text-[10px] font-mono font-bold text-slate-400">
															{log.ngay}
														</span>
													</div>
													<p className="text-xs text-slate-700 mt-1 leading-relaxed">
														{log.noi_dung}
													</p>
												</div>
												<button
													type="button"
													onClick={() => handleRemoveActivity(log.id)}
													className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer shrink-0"
													title="Xóa mục lịch sử">
													<Trash2 className="w-3.5 h-3.5" />
												</button>
											</div>
										))}
									</div>
								)}
							</div>
						</div>

						{/* Coordinate Edit Section */}
						<div className="space-y-3 border-t border-slate-100 pt-4 pb-2">
							<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
								Tọa độ GIS Đối tượng
							</label>
							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-1">
									<label className="text-[9px] font-bold text-slate-400 uppercase pl-1">
										Kinh độ (Lng)
									</label>
									<input
										type="number"
										step="0.000001"
										className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
										value={editData.lng || ""}
										onChange={(e) =>
											setEditData({ ...editData, lng: parseFloat(e.target.value) || 0 })
										}
									/>
								</div>
								<div className="space-y-1">
									<label className="text-[9px] font-bold text-slate-400 uppercase pl-1">
										Vĩ độ (Lat)
									</label>
									<input
										type="number"
										step="0.000001"
										className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
										value={editData.lat || ""}
										onChange={(e) =>
											setEditData({ ...editData, lat: parseFloat(e.target.value) || 0 })
										}
									/>
								</div>
							</div>
							{onPickLocationOnMap && (
								<button
									type="button"
									onClick={() => onPickLocationOnMap("doituong-list", editData)}
									className="w-full bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-700 font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer">
									Chọn lại vị trí trên bản đồ
								</button>
							)}
						</div>

						<div className="pt-2">
							<button
								onClick={() => handleSave(editData)}
								disabled={!editData.hoten}
								className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-cyan-100 hover:shadow-cyan-200/50 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed">
								<Check className="w-5 h-5" /> Lưu cập nhật
							</button>
						</div>
					</div>
				</motion.div>
			</div>
		</AnimatePresence>
	);
}
