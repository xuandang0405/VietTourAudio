import { Suspense, lazy, useMemo } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { AudioMiniBar } from './components/AudioMiniBar';
import { useGuestId } from './hooks/useGuestId';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { useGeofencing } from './hooks/useGeofencing';
import { useAppStore } from './stores/useAppStore';
import { useAudioStore } from './stores/useAudioStore';
import { audioService } from './services/audioService';

const ScanQR = lazy(() => import('./pages/ScanQR').then((m) => ({ default: m.ScanQR })));
const ZoneLanding = lazy(() => import('./pages/ZoneLanding').then((m) => ({ default: m.ZoneLanding })));
const ZoneMap = lazy(() => import('./pages/ZoneMap').then((m) => ({ default: m.ZoneMap })));
const AudioPlayer = lazy(() => import('./pages/AudioPlayer').then((m) => ({ default: m.AudioPlayer })));
const Favorites = lazy(() => import('./pages/Favorites').then((m) => ({ default: m.Favorites })));
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));
const PaymentMock = lazy(() => import('./pages/PaymentMock').then((m) => ({ default: m.PaymentMock })));

function AppInner() {
  const sessionId = useAppStore((s) => s.sessionId);
  const guestId = useAppStore((s) => s.guestId);
  const language = useAppStore((s) => s.language);
  const setPlaying = useAudioStore((s) => s.setPlaying);

  useGeofencing({ sessionId, guestId, language });

  const controls = useMemo(
    () => ({
      onPlayPause: () => {
        const isPlaying = useAudioStore.getState().isPlaying;
        if (isPlaying) {
          audioService.pause();
          setPlaying(false);
        } else {
          audioService.play();
          setPlaying(true);
        }
      },
      onReplay: () => {
        audioService.replay();
        setPlaying(true);
      }
    }),
    [setPlaying]
  );

  return (
    <>
      <Suspense fallback={<div className="p-4 text-sm text-slate-500">Loading page...</div>}>
        <Routes>
          <Route path="/" element={<Navigate to="/scan" replace />} />
          <Route element={<AppShell />}>
            <Route path="/scan" element={<ScanQR />} />
            <Route path="/tour/:tourId" element={<ZoneLanding />} />
            <Route path="/map" element={<ZoneMap />} />
            <Route path="/player" element={<AudioPlayer />} />
            <Route path="/player/:zoneId" element={<AudioPlayer />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/payment" element={<PaymentMock />} />
          </Route>
        </Routes>
      </Suspense>
      <AudioMiniBar onPlayPause={controls.onPlayPause} onReplay={controls.onReplay} />
    </>
  );
}

export default function App() {
  useGuestId();
  useOnlineStatus();
  return <AppInner />;
}
