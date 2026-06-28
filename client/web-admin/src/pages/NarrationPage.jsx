import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { PageHeader } from '../components/PageHeader';
import { approveNarration, fetchPendingNarrations, rejectNarration } from '../api/admin';

export function NarrationPage() {
  const [content, setContent] = useState('<p>Noi dung thuyet minh zone...</p>');
  const [pending, setPending] = useState([]);

  useEffect(() => {
    let active = true;
    fetchPendingNarrations().then((items) => {
      if (active) setPending(items || []);
    });
    return () => { active = false; };
  }, []);

  return (
    <section className="space-y-4">
      <PageHeader title="Narration CMS" subtitle="Quan ly script theo ngon ngu va version" />
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <ReactQuill theme="snow" value={content} onChange={setContent} />
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="mb-3 font-semibold">Pending moderation</h3>
        {!pending.length ? <p className="text-sm text-slate-500">No pending narration.</p> : pending.map((n) => (
          <div key={n.id} className="mb-3 rounded-lg border border-slate-100 p-3">
            <p className="font-semibold">Zone #{n.zoneId} - {n.language}</p>
            <p className="mb-2 line-clamp-2 text-sm text-slate-600">{n.text}</p>
            <div className="flex gap-2">
              <button
                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
                type="button"
                onClick={async () => {
                  await approveNarration(n.id);
                  const items = await fetchPendingNarrations();
                  setPending(items || []);
                  toast.success('Approved');
                }}
              >
                Approve
              </button>
              <button
                className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white"
                type="button"
                onClick={async () => {
                  await rejectNarration(n.id, 'Need revision');
                  const items = await fetchPendingNarrations();
                  setPending(items || []);
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
