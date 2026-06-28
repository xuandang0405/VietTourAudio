import { useTranslation } from 'react-i18next';
import { Building2, MapPin, QrCode, DollarSign, Music, RefreshCcw, Landmark } from 'lucide-react';
import { useDashboardAnalytics } from '../../admin/api/adminQueries';
import { EmptyState, ErrorState, LoadingState } from '../../components/UiState.jsx';

function AdminDashboard() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useDashboardAnalytics();

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <LoadingState title={t('dashboard.loading', { defaultValue: 'Đang tải dữ liệu vận hành...' })} description={t('dashboard.loading_desc', { defaultValue: 'Hệ thống đang trích xuất dữ liệu phân tích thời gian thực từ database.' })} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <ErrorState title={t('dashboard.error', { defaultValue: 'Không thể tải dữ liệu dashboard' })} description={t('dashboard.error_desc', { defaultValue: 'Vui lòng kiểm tra kết nối mạng hoặc quyền tài khoản admin.' })} />
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const tourStats = data?.tourStats || [];
  const poiStats = data?.poiStats || [];

  return (
    <main className="mx-auto max-w-[1600px] space-y-6 pb-24 px-4 sm:px-6">
      {/* Top Banner Heading */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-xl animate-fade-in">
        <div className="space-y-1.5">
          <p className="text-xs font-extrabold uppercase tracking-widest text-indigo-400">
            {t('dashboard.panel', { defaultValue: 'Bảng quản trị' })}
          </p>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {t('dashboard.title', { defaultValue: 'Dashboard Hệ Thống' })}
          </h1>
          <p className="text-slate-300 text-sm font-medium max-w-xl">
            {t('dashboard.description', { defaultValue: 'Theo dõi tổng quan tài chính, nhà cung cấp, quét mã QR và hoạt động phát thuyết minh thời gian thực.' })}
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-black text-white hover:bg-white/10 active:scale-[0.98] transition shadow-lg"
        >
          <RefreshCcw size={14} />
          {t('common.refresh', { defaultValue: 'Làm mới' })}
        </button>
      </section>

      {/* KPI Cards Grid */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Revenue */}
        <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm transition hover:shadow-md hover:scale-[1.01] duration-300 group">
          <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-emerald-50/50 transition-all duration-300 group-hover:scale-110" />
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t('dashboard.revenue', { defaultValue: 'Doanh thu Premium' })}
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-800 mt-0.5">
                {(Number(kpis.totalRevenue) || 0).toLocaleString('vi-VN')} ₫
              </h3>
            </div>
          </div>
        </div>

        {/* Card 2: Vendors */}
        <div className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-white p-6 shadow-sm transition hover:shadow-md hover:scale-[1.01] duration-300 group">
          <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-indigo-50/50 transition-all duration-300 group-hover:scale-110" />
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
              <Building2 size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t('dashboard.vendors', { defaultValue: 'Nhà cung cấp' })}
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-800 mt-0.5">
                {kpis.activeVendors ?? 0} / {kpis.totalVendors ?? 0}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-1">
                {kpis.pendingVendors ?? 0} {t('dashboard.pending', { defaultValue: 'chờ duyệt' })}
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Active POIs */}
        <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-white p-6 shadow-sm transition hover:shadow-md hover:scale-[1.01] duration-300 group">
          <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-blue-50/50 transition-all duration-300 group-hover:scale-110" />
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <MapPin size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t('dashboard.active_pois', { defaultValue: 'Điểm POI' })}
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-800 mt-0.5">
                {kpis.activePois ?? 0}
              </h3>
              <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wide mt-1">
                {t('dashboard.active_status', { defaultValue: 'Đang hoạt động' })}
              </p>
            </div>
          </div>
        </div>

        {/* Card 4: QR Scans */}
        <div className="relative overflow-hidden rounded-3xl border border-amber-100 bg-white p-6 shadow-sm transition hover:shadow-md hover:scale-[1.01] duration-300 group">
          <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-amber-50/50 transition-all duration-300 group-hover:scale-110" />
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <QrCode size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t('dashboard.scans', { defaultValue: 'Tổng lượt quét QR' })}
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-800 mt-0.5">
                {kpis.totalScans ?? 0}
              </h3>
              <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wide mt-1">
                {t('dashboard.scans_lifetime', { defaultValue: 'Toàn thời gian' })}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Lists */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Tours/Zones Activity */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Landmark size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                {t('dashboard.tours_activity', { defaultValue: 'Hoạt động theo Khu vực (Tour)' })}
              </h3>
              <p className="text-xs font-semibold text-slate-500">
                {t('dashboard.tours_activity_desc', { defaultValue: 'Xếp hạng khu vực theo lượt quét mã QR.' })}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            {tourStats.length === 0 ? (
              <div className="py-12 text-center text-sm font-semibold text-slate-400">
                {t('dashboard.no_tours', { defaultValue: 'Không có dữ liệu khu vực.' })}
              </div>
            ) : (
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-black uppercase text-slate-400 tracking-wider">
                    <th className="pb-3 pr-4 font-black">{t('dashboard.tour_name', { defaultValue: 'Tên khu vực' })}</th>
                    <th className="pb-3 px-4 font-black text-center">{t('dashboard.tour_pois', { defaultValue: 'Số POI' })}</th>
                    <th className="pb-3 pl-4 font-black text-right">{t('dashboard.tour_scans', { defaultValue: 'Lượt quét QR' })}</th>
                  </tr>
                </thead>
                <tbody>
                  {tourStats.map((tRow) => (
                    <tr key={tRow.tourId} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition">
                      <td className="py-3.5 pr-4 font-bold text-slate-800">
                        {tRow.tourName}
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-500 text-center">
                        {tRow.poiCount}
                      </td>
                      <td className="py-3.5 pl-4 font-black text-indigo-600 text-right">
                        {(Number(tRow.scanCount) || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: POIs Activity */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Music size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                {t('dashboard.pois_activity', { defaultValue: 'Điểm tham quan nghe nhiều nhất' })}
              </h3>
              <p className="text-xs font-semibold text-slate-500">
                {t('dashboard.pois_activity_desc', { defaultValue: 'Thống kê số lần phát audio thuyết minh.' })}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            {poiStats.length === 0 ? (
              <div className="py-12 text-center text-sm font-semibold text-slate-400">
                {t('dashboard.no_pois', { defaultValue: 'Không có dữ liệu điểm POI.' })}
              </div>
            ) : (
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-black uppercase text-slate-400 tracking-wider">
                    <th className="pb-3 pr-4 font-black">{t('dashboard.poi_name', { defaultValue: 'Tên POI / Sạp' })}</th>
                    <th className="pb-3 px-4 font-black text-center">{t('dashboard.poi_visits', { defaultValue: 'Lượt ghé' })}</th>
                    <th className="pb-3 pl-4 font-black text-right">{t('dashboard.poi_plays', { defaultValue: 'Lượt phát' })}</th>
                  </tr>
                </thead>
                <tbody>
                  {poiStats.slice(0, 8).map((pRow) => (
                    <tr key={pRow.poiId} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition">
                      <td className="py-3.5 pr-4 font-bold text-slate-800">
                        <div className="max-w-[200px] sm:max-w-[300px] truncate">
                          <p className="font-bold text-slate-800">{pRow.poiName}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{pRow.tourName}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-500 text-center">
                        {(Number(pRow.visitCount) || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 pl-4 font-black text-amber-600 text-right">
                        {(Number(pRow.playCount) || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default AdminDashboard;
