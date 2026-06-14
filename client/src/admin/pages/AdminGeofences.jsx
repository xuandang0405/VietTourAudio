import { Circle, CircleMarker, MapContainer, TileLayer, Tooltip } from 'react-leaflet';
import { Crosshair, ShieldCheck } from 'lucide-react';
import { AdminBadge } from '../components/AdminBadge';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { adminPois } from '../data/adminMockData';

const center = [10.77582, 106.70208];

export function AdminGeofences() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <AdminPageHeader
        eyebrow="Geofence"
        title="Bản đồ vùng kích hoạt"
        description="Kiểm tra bán kính auto-play của các POI và phát hiện vùng chồng lấn trước khi duyệt nội dung."
        action={
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white shadow-sm transition duration-200 ease-out hover:bg-blue-700"
          >
            <ShieldCheck size={17} />
            Check overlap
          </button>
        }
      />

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="order-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:order-1">
          <h2 className="text-base font-black text-slate-950">Danh sách POI</h2>
          <div className="mt-4 grid gap-3">
            {adminPois.map((poi) => (
              <article key={poi.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950">{poi.name}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{poi.category}</p>
                  </div>
                  <AdminBadge status={poi.status} />
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-600">
                  <Crosshair size={14} />
                  Radius {poi.activationRadius}m
                </div>
              </article>
            ))}
          </div>
        </aside>

        <article className="order-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:order-2">
          <div className="h-[400px] w-full md:h-[520px] xl:h-[calc(100vh-210px)]">
            <MapContainer center={center} zoom={16} className="h-full w-full" zoomControl={false}>
              <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {adminPois.map((poi) => (
                <Circle
                  key={`${poi.id}-circle`}
                  center={[poi.latitude, poi.longitude]}
                  radius={poi.activationRadius}
                  pathOptions={{
                    color: poi.status === 'ACTIVE' ? '#3B82F6' : '#94A3B8',
                    fillColor: poi.status === 'ACTIVE' ? '#3B82F6' : '#94A3B8',
                    fillOpacity: 0.12,
                    weight: 2
                  }}
                />
              ))}
              {adminPois.map((poi) => (
                <CircleMarker
                  key={poi.id}
                  center={[poi.latitude, poi.longitude]}
                  radius={9}
                  pathOptions={{
                    color: '#ffffff',
                    fillColor: poi.status === 'ACTIVE' ? '#2563EB' : '#64748B',
                    fillOpacity: 0.95,
                    weight: 3
                  }}
                >
                  <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                    <span className="text-xs font-bold">{poi.name}</span>
                  </Tooltip>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </article>
      </section>
    </div>
  );
}
