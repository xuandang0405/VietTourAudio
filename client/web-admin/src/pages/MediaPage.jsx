import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PageHeader } from '../components/PageHeader';
import { approveNarration, fetchPendingNarrations, rejectNarration } from '../api/admin';

export function MediaPage() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    let active = true;
    fetchPendingNarrations().then((items) => {
      if (active) {
        setReports((items || []).map((n) => ({ id: n.id, media: `Narration #${n.id}`, reason: n.text, status: n.approvalStatus || 'PENDING' })));
      }
    });
    return () => { active = false; };
  }, []);

  return (
    <section className="space-y-4">
      <PageHeader title="Media Moderation" subtitle="Duyet media report va content quality" />
      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        {!reports.length ? <p className="px-2 py-3 text-sm text-slate-500">No pending media review.</p> : null}
        {reports.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-b-0">
            <div>
              <p className="font-semibold text-slate-800">{r.media}</p>
              <p className="line-clamp-2 text-xs text-slate-500">{r.reason}</p>
            </div>
            <div className="flex gap-2">
              <button
                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
                type="button"
                onClick={async () => {
                  await approveNarration(r.id);
                  const items = await fetchPendingNarrations();
                  setReports((items || []).map((n) => ({ id: n.id, media: `Narration #${n.id}`, reason: n.text, status: n.approvalStatus || 'PENDING' })));
                  toast.success('Approved');
                }}
              >
                Approve
              </button>
              <button
                className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white"
                type="button"
                onClick={async () => {
                  await rejectNarration(r.id, 'Rejected by moderator');
                  const items = await fetchPendingNarrations();
                  setReports((items || []).map((n) => ({ id: n.id, media: `Narration #${n.id}`, reason: n.text, status: n.approvalStatus || 'PENDING' })));
                  toast.success('Rejected');
                }}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
