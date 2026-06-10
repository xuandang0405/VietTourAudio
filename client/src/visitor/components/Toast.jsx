import { AnimatePresence, motion } from 'framer-motion';

export function Toast({ message }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.97 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="pointer-events-none absolute left-4 right-4 top-5 z-[1700] rounded-2xl bg-slate-950/90 px-4 py-3 text-center text-sm font-bold text-white shadow-2xl"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
