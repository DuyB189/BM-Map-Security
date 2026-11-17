import React from "react";
import { motion, AnimatePresence } from "motion/react";
import DetailsRenderer from "./menus/DetailsRenderer";

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
					<DetailsRenderer
						details={details}
						onClose={onClose}
						vuviecList={vuviecList}
						doituongList={doituongList}
					/>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
