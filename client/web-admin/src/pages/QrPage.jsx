import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PageHeader } from '../components/PageHeader';
import { createQr, fetchQrList } from '../api/admin';

export function QrPage() {
  const [targetId, setTargetId] = useState(101);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let active = true;
    fetchQrList().then((items) => {
      if (active) setRows(items || []);
    });
    return () => { active = false; };
  }, []);

  return (
    <section className="space-y-4">
      <PageHeader title="QR Management" subtitle="Sinh token, tao deep-link va in QR cho zone" />
      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <p>Token format de xuat: TOUR:{'{tourId}'}:ZONE:{'{zoneId}'}:TS:{'{unix}'}</p>
        <div className="mt-3 flex gap-2">
          <input type="number" value={targetId} onChange={(e) => setTargetId(Number(e.target.value))} className="rounded-lg border border-slate-200 px-3 py-2" />
          <button
            className="rounded-lg bg-amber-600 px-3 py-2 text-white"
            onClick={async () => {
              try {
                const created = await createQr({ targetType: 'tour', targetId, label: `Tour ${targetId}` });
                const items = await fetchQrList();
                setRows(items || []);
                toast.success('QR created');
              } catch (e) {
                toast.error(e.message);
              }
            }}
            type="button"
          >
            Generate
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm">
        {rows.length ? rows.slice(0, 12).map((r) => (
          <div key={r.id} className="flex items-center justify-between border-b border-slate-100 py-2 last:border-b-0">
            <span>{r.label || `${r.targetType}:${r.targetId}`}</span>
            <span className="font-mono text-xs text-slate-500">{r.tokenPreview || 'hidden'}</span>
          </div>
        )) : <p className="text-slate-500">No QR data yet.</p>}
      </div>
    </section>
  );
}
