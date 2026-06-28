import { useEffect, useState } from 'react';
import { Building2, CheckCircle2, Copy, CreditCard, Loader2, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { resolveBackendMediaUrl } from '../../utils/mediaUrl';
import { paymentApi } from './paymentApi';

const methods = [
  { id: 'MOMO', icon: Smartphone, key: 'payment.momo' },
  { id: 'BANK', icon: Building2, key: 'payment.bank' },
  { id: 'VISA', icon: CreditCard, key: 'payment.visa' }
];

export function CheckoutMatrix({ senderId, senderType, transactionType, onSuccess }) {
  const { t } = useTranslation();
  const [method, setMethod] = useState('MOMO');
  const [configs, setConfigs] = useState([]);
  const [configsLoading, setConfigsLoading] = useState(true);
  const [checkout, setCheckout] = useState(null);
  const [busy, setBusy] = useState(false);
  const [proof, setProof] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const [qrFailed, setQrFailed] = useState(false);
  const [card, setCard] = useState({ cardholderName: '', cardNumber: '', expiry: '', cvv: '' });

  useEffect(() => {
    let active = true;
    setConfigsLoading(true);
    paymentApi.getPublicGateways()
      .then((data) => {
        if (!active) return;
        const activeConfigs = Array.isArray(data) ? data : [];
        setConfigs(activeConfigs);
        if (activeConfigs.length && !activeConfigs.some((item) => item.gatewayType === method)) {
          setMethod(activeConfigs[0].gatewayType);
        }
      })
      .catch(() => toast.error(t('payment.gateway_load_error')))
      .finally(() => { if (active) setConfigsLoading(false); });
    return () => { active = false; };
  }, [t]);

  useEffect(() => {
    if (!senderId || configsLoading || !configs.some((config) => config.gatewayType === method)) return;
    let active = true;
    setBusy(true);
    setCheckout(null);
    setWaiting(false);
    setQrFailed(false);
    paymentApi.initialize({ senderId: String(senderId), senderType, paymentMethod: method, transactionType })
      .then((data) => { if (active) setCheckout(data); })
      .catch((error) => toast.error(error.response?.data?.message ?? t('common.error')))
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [configs, configsLoading, method, senderId, senderType, t, transactionType]);

  async function copyMemo() {
    try {
      await navigator.clipboard.writeText(checkout?.transaction?.transferMemo ?? '');
      toast.success(t('payment.memo_copied'));
    } catch {
      toast.error(t('payment.copy_failed'));
    }
  }

  async function submitProof() {
    if (!proof) return toast.error(t('payment.proof_required'));
    setBusy(true);
    try {
      await paymentApi.uploadProof(checkout.transaction.id, proof);
      setWaiting(true);
      toast.success(t('payment.manual_submission_success'));
    } catch (error) {
      toast.error(error.response?.data?.message ?? t('common.error'));
    } finally {
      setBusy(false);
    }
  }

  async function submitVisa(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await paymentApi.processVisa({ transactionId: checkout.transaction.id, ...card });
      toast.success(t('payment.success'));
      onSuccess?.();
    } catch (error) {
      toast.error(error.response?.data?.message ?? t('payment.card_failed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="relative rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 md:p-7">
      <h2 className="text-xl font-black text-slate-950">{t('payment.select_method')}</h2>
      {configsLoading && <div className="mt-5 flex items-center gap-2 text-sm font-bold text-slate-500"><Loader2 className="animate-spin" size={18} />{t('payment.loading_gateways')}</div>}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {methods.map(({ id, icon: Icon, key }) => {
          const available = configs.some((config) => config.gatewayType === id);
          return (
            <button key={id} type="button" onClick={() => available ? setMethod(id) : toast.error(t('payment.method_unavailable'))}
              className={`relative flex items-center gap-3 rounded-2xl border p-4 text-left font-bold transition ${method === id && available ? 'border-teal-500 bg-teal-50 text-teal-800 ring-2 ring-teal-100' : available ? 'border-slate-200 text-slate-600 hover:border-teal-200' : 'border-slate-100 bg-slate-50 text-slate-300'}`}>
              <Icon size={22} /><span>{t(key)}</span>
              {!available && <span className="absolute right-2 top-2 rounded-full bg-slate-200 px-2 py-0.5 text-[9px] font-black uppercase text-slate-500">{t('payment.inactive')}</span>}
            </button>
          );
        })}
      </div>
      {!configsLoading && configs.length === 0 && <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">{t('payment.no_gateways')}</div>}

      {busy && !checkout && <div className="grid min-h-56 place-items-center"><Loader2 className="animate-spin text-teal-600" /></div>}

      {checkout && method !== 'VISA' && (
        <div className="mt-6 grid gap-6 md:grid-cols-[220px_1fr]">
          <div className="grid min-h-52 place-items-center overflow-hidden rounded-2xl border bg-slate-50 p-3">
            {checkout.gateway.qrCodeUrl && !qrFailed
              ? <img className="max-h-52 w-full object-contain" src={resolveBackendMediaUrl(checkout.gateway.qrCodeUrl)} alt={t(`payment.${method.toLowerCase()}`)} onError={() => setQrFailed(true)} />
              : <div className="text-center text-slate-400"><Smartphone size={52} className="mx-auto" /><p className="mt-2 text-xs font-bold">{t('payment.qr_unavailable')}</p></div>}
          </div>
          <div className="space-y-4">
            <Info label={t('payment.account_name')} value={checkout.gateway.accountName} />
            <Info label={t('payment.account_number')} value={checkout.gateway.accountNumber} />
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-black uppercase text-amber-700">{t('payment.memo')}</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <code className="break-all text-sm font-black text-slate-950">{checkout.transaction.transferMemo}</code>
                <button type="button" onClick={copyMemo} className="rounded-xl bg-white p-2 text-teal-700 shadow-sm"><Copy size={18} /></button>
              </div>
              <p className="mt-2 text-xs text-amber-800">{t('payment.memo_warning')}</p>
            </div>
            <p className="text-lg font-black text-teal-700">{Number(checkout.transaction.amount).toLocaleString()} VND</p>
            <input type="file" accept="image/*" onChange={(e) => setProof(e.target.files?.[0] ?? null)}
              className="block w-full rounded-xl border border-slate-200 p-3 text-sm" />
            <button type="button" disabled={busy || waiting} onClick={submitProof}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 font-black text-white disabled:opacity-60">
              {waiting ? <CheckCircle2 size={18} /> : busy ? <Loader2 className="animate-spin" size={18} /> : null}
              {waiting ? t('payment.waiting_admin') : t('payment.submit_transaction')}
            </button>
          </div>
        </div>
      )}

      {checkout && method === 'VISA' && (
        <form onSubmit={submitVisa} className="mt-6 grid gap-4 rounded-2xl bg-slate-50 p-5">
          <label className="text-sm font-bold text-slate-700">{t('payment.cardholder_name')}
            <input required value={card.cardholderName}
              onChange={(e) => setCard({ ...card, cardholderName: e.target.value.toUpperCase() })}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 uppercase" placeholder={t('payment.cardholder_placeholder')} />
          </label>
          <label className="text-sm font-bold text-slate-700">{t('payment.visa_card_no')}
            <input required inputMode="numeric" maxLength={23} value={card.cardNumber}
              onChange={(e) => setCard({ ...card, cardNumber: e.target.value.replace(/[^\d ]/g, '').replace(/(\d{4})(?=\d)/g, '$1 ') })}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3" placeholder="4111 1111 1111 1111" />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="text-sm font-bold text-slate-700">{t('payment.visa_expiry')}
              <input required maxLength={5} value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value })}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3" placeholder="MM/YY" />
            </label>
            <label className="text-sm font-bold text-slate-700">{t('payment.visa_cvv')}
              <input required type="password" inputMode="numeric" maxLength={4} value={card.cvv}
                onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '') })}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3" placeholder="•••" />
            </label>
          </div>
          <button disabled={busy} className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 font-black text-white">
            {busy && <Loader2 className="animate-spin" size={18} />}{t('payment.visa_submit')}
          </button>
        </form>
      )}
      {busy && method === 'VISA' && checkout && (
        <div className="absolute inset-0 z-20 grid place-items-center rounded-3xl bg-slate-950/80 p-6 text-center text-white backdrop-blur-sm">
          <div><div className="mx-auto grid h-20 w-20 animate-pulse place-items-center rounded-full bg-teal-500/20 ring-4 ring-teal-400/30"><CreditCard size={36} className="text-teal-300" /></div><p className="mt-5 text-lg font-black">{t('payment.secure_processing')}</p><p className="mt-2 text-sm text-slate-300">{t('payment.secure_processing_desc')}</p></div>
        </div>
      )}
    </section>
  );
}

function Info({ label, value }) {
  return <div><p className="text-xs font-bold uppercase text-slate-400">{label}</p><p className="mt-1 font-black text-slate-900">{value || '—'}</p></div>;
}
