import { useEffect } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { audioService } from '../services/audioService';
import { toAssetUrl } from '../api/client';
import { useAudioStore } from '../stores/useAudioStore';
import { useZoneStore } from '../stores/useZoneStore';
import { AudioVisualizer } from '../components/AudioVisualizer';

export function AudioPlayer() {
  const { zoneId } = useParams();
  const zones = useZoneStore((s) => s.zones);
  const activeZone = zones.find((z) => Number(z.id) === Number(zoneId)) || useZoneStore((s) => s.nearestZone) || zones[0];

  const selectedPOI = useAudioStore((s) => s.selectedPOI);
  const setSelectedPOI = useAudioStore((s) => s.setSelectedPOI);
  const setSelectedNarration = useAudioStore((s) => s.setSelectedNarration);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const setPlaying = useAudioStore((s) => s.setPlaying);
  const progress = useAudioStore((s) => s.progress);
  const setProgress = useAudioStore((s) => s.setProgress);
  const setCurrentTime = useAudioStore((s) => s.setCurrentTime);
  const setDuration = useAudioStore((s) => s.setDuration);

  useEffect(() => {
    if (!activeZone) return;
    const narration = {
      audioUrl: activeZone.audioUrl || activeZone.audio_file || '',
      title: activeZone.localizedTitle || activeZone.name
    };
    setSelectedPOI(activeZone);
    setSelectedNarration(narration);

    if (narration.audioUrl) {
      audioService.load(toAssetUrl(narration.audioUrl));
      audioService.onTimeUpdate((time, duration) => {
        setCurrentTime(time);
        setDuration(duration);
        setProgress(duration ? time / duration : 0);
      });
      audioService.onEnded(() => setPlaying(false));
    }

    return () => audioService.destroy();
  }, [activeZone, setSelectedPOI, setSelectedNarration, setCurrentTime, setDuration, setProgress, setPlaying]);

  if (!activeZone) {
    return <section className="p-4 text-sm">Khong tim thay zone.</section>;
  }

  return (
    <section className="space-y-4 p-4">
      <h1 className="text-lg font-black">{selectedPOI?.localizedTitle || selectedPOI?.name || 'Audio Player'}</h1>
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <AudioVisualizer active={isPlaying} />
        <div className="mt-4 h-2 overflow-hidden rounded bg-slate-100">
          <div className="h-full bg-teal-600" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
        <div className="mt-4 flex items-center gap-2">
          <button type="button" onClick={() => { audioService.replay(); setPlaying(true); }} className="rounded-lg bg-slate-100 p-2"><RotateCcw size={16} /></button>
          <button
            type="button"
            onClick={() => {
              if (isPlaying) {
                audioService.pause();
                setPlaying(false);
              } else {
                audioService.play();
                setPlaying(true);
              }
            }}
            className="rounded-lg bg-teal-600 p-3 text-white"
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
        </div>
      </div>
    </section>
  );
}
