import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import DetailsRenderer from './menus/DetailsRenderer';

interface DetailsModalProps {
  details: any | null;
  onClose: () => void;
}

export default function DetailsModal({ details, onClose }: DetailsModalProps) {
  return (
    <AnimatePresence>
      {details && (
        <motion.div 
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={{ height: 'calc(100vh - 120px)' }}
          className="absolute top-24 right-6 w-96 glass-dark border border-slate-200 z-[900] flex flex-col shadow-2xl rounded-3xl overflow-hidden"
        >
          <DetailsRenderer details={details} onClose={onClose} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
