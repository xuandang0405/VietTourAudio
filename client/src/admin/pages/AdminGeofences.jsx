import { Circle, CircleMarker, MapContainer, TileLayer, Tooltip } from 'react-leaflet';
import { AlertTriangle, Crosshair, RefreshCcw, ShieldCheck } from 'lucide-react';
import { AdminBadge } from '../components/AdminBadge';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { useGeofences } from '../api/adminQueries';

const defaultCenter = [10.77582, 106.70208];

export function AdminGeofences() {
  const { data: stalls = [], isLoading, error, refetch } = useGeofences();
  const validStalls = stalls.filter((stall) => Number.isFinite(Number(stall.latitude)) && Number.isFinite(Number(stall.longitude)));
  const center = validStalls.length ? [Number(validStalls[0].latitude), Number(validStalls[0].longitude)] : defaultCenter;
  const overlapCount = validStalls.filter((stall) => (stall.overlaps ?? []).length > 0).length;

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <AdminPageHeader
        eyebrow="Geofence"
        title="Bản đồ vùng kích hoạt"
        description="Kiểm tra activation radius của stall và phát hiện vùng chồng lấn trước khi duyệt vận hành."
        action={
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
          >
            <RefreshCcw size={17} />
            Làm mới
          </button>
        }
      />

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {error.response?.data?.error ?? 'Không tải được dữ liệu geofence.'}
        </div>
      )}

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="order-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:order-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-950">Danh sách stall</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {isLoading ? 'Đang tải...' : `${validStalls.length} stall, ${overlapCount} có overlap`}
              </p>
            </div>
            {overlapCount > 0 ? <AlertTriangle className="text-red-500" size={22} /> : <ShieldCheck className="text-green-600" size={22} />}
          </div>

          <div className="mt-4 max-h-[620px] space-y-3 overflow-y-auto pr-1">
            {validStalls.map((stall) => {
              const hasOverlap = (stall.overlaps ?? []).length > 0;

              return (
                <article key={stall.id} className={hasOverlap ? 'rounded-xl border border-red-200 bg-red-50 p-3' : 'rounded-xl border border-slate-100 bg-slate-50 p-3'}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-950">{stall.name}</p>
                      <p className="mt-1 truncate text-xs font-semibold text-slate-500">{stall.vendor?.businessName}</p>
                    </div>
                    <AdminBadge status={stall.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600">
                    <span className="inline-flex items-center gap-1.5">
                      <Crosshair size={14} />
                      Radius {stall.activationRadius}m
                    </span>
                    {hasOverlap && <span className="rounded-full bg-red-100 px-2 py-1 text-red-700">{stall.overlaps.length} overlap</span>}
                  </div>
                </article>
              );
            })}
            {!isLoading && validStalls.length === 0 && (
              <p className="rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">Chưa có stall có tọa độ.</p>
            )}
          </div>
        </aside>

        <article className="order-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:order-2">
          <div className="h-[420px] w-full md:h-[560px] xl:h-[calc(100vh-210px)]">
            <MapContainer center={center} zoom={16} className="h-full w-full" zoomControl={false}>
              <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {validStalls.map((stall) => {
                const hasOverlap = (stall.overlaps ?? []).length > 0;
                const color = hasOverlap ? '#DC2626' : stall.status === 'ACTIVE' ? '#2563EB' : '#94A3B8';
                const position = [Number(stall.latitude), Number(stall.longitude)];

                return (
                  <Circle
                    key={`${stall.id}-circle`}
                    center={position}
                    radius={stall.activationRadius}
                    pathOptions={{
                      color,
                      fillColor: color,
                      fillOpacity: hasOverlap ? 0.18 : 0.12,
                      weight: hasOverlap ? 3 : 2
                    }}
                  />
                );
              })}
              {validStalls.map((stall) => {
                const hasOverlap = (stall.overlaps ?? []).length > 0;
                const position = [Number(stall.latitude), Number(stall.longitude)];

                return (
                  <CircleMarker
                    key={stall.id}
                    center={position}
                    radius={hasOverlap ? 11 : 9}
                    pathOptions={{
                      color: '#ffffff',
                      fillColor: hasOverlap ? '#DC2626' : stall.status === 'ACTIVE' ? '#2563EB' : '#64748B',
                      fillOpacity: 0.95,
                      weight: 3
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                      <span className="text-xs font-bold">{stall.name}</span>
                    </Tooltip>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
        </article>
      </section>
    </div>
  );
}
