import { UserPlus, Store, ShieldCheck } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminBadge } from '../../../admin/components/AdminBadge';
import { AdminDataTable } from '../../../admin/components/AdminDataTable';
import { AdminPageHeader } from '../../../admin/components/AdminPageHeader';
import { adminUsers } from '../../../admin/data/adminMockData';
import { useCreateVendor, useCreateZoneAdmin, useToursList, useZonesList } from '../../../admin/api/adminQueries';

export function AdminUsers() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('admins');

  // Vendor Form States
  const [tradeName, setTradeName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [password, setPassword] = useState('');
  const [vendorCode, setVendorCode] = useState('');
  const [assignedTourId, setAssignedTourId] = useState('');
  const [zoneAdminName, setZoneAdminName] = useState('');
  const [zoneAdminEmail, setZoneAdminEmail] = useState('');
  const [zoneAdminPassword, setZoneAdminPassword] = useState('');
  const [assignedZoneId, setAssignedZoneId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Hooks
  const { data: tours = [] } = useToursList();
  const { data: zones = [] } = useZonesList();
  const createVendorMutation = useCreateVendor();
  const createZoneAdminMutation = useCreateZoneAdmin();
  const zoneOptions = useMemo(() => zones.map((zone) => ({ value: zone.id, label: zone.name })), [zones]);

  const columns = useMemo(() => [
    { key: 'id', label: t('admin_users.col_id'), render: (row) => <span className="font-black text-slate-950">{row.id}</span> },
    { key: 'displayName', label: t('admin_users.col_name') },
    { key: 'email', label: t('admin_users.col_email') },
    { key: 'role', label: t('admin_users.col_role') },
    { key: 'createdAt', label: t('admin_users.col_created_at') },
    { key: 'status', label: t('admin_users.col_status'), render: (row) => <AdminBadge status={row.status} /> }
  ], [t]);

  async function handleCreateVendorSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!tradeName.trim()) {
      setError(t('admin_users.error_trade_name'));
      return;
    }
    if (!contactEmail.trim()) {
      setError(t('admin_users.error_email'));
      return;
    }
    if (!password || password.length < 6) {
      setError(t('admin_users.error_password'));
      return;
    }
    if (!vendorCode.trim()) {
      setError(t('admin_users.error_vendor_code'));
      return;
    }

    try {
      await createVendorMutation.mutateAsync({
        tradeName: tradeName.trim(),
        contactEmail: contactEmail.trim(),
        password,
        vendorCode: vendorCode.trim(),
        assignedTourId: assignedTourId ? Number(assignedTourId) : null
      });

      setSuccess(t('admin_users.success_create', { name: tradeName }));
      setTradeName('');
      setContactEmail('');
      setPassword('');
      setVendorCode('');
      setAssignedTourId('');
    } catch (err) {
      setError(err.response?.data?.error ?? t('admin_users.error_create'));
    }
  }

  async function handleCreateZoneAdminSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!zoneAdminName.trim()) {
      setError(t('admin_users.error_admin_name'));
      return;
    }
    if (!zoneAdminEmail.trim()) {
      setError(t('admin_users.error_admin_email'));
      return;
    }
    if (!zoneAdminPassword || zoneAdminPassword.length < 6) {
      setError(t('admin_users.error_password'));
      return;
    }
    if (!assignedZoneId) {
      setError(t('admin_users.error_zone_required'));
      return;
    }

    try {
      await createZoneAdminMutation.mutateAsync({
        fullName: zoneAdminName.trim(),
        email: zoneAdminEmail.trim(),
        password: zoneAdminPassword,
        assignedZoneId
      });

      setSuccess(t('admin_users.success_create_zone_admin', { name: zoneAdminName }));
      setZoneAdminName('');
      setZoneAdminEmail('');
      setZoneAdminPassword('');
      setAssignedZoneId('');
    } catch (err) {
      setError(err.response?.data?.error ?? t('admin_users.error_create_zone_admin'));
    }
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <AdminPageHeader
        eyebrow={t('admin_users.settings')}
        title={t('admin_users.title')}
        description={t('admin_users.subtitle')}
      />

      <div className="border-b border-slate-200">
        <div className="flex gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('admins')}
            className={`pb-3 text-sm font-black border-b-2 transition ${activeTab === 'admins' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            {t('admin_users.tab_admins')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('create-vendor')}
            className={`pb-3 text-sm font-black border-b-2 transition ${activeTab === 'create-vendor' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            {t('admin_users.tab_create_vendor')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('create-zone-admin')}
            className={`pb-3 text-sm font-black border-b-2 transition ${activeTab === 'create-zone-admin' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            {t('users.create_zone_admin')}
          </button>
        </div>
      </div>

      {activeTab === 'admins' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setActiveTab('create-zone-admin')}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white transition hover:bg-blue-700"
            >
              <UserPlus size={17} />
              {t('admin_users.create_admin')}
            </button>
          </div>
          <AdminDataTable columns={columns} rows={adminUsers} />
        </div>
      )}

      {activeTab === 'create-vendor' && (
        <section className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <Store size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-950">{t('admin_users.form_title')}</h2>
              <p className="text-xs font-semibold text-slate-500">{t('admin_users.form_desc')}</p>
            </div>
          </div>

          <form onSubmit={handleCreateVendorSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-xs font-bold text-green-700">
                {success}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">{t('admin_users.label_trade_name')}</label>
                <input
                  required
                  value={tradeName}
                  onChange={(e) => setTradeName(e.target.value)}
                  placeholder={t('admin_users.placeholder_trade_name')}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">{t('admin_users.label_vendor_code')}</label>
                <input
                  required
                  value={vendorCode}
                  onChange={(e) => setVendorCode(e.target.value)}
                  placeholder={t('admin_users.placeholder_vendor_code')}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">{t('admin_users.label_email')}</label>
                <input
                  required
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder={t('admin_users.placeholder_vendor_email')}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">{t('admin_users.label_password')}</label>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('admin_users.placeholder_password')}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">{t('admin_users.label_assigned_tour')}</label>
              <select
                value={assignedTourId}
                onChange={(e) => setAssignedTourId(e.target.value)}
                className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">{t('admin_users.no_assigned_tour')}</option>
                {tours.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={createVendorMutation.isPending}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
              >
                {createVendorMutation.isPending ? t('admin_users.creating') : t('admin_users.create_account')}
              </button>
            </div>
          </form>
        </section>
      )}

      {activeTab === 'create-zone-admin' && (
        <section className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-950">{t('users.create_zone_admin')}</h2>
              <p className="text-xs font-semibold text-slate-500">{t('admin_users.zone_admin_desc')}</p>
            </div>
          </div>

          <form onSubmit={handleCreateZoneAdminSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-xs font-bold text-green-700">
                {success}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">{t('admin_users.label_admin_name')}</label>
                <input
                  required
                  value={zoneAdminName}
                  onChange={(e) => setZoneAdminName(e.target.value)}
                  placeholder={t('admin_users.placeholder_admin_name')}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">{t('admin_users.label_email')}</label>
                <input
                  required
                  type="email"
                  value={zoneAdminEmail}
                  onChange={(e) => setZoneAdminEmail(e.target.value)}
                  placeholder={t('admin_users.placeholder_admin_email')}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">{t('admin_users.label_password')}</label>
                <input
                  required
                  type="password"
                  value={zoneAdminPassword}
                  onChange={(e) => setZoneAdminPassword(e.target.value)}
                  placeholder={t('admin_users.placeholder_password')}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">{t('users.select_zone')}</label>
                <select
                  required
                  value={assignedZoneId}
                  onChange={(e) => setAssignedZoneId(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">{t('users.select_zone')}</option>
                  {zoneOptions.map((zone) => (
                    <option key={zone.value} value={zone.value}>
                      {zone.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={createZoneAdminMutation.isPending}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {createZoneAdminMutation.isPending ? t('admin_users.creating') : t('users.create_zone_admin')}
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
