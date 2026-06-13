import { memo, useMemo } from 'react';

function AudioVisualizerComponent({ locked = false, active = true }) {
  const bars = useMemo(() => [28, 46, 36, 56, 40], []);

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

export const AudioVisualizer = memo(AudioVisualizerComponent);
