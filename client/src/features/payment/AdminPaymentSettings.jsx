import { useEffect, useState } from 'react';
import { Check, ExternalLink, Loader2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { resolveBackendMediaUrl } from '../../utils/mediaUrl';
import { paymentApi } from './paymentApi';
import { adminApiClient } from '../../admin/api/adminApi';

const gateways = ['MOMO', 'BANK', 'VISA'];

export function AdminPaymentSettings() {
  const { t } = useTranslation();
  const [active, setActive] = useState('MOMO');
  const [configs, setConfigs] = useState([]);
  const [pending, setPending] = useState([]);
  const [form, setForm] = useState({ accountName: '', accountNumber: '', transferMemoPattern: 'VTA [Type] [Id]', isActive: true, qrCodeUrl: '' });
  const [qr, setQr] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const [configData, pendingData] = await Promise.all([paymentApi.getConfigs(), paymentApi.getPending()]);
    setConfigs(configData ?? []);
    setPending(pendingData ?? []);
  }
  useEffect(() => { load().catch(() => toast.error(t('common.error'))); }, [t]);
  useEffect(() => {
    const config = configs.find((item) => item.gatewayType === active);
    setForm({
      accountName: config?.accountName ?? '',
      accountNumber: config?.accountNumber ?? '',
      transferMemoPattern: config?.transferMemoPattern ?? 'VTA [Type] [Id]',
      isActive: config?.isActive ?? true,
      qrCodeUrl: config?.qrCodeUrl ?? ''
    });
  }, [active, configs]);

  async function save(event) {
    event.preventDefault();
    const body = new FormData();
    body.append('gatewayType', active);
    Object.entries(form).forEach(([key, value]) => body.append(key, String(value)));
    if (qr) body.append('qrCode', qr);
    setBusy(true);
    try {
      await paymentApi.updateConfig(body);
      await load();
      setQr(null);
      toast.success(t('admin_wallet.saved'));
    }
    catch (error) {
      toast.error(
        error.response?.data?.message ||
        error.response?.data?.title ||
        t('common.error')
      );
    } finally { setBusy(false); }
  }
  async function verify(id, status) {
    setBusy(true);
    try { await paymentApi.verify(id, status); await load(); toast.success(t('admin_wallet.updated')); }
    catch { toast.error(t('common.error')); } finally { setBusy(false); }
  }

  const config = configs.find((item) => item.gatewayType === active);
  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <header><h1 className="text-3xl font-black text-slate-950">{t('admin_wallet.config_title')}</h1><p className="mt-2 text-slate-500">{t('admin_wallet.config_desc')}</p></header>
      <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="flex border-b bg-slate-50">{gateways.map((gateway) => <button key={gateway} type="button" onClick={() => setActive(gateway)} className={`flex-1 px-4 py-4 text-sm font-black ${active === gateway ? 'border-b-2 border-teal-600 bg-white text-teal-700' : 'text-slate-500'}`}>{t(`admin_wallet.${gateway.toLowerCase()}_tab`)}</button>)}</div>
        <form onSubmit={save} className="grid gap-5 p-6 md:grid-cols-2">
          <Field label={t('payment.account_name')} value={form.accountName} onChange={(accountName) => setForm({ ...form, accountName })} />
          <Field label={t('payment.account_number')} value={form.accountNumber} onChange={(accountNumber) => setForm({ ...form, accountNumber })} />
          <label className="md:col-span-2 text-sm font-bold text-slate-700">{t('payment.memo')}<input value={form.transferMemoPattern} onChange={(e) => setForm({ ...form, transferMemoPattern: e.target.value })} className="mt-2 w-full rounded-xl border px-4 py-3 font-mono" /></label>
          {active !== 'VISA' && (
            <label className="text-sm font-bold text-slate-700 font-sans">
              {t('admin_wallet.qr_upload')}
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      toast.error("Kích thước tệp vượt quá 5MB!");
                      return;
                    }
                    const formData = new FormData();
                    formData.append("file", file);
                    try {
                      const res = await adminApiClient.post("/uploads?folder=settings", formData, {
                        headers: { "Content-Type": "multipart/form-data" }
                      });
                      if (res.data?.data?.url) {
                        setForm((prev) => ({ ...prev, qrCodeUrl: res.data.data.url }));
                        toast.success("Tải ảnh lên thành công!");
                      }
                    } catch (err) {
                      toast.error("Không thể tải ảnh lên.");
                    }
                  }
                }}
                className="mt-2 block w-full rounded-xl border p-3 font-semibold font-sans"
              />
            </label>
          )}
          {form.qrCodeUrl && <img src={resolveBackendMediaUrl(form.qrCodeUrl)} alt={active} className="h-32 rounded-xl border object-contain" />}
          <label className="flex items-center gap-3 text-sm font-bold"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />{t('admin_wallet.active')}</label>
          <button disabled={busy} className="flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 font-black text-white"><Save size={18} />{t('common.save')}</button>
        </form>
      </section>
      <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-5"><h2 className="text-xl font-black">{t('admin_wallet.pending_approvals')}</h2></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{['sender','type','method','amount','memo','proof','actions'].map((key) => <th key={key} className="p-4">{t(`admin_wallet.${key}`)}</th>)}</tr></thead>
          <tbody>{pending.map((tx) => <tr key={tx.id} className="border-t">
            <td className="p-4 font-bold">{tx.senderType} · {tx.senderId}</td><td className="p-4">{tx.transactionType}</td><td className="p-4">{tx.paymentMethod}</td><td className="p-4 font-black">{Number(tx.amount).toLocaleString()} VND</td><td className="p-4 font-mono text-xs">{tx.transferMemo}</td>
            <td className="p-4">{tx.proofAttachmentUrl ? <a href={resolveBackendMediaUrl(tx.proofAttachmentUrl)} target="_blank" rel="noreferrer" className="inline-flex gap-1 text-teal-700"><ExternalLink size={15} />{t('admin_wallet.view_proof')}</a> : '—'}</td>
            <td className="p-4"><div className="flex gap-2"><button type="button" disabled={busy} onClick={() => verify(tx.id, 'APPROVED')} className="rounded-lg bg-green-600 p-2 text-white"><Check size={16} /></button><button type="button" disabled={busy} onClick={() => verify(tx.id, 'FAILED')} className="rounded-lg bg-red-600 p-2 text-white"><X size={16} /></button></div></td>
          </tr>)}{!pending.length && <tr><td colSpan={7} className="p-10 text-center text-slate-400">{busy ? <Loader2 className="mx-auto animate-spin" /> : t('admin_wallet.no_pending')}</td></tr>}</tbody>
        </table></div>
      </section>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return <label className="text-sm font-bold text-slate-700">{label}<input value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3" /></label>;
}
