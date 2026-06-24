import { useEffect, useMemo, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { PermissionGuide } from '../components/PermissionGuide';
import { useAppStore } from '../stores/useAppStore';
import { saveTour, saveZones } from '../services/idb';

export function ScanQR() {
  const navigate = useNavigate();
  const guestId = useAppStore((s) => s.guestId);
  const setSessionId = useAppStore((s) => s.setSessionId);
  const setQrToken = useAppStore((s) => s.setQrToken);
  const [manualToken, setManualToken] = useState('');
  const [error, setError] = useState('');
  const [cameraDenied, setCameraDenied] = useState(false);

  const scannerId = useMemo(() => 'qr-reader', []);

  async function processToken(rawToken) {
    try {
      setError('');
      const token = rawToken?.trim();
      if (!token) return;
      const { data } = await api.post('/qr/scan', { token, guestId });
      setSessionId(data.session.id);
      setQrToken(token);
      localStorage.setItem('sessionId', data.session.id);
      await saveTour(data.tour);
      await saveZones(data.tour.id, data.zones || []);
      navigate(`/tour/${data.tour.id}`);
    } catch (e) {
      setError(e.message || 'QR token khong hop le');
    }
  }

  useEffect(() => {
    const scanner = new Html5Qrcode(scannerId);
    let mounted = true;

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 220, height: 220 } },
      async (decodedText) => {
        if (!mounted) return;
        await scanner.stop();
        await processToken(decodedText);
      },
      () => {}
    ).catch(() => setCameraDenied(true));

    return () => {
      mounted = false;
      scanner.stop().catch(() => {});
      scanner.clear().catch(() => {});
    };
  }, [scannerId]);

  return (
    <section className="space-y-4 p-4">
      <h1 className="text-xl font-black text-slate-900">Quet QR de mo tour</h1>
      <div id={scannerId} className="overflow-hidden rounded-2xl border border-slate-200 bg-black" />
      {cameraDenied ? <PermissionGuide type="camera" /> : null}
      <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
        <label className="text-xs font-semibold text-slate-600">Hoac nhap token thu cong</label>
        <div className="flex gap-2">
          <input value={manualToken} onChange={(e) => setManualToken(e.target.value)} placeholder="VD: TOUR:101" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <button type="button" onClick={() => processToken(manualToken)} className="rounded-lg bg-teal-600 px-3 py-2 text-xs font-bold text-white">Vao</button>
        </div>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </section>
  );
}
