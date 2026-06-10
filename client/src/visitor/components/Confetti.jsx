import { AnimatePresence, motion } from 'framer-motion';
import { useMemo } from 'react';

export function Confetti({ show }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 22 }, (_, index) => ({
        id: index,
        left: `${8 + ((index * 17) % 84)}%`,
        delay: index * 0.025,
        color: index % 3 === 0 ? 'bg-orange-400' : index % 3 === 1 ? 'bg-teal-500' : 'bg-sky-400'
      })),
    []
  );

  return (
    <AnimatePresence>
      {show && (
        <div className="pointer-events-none absolute inset-0 z-[1650] overflow-hidden">
          {pieces.map((piece) => (
            <motion.span
              key={piece.id}
              initial={{ y: -30, opacity: 0, rotate: 0 }}
              animate={{ y: 820, opacity: [0, 1, 1, 0], rotate: 280 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.35, delay: piece.delay, ease: 'easeOut' }}
              className={`absolute top-0 h-3 w-2 rounded-sm ${piece.color}`}
              style={{ left: piece.left }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
