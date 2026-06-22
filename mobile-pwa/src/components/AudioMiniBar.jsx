import { Pause, Play, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAudioStore } from '../stores/useAudioStore';

export function AudioMiniBar({ onPlayPause, onReplay }) {
  const selectedPOI = useAudioStore((s) => s.selectedPOI);
  const isPlaying = useAudioStore((s) => s.isPlaying);

  if (!selectedPOI) return null;

  return (
    <div className="fixed bottom-16 left-0 right-0 z-30 mx-auto max-w-md px-3">
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
        <p className="truncate text-sm font-semibold">{selectedPOI.name}</p>
        <div className="mt-2 flex items-center gap-2">
          <button type="button" onClick={onPlayPause} className="rounded-lg bg-teal-600 px-3 py-2 text-white">
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button type="button" onClick={onReplay} className="rounded-lg bg-slate-100 px-3 py-2"><RotateCcw size={14} /></button>
          <Link to={`/player/${selectedPOI.id}`} className="ml-auto text-xs font-semibold text-teal-700">Mo Player</Link>
        </div>
      </div>
    </div>
  );
}
