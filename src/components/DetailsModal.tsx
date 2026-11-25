import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { UserCheck, History } from "lucide-react";
import DetailsRenderer from "./menus/DetailsRenderer";
import { formatDate } from "../utils/date";

interface DetailsModalProps {
	details: any | null;
	onClose: () => void;
	vuviecList?: any[];
	doituongList?: any[];
}

export default function DetailsModal({
	details,
	onClose,
	vuviecList,
	doituongList,
}: DetailsModalProps) {
	const hasAuditTrail = Boolean(
		details?.nguoi_tao || details?.nguoi_cap_nhat || details?.ngay_tao || details?.ngay_cap_nhat,
	);

	return (
		<AnimatePresence>
			{details && (
				<motion.div
					initial={{ x: 400, opacity: 0 }}
					animate={{ x: 0, opacity: 1 }}
					exit={{ x: 400, opacity: 0 }}
					transition={{ type: "spring", damping: 25, stiffness: 200 }}
					style={{ height: "calc(100vh - 154px)" }}
					className="absolute top-[86px] right-4 w-96 bg-white/95 backdrop-blur-xl border border-slate-200/90 z-[920] flex flex-col shadow-xl rounded-2xl overflow-hidden">
					<div className="flex-1 min-h-0 overflow-hidden">
						<DetailsRenderer
							details={details}
							onClose={onClose}
							vuviecList={vuviecList}
							doituongList={doituongList}
						/>
					</div>

					{hasAuditTrail && (
						<div className="px-4 py-2.5 bg-slate-100/90 border-t border-slate-200/80 shrink-0 space-y-1">
							<div className="flex items-center justify-between gap-2 text-[11px]">
								<span className="inline-flex items-center gap-1.5 text-slate-500 font-semibold">
									<UserCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
									Người tạo:
								</span>
								<span className="font-mono font-bold text-slate-800 truncate">
									{details.nguoi_tao || "Hệ thống / Trước cập nhật"}
									{details.ngay_tao ? (
										<span className="text-slate-400 font-normal ml-1.5">
											({formatDate(details.ngay_tao)})
										</span>
									) : null}
								</span>
							</div>
							{details.nguoi_cap_nhat && (
								<div className="flex items-center justify-between gap-2 text-[11px]">
									<span className="inline-flex items-center gap-1.5 text-slate-500 font-semibold">
										<History className="w-3.5 h-3.5 text-amber-600 shrink-0" />
										Cập nhật cuối:
									</span>
									<span className="font-mono font-bold text-slate-700 truncate">
										{details.nguoi_cap_nhat}
										{details.ngay_cap_nhat ? (
											<span className="text-slate-400 font-normal ml-1.5">
												({formatDate(details.ngay_cap_nhat)})
											</span>
										) : null}
									</span>
								</div>
							)}
						</div>
					)}
				</motion.div>
			)}
		</AnimatePresence>
	);
}
