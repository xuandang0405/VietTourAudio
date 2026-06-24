import { Edit3, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminBadge } from '../components/AdminBadge';
import { AdminDataTable } from '../components/AdminDataTable';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminModal } from '../components/AdminModal';
import {
  useAdminPois,
  useStallsList,
  useCreatePoi,
  useUpdatePoi,
  useDeletePoi,
  usePoiDistance
} from '../api/adminQueries';

export function AdminPois() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | { type: 'add' } | { type: 'edit', poi } | { type: 'delete', poi }
  const [error, setError] = useState('');
  const [distancePoiA, setDistancePoiA] = useState('');
  const [distancePoiB, setDistancePoiB] = useState('');

  // Form states
  const [formName, setFormName] = useState('');
  const [formStallId, setFormStallId] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLatitude, setFormLatitude] = useState('');
  const [formLongitude, setFormLongitude] = useState('');
  const [formRadius, setFormRadius] = useState('');
  const [formIsPremium, setFormIsPremium] = useState(false);
  const [formStatus, setFormStatus] = useState('ACTIVE');

  // Queries & Mutations
  const { data: pois = [], isLoading, error: listError } = useAdminPois();
  const { data: stalls = [] } = useStallsList();
  const createMutation = useCreatePoi();
  const updateMutation = useUpdatePoi();
  const deleteMutation = useDeletePoi();
  const distanceQuery = usePoiDistance(distancePoiA, distancePoiB);

  // Filtered rows
  const filteredPois = useMemo(() => {
    return pois.filter(
      (poi) =>
        (poi.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (poi.stallName ?? '').toLowerCase().includes(search.toLowerCase())
    );
  }, [pois, search]);

  const poiOptions = useMemo(() => {
    return pois.map((poi) => ({
      value: poi.id,
      label: poi.stallName ? `${poi.name} - ${poi.stallName}` : poi.name
    }));
  }, [pois]);

  const distanceMeters = distanceQuery.data?.distanceMeters;
  const distanceLabel = Number.isFinite(distanceMeters) ? Math.round(distanceMeters) : null;

  function openAddModal() {
    setError('');
    setFormName('');
    setFormStallId(stalls[0]?.id ?? '');
    setFormDescription('');
    setFormLatitude('10.77582'); // default to Nguyen Hue walking street center
    setFormLongitude('106.70208');
    setFormRadius('25');
    setFormIsPremium(false);
    setFormStatus('ACTIVE');
    setModal({ type: 'add' });
  }

  function openEditModal(poi) {
    setError('');
    setFormName(poi.name ?? '');
    setFormStallId(poi.stallId ?? '');
    setFormDescription(poi.description ?? '');
    setFormLatitude(String(poi.latitude ?? ''));
    setFormLongitude(String(poi.longitude ?? ''));
    setFormRadius(String(poi.activationRadius ?? '25'));
    setFormIsPremium(Boolean(poi.isPremiumContent));
    setFormStatus(poi.status ?? 'ACTIVE');
    setModal({ type: 'edit', poi });
  }

  function openDeleteModal(poi) {
    setError('');
    setModal({ type: 'delete', poi });
  }

  async function handleConfirm() {
    if (!modal) return;
    setError('');

    try {
      if (modal.type === 'delete') {
        await deleteMutation.mutateAsync(modal.poi.id);
      } else {
        if (!formName.trim()) {
          setError(t('poi.error_name_empty'));
          return;
        }
        if (!formStallId) {
          setError(t('poi.error_stall_empty'));
          return;
        }

        const lat = Number(formLatitude);
        const lng = Number(formLongitude);
        const rad = Number(formRadius);

        if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
          setError(t('poi.error_lat_invalid'));
          return;
        }
        if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
          setError(t('poi.error_lng_invalid'));
          return;
        }
        if (!Number.isFinite(rad) || rad <= 0) {
          setError(t('poi.error_radius_invalid'));
          return;
        }

        const payload = {
          stallId: formStallId,
          name: formName.trim(),
          description: formDescription.trim(),
          latitude: lat,
          longitude: lng,
          activationRadius: rad,
          isPremiumContent: formIsPremium,
          status: formStatus
        };

        if (modal.type === 'add') {
          await createMutation.mutateAsync(payload);
        } else {
          await updateMutation.mutateAsync({ id: modal.poi.id, data: payload });
        }
      }
      setModal(null);
    } catch (err) {
      setError(err.response?.data?.error ?? t('poi.error_save'));
    }
  }

  const columns = [
    {
      key: 'id',
      label: t('poi.poi_code'),
      render: (poi) => <span className="font-black text-slate-950">#{poi.id}</span>
    },
    {
      key: 'name',
      label: t('poi.poi_name'),
      render: (poi) => (
        <div>
          <p className="font-black text-slate-950">{poi.name}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{poi.stallName}</p>
        </div>
      )
    },
    {
      key: 'coordinates',
      label: t('poi.coordinates'),
      render: (poi) => (
        <span className="text-xs font-mono text-slate-600">
          {poi.latitude?.toFixed(6) ?? '-'}, {poi.longitude?.toFixed(6) ?? '-'}
        </span>
      )
    },
    {
      key: 'activationRadius',
      label: t('poi.radius'),
      render: (poi) => (
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
          {poi.activationRadius}m
        </span>
      )
    },
    {
      key: 'contents',
      label: t('poi.languages'),
      render: (poi) => t('poi.contents_count', { count: poi.contents ?? 0 })
    },
    {
      key: 'mediaFiles',
      label: t('poi.media'),
      render: (poi) => t('poi.media_files_count', { count: poi.mediaFiles ?? 0 })
    },
    {
      key: 'status',
      label: t('common.status'),
      render: (poi) => <AdminBadge status={poi.status} />
    },
    {
      key: 'actions',
      label: t('common.action'),
      cellClassName: 'px-4 py-3 text-right',
      render: (poi) => (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => openEditModal(poi)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
            aria-label={t('poi.edit_poi')}
          >
            <Edit3 size={16} />
          </button>
          <button
            type="button"
            onClick={() => openDeleteModal(poi)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-red-200 text-red-700 transition hover:bg-red-50"
            aria-label={t('poi.delete_poi')}
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <AdminPageHeader
        eyebrow={t('poi.management_subtitle')}
        title={t('poi.poi_name')}
        description={t('poi.management_description')}
        action={
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={17} />
            {t('poi.add_poi')}
          </button>
        }
      />

      {(error || listError) && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {error || listError?.response?.data?.error || t('poi.error_load')}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <label className="flex h-10 min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 lg:w-96">
          <Search size={17} className="text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
            placeholder={t('poi.search_placeholder')}
          />
        </label>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">{t('poi.distance_tool')}</label>
            <select
              value={distancePoiA}
              onChange={(event) => setDistancePoiA(event.target.value)}
              className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500"
            >
              <option value="">{t('poi.select_poi_a')}</option>
              {poiOptions.map((poi) => (
                <option key={poi.value} value={poi.value}>
                  {poi.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">{t('poi.select_poi_b')}</label>
            <select
              value={distancePoiB}
              onChange={(event) => setDistancePoiB(event.target.value)}
              className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500"
            >
              <option value="">{t('poi.select_poi_b')}</option>
              {poiOptions.map((poi) => (
                <option key={poi.value} value={poi.value}>
                  {poi.label}
                </option>
              ))}
            </select>
          </div>

          <div className="min-h-11 rounded-xl bg-blue-50 px-4 py-3 text-sm font-black text-blue-700">
            {distancePoiA && distancePoiB && distancePoiA === distancePoiB
              ? t('poi.distance_same_poi')
              : distanceQuery.isFetching
                ? t('poi.distance_loading')
                : distanceLabel == null
                  ? t('poi.distance_empty')
                  : t('poi.distance_result', { distance: distanceLabel })}
          </div>
        </div>
      </section>

      <AdminDataTable
        columns={columns}
        rows={filteredPois}
        emptyText={isLoading ? t('poi.loading_list') : t('poi.no_pois_found')}
      />

      {/* Form Modal */}
      <AdminModal
        open={Boolean(modal) && modal?.type !== 'delete'}
        title={modal?.type === 'add' ? t('poi.add_poi') : t('poi.edit_poi')}
        description={t('poi.form_description_hint')}
        confirmLabel={modal?.type === 'add' ? t('common.add') : t('common.save')}
        tone="success"
        onClose={() => setModal(null)}
        onConfirm={handleConfirm}
      >
        <div className="space-y-4 py-2">
          {error && <p className="text-xs font-bold text-red-600">{error}</p>}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">{t('poi.form_name')}</label>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t('poi.form_name_placeholder')}
                className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">{t('poi.form_stall')}</label>
              <select
                value={formStallId}
                onChange={(e) => setFormStallId(e.target.value)}
                className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500"
              >
                {stalls.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
                {stalls.length === 0 && <option value="">{t('poi.no_stall')}</option>}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">{t('common.description')}</label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder={t('poi.form_desc_placeholder')}
              className="w-full h-20 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">{t('poi.form_latitude')}</label>
              <input
                type="number"
                step="any"
                value={formLatitude}
                onChange={(e) => setFormLatitude(e.target.value)}
                placeholder="10.77582"
                className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">{t('poi.form_longitude')}</label>
              <input
                type="number"
                step="any"
                value={formLongitude}
                onChange={(e) => setFormLongitude(e.target.value)}
                placeholder="106.70208"
                className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">{t('poi.form_radius_m')}</label>
              <input
                type="number"
                value={formRadius}
                onChange={(e) => setFormRadius(e.target.value)}
                placeholder="25"
                className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">{t('common.status')}</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
                className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500"
              >
                <option value="ACTIVE">{t('common.active')}</option>
                <option value="DRAFT">{t('common.draft')}</option>
                <option value="INACTIVE">{t('common.inactive')}</option>
                <option value="ARCHIVED">{t('common.archived')}</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isPremiumContent"
                checked={formIsPremium}
                onChange={(e) => setFormIsPremium(e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isPremiumContent" className="text-sm font-bold text-slate-700">
                {t('poi.premium_content')}
              </label>
            </div>
          </div>
        </div>
      </AdminModal>

      {/* Delete Confirmation Modal */}
      <AdminModal
        open={modal?.type === 'delete'}
        title={t('poi.delete_confirm_title')}
        description={t('poi.delete_soft_confirm_desc', { name: modal?.poi?.name })}
        confirmLabel={t('poi.confirm_hide')}
        tone="danger"
        onClose={() => setModal(null)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
