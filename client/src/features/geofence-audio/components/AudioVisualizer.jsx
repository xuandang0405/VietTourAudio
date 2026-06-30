import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';

function AudioVisualizerComponent({ locked = false, active = true }) {
  const bars = useMemo(() => [28, 46, 36, 56, 40], []);

  return (
    <div
      className={`flex items-end justify-center gap-1.5 h-14 ${locked ? 'blur-[1.5px]' : ''}`}
      aria-hidden="true"
    >
      {bars.map((height, index) => (
        <motion.div
          key={`bar-${index}`}
          className={`w-2 rounded-full ${active && !locked ? 'bg-teal-500' : 'bg-slate-300'}`}
          animate={active && !locked ? {
            height: [height * 0.4, height, height * 0.4],
          } : { height: height * 0.4 }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: index * 0.15,
            ease: "easeInOut"
          }}
          style={{ height: height * 0.4 }}
        />
      ))}
    </div>
  );
}

export const AudioVisualizer = memo(AudioVisualizerComponent);
