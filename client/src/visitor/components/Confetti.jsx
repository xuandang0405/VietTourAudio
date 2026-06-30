import { useMemo } from 'react';

export function Confetti({ show }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 22 }, (_, index) => ({
        id: index,
        left: `${8 + ((index * 17) % 84)}%`,
        delay: `${index * 0.025}s`,
        color: index % 3 === 0 ? 'bg-premiumNeon' : index % 3 === 1 ? 'bg-oceanCyan' : 'bg-electricBlue'
      })),
    []
  );

  if (!show) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[1650] overflow-hidden">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className={`confetti-piece absolute top-0 h-3 w-2 rounded-sm ${piece.color}`}
          style={{ left: piece.left, animationDelay: piece.delay }}
        />
      ))}
    </div>
  );
}
