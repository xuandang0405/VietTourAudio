import { useMemo } from 'react';

export function AudioVisualizer({ locked = false, active = true }) {
  const bars = useMemo(() => [24, 40, 28, 52, 34, 46, 30, 58, 36, 48, 26, 42], []);

  return (
    <div
      className={[
        'audio-bars',
        locked ? 'locked blur-[1.5px]' : '',
        active ? '' : 'paused'
      ].join(' ')}
      aria-hidden="true"
    >
      {bars.map((height, index) => (
        <span key={`bar-${index}`} style={{ height }} />
      ))}
    </div>
  );
}
