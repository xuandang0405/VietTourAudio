export function AudioVisualizer({ active = false }) {
  return (
    <div className="flex h-8 items-end gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`w-1.5 rounded bg-teal-600 ${active ? 'animate-pulse' : 'opacity-40'}`}
          style={{ height: `${10 + i * 4}px`, animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  );
}
