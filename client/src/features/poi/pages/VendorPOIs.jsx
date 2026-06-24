import { Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useVendorPois } from '../../../vendor/api/vendorQueries';

export function VendorPOIs() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const { data, isLoading, error } = useVendorPois();
  const pois = data?.pois ?? [];
  const filteredPois = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return pois;
    }

    return pois.filter((poi) =>
      [poi.name, poi.slug, poi.stallName, poi.description]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(keyword))
    );
  }, [pois, search]);

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-900">{t('poi.vendor_title')}</h2>
          <p className="text-slate-500 mt-1">{t('poi.vendor_desc')}</p>
        </div>
        <button type="button" disabled className="cursor-not-allowed rounded-xl bg-slate-200 px-4 py-2 font-bold text-slate-500 flex items-center gap-2">
          <Plus size={18} />
          {t('poi.vendor_add_disabled')}
        </button>
      </header>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {error.response?.data?.error ?? t('poi.error_load_vendor')}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder={t('poi.search_placeholder')} 
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-premium-500"
            />
          </div>
        </div>
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm">
              <th className="p-4 font-bold w-16">{t('poi.id')}</th>
              <th className="p-4 font-bold">{t('poi.poi_name')}</th>
              <th className="p-4 font-bold">{t('poi.stall')}</th>
              <th className="p-4 font-bold text-center">{t('poi.languages')}</th>
              <th className="p-4 font-bold text-center">{t('poi.listeners')}</th>
              <th className="p-4 font-bold text-center">{t('common.status')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredPois.map((poi) => (
              <tr key={poi.id} className="border-b border-slate-55 hover:bg-slate-50 transition">
                <td className="p-4 text-slate-400 text-sm font-mono">#{poi.id}</td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {poi.imageUrl ? (
                      <img src={poi.imageUrl} alt={poi.name} className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="grid h-12 w-12 place-items-center rounded-lg bg-slate-100 text-sm font-black text-slate-500">
                        {poi.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{poi.name}</p>
                      <p className="text-xs text-slate-500">{poi.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-sm text-slate-600">{poi.stallName}</td>
                <td className="p-4 text-center text-sm font-bold text-slate-700">{poi.languageCount}</td>
                <td className="p-4 text-center text-sm font-bold text-slate-700">{poi.audioPlays}</td>
                <td className="p-4 text-center">
                  <span className={poi.status === 'ACTIVE' ? 'inline-flex px-2 py-1 rounded-md bg-green-50 text-green-600 text-xs font-bold' : 'inline-flex px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold'}>
                    {poi.status === 'ACTIVE' ? t('common.active') : t('common.inactive')}
                  </span>
                  {poi.isPremiumContent && (
                    <span className="ml-2 inline-flex rounded-md bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">
                      {t('poi.premium_badge')}
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {!isLoading && filteredPois.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-sm font-semibold text-slate-500">
                  {t('poi.no_matching')}
                </td>
              </tr>
            )}
            {isLoading && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-sm font-semibold text-slate-500">
                  {t('poi.loading_list')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
