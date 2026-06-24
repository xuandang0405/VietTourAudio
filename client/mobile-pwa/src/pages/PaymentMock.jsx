import { useState } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { useZoneStore } from '../stores/useZoneStore';
import { usePaymentStore } from '../stores/usePaymentStore';

export function PaymentMock() {
  const guestId = useAppStore((s) => s.guestId);
  const sessionId = useAppStore((s) => s.sessionId);
  const nearestZone = useZoneStore((s) => s.nearestZone);
  const currentTour = useZoneStore((s) => s.currentTour);
  const payment = usePaymentStore((s) => s.payment);
  const createMockPayment = usePaymentStore((s) => s.createMockPayment);
  const markMockPaid = usePaymentStore((s) => s.markMockPaid);
  const loading = usePaymentStore((s) => s.loading);
  const [msg, setMsg] = useState('');

  const zoneId = nearestZone?.id;

  return (
    <section className="space-y-3 p-4">
      <h1 className="text-xl font-black">Thanh toan (Mock)</h1>
      <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
        <p>Tour: {currentTour?.name || '-'}</p>
        <p>Zone gan nhat: {zoneId || '-'}</p>
      </div>
      <button
        type="button"
        disabled={loading || !zoneId}
        onClick={async () => {
          const p = await createMockPayment({ guestId, sessionId, zoneId, amountVnd: 39000 });
          setMsg(`Tao payment: ${p.id}`);
        }}
        className="w-full rounded-xl bg-teal-600 px-3 py-3 text-sm font-semibold text-white disabled:opacity-40"
      >
        Tao giao dich
      </button>

      <button
        type="button"
        disabled={loading || !payment?.id}
        onClick={async () => {
          const p = await markMockPaid(payment.id);
          setMsg(`Trang thai: ${p.status}`);
        }}
        className="w-full rounded-xl bg-slate-900 px-3 py-3 text-sm font-semibold text-white disabled:opacity-40"
      >
        Danh dau da thanh toan
      </button>
      {msg ? <p className="text-sm text-emerald-700">{msg}</p> : null}
    </section>
  );
}
