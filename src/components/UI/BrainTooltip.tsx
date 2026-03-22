"use client";

import { useMindStore } from '@/store/useMindStore';
import { motion, AnimatePresence } from 'framer-motion';

export const BrainTooltip = () => {
  const { activeRegion, getRegionInfo } = useMindStore();
  const info = getRegionInfo(activeRegion);

  return (
    <AnimatePresence>
      {activeRegion && info && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-32 left-1/2 -translate-x-1/2 w-full max-w-md p-6 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 text-white shadow-2xl z-50 pointer-events-none"
        >
          <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            {info.name}
          </h3>
          <p className="text-gray-300 leading-relaxed">
            {info.description}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
