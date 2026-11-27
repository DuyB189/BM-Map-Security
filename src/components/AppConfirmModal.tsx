import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

interface ConfirmRequest {
	message: string;
	confirmText?: string;
	cancelText?: string;
	danger?: boolean;
	resolve: (val: boolean) => void;
}

let listener: ((req: ConfirmRequest | null) => void) | null = null;

/** Hộp thoại xác nhận dùng icon chính thức của ứng dụng (thay thế window.confirm để không hiện icon Electron) */
export function appConfirm(
	message: string,
	options?: { confirmText?: string; cancelText?: string; danger?: boolean },
): Promise<boolean> {
	return new Promise((resolve) => {
		if (!listener) {
			resolve(window.confirm(message));
			return;
		}
		listener({
			message,
			confirmText: options?.confirmText || "Xác nhận",
			cancelText: options?.cancelText || "Hủy",
			danger: options?.danger ?? false,
			resolve,
		});
	});
}

export default function AppConfirmModal() {
	const [request, setRequest] = useState<ConfirmRequest | null>(null);

	useEffect(() => {
		listener = setRequest;
		return () => {
			if (listener === setRequest) listener = null;
		};
	}, []);

	const handleClose = (result: boolean) => {
		if (!request) return;
		const res = request.resolve;
		setRequest(null);
		res(result);
	};

	useEffect(() => {
		if (!request) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") handleClose(false);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [request]);

	return (
		<AnimatePresence>
			{request && (
				<div className="fixed inset-0 z-[5000] bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
					<motion.div
						initial={{ opacity: 0, scale: 0.94, y: 10 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.94, y: 10 }}
						transition={{ duration: 0.16 }}
						className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-slate-200 p-6 flex flex-col items-center text-center space-y-4">
						<div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-sm flex items-center justify-center overflow-hidden p-1.5">
							<img
								src="./app-icon.png"
								alt="Bản đồ An ninh Trật tự"
								onError={(e) => {
									(e.currentTarget as HTMLImageElement).src = "./logo.png";
								}}
								className="w-full h-full object-contain rounded-xl"
							/>
						</div>

						<div className="space-y-1.5">
							<h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
								Bản đồ An ninh Trật tự
							</h3>
							<p className="text-[14px] font-bold text-slate-800 leading-relaxed whitespace-pre-line">
								{request.message}
							</p>
						</div>

						<div className="grid grid-cols-2 gap-2.5 w-full pt-1">
							<button
								type="button"
								onClick={() => handleClose(false)}
								className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer">
								{request.cancelText}
							</button>
							<button
								type="button"
								onClick={() => handleClose(true)}
								className={`py-2.5 px-4 rounded-xl text-white text-xs font-bold shadow-sm transition-colors cursor-pointer ${
									request.danger
										? "bg-rose-600 hover:bg-rose-700"
										: "bg-sky-600 hover:bg-sky-700"
								}`}>
								{request.confirmText}
							</button>
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
}
