import { Circle, CircleMarker, MapContainer, TileLayer, Tooltip, useMapEvents } from 'react-leaflet';
import { AlertTriangle, Crosshair, RefreshCcw, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminBadge } from '../../../admin/components/AdminBadge';
import { AdminPageHeader } from '../../../admin/components/AdminPageHeader';
import { useGeofenceAllData } from '../../../admin/api/adminQueries';

const defaultCenter = [10.77582, 106.70208];

function MapZoomTracker({ onZoomChange }) {
  const map = useMapEvents({
    zoomend() {
      onZoomChange(map.getZoom());
    }
  });
  return null;
}

export function AdminGeofences() {
  const { t } = useTranslation();
  const [zoom, setZoom] = useState(16);
  const { data = {}, isLoading, error, refetch } = useGeofenceAllData();

  const stalls = data.stalls ?? [];
  const pois = data.pois ?? [];
  const tours = data.tours ?? [];

  const validStalls = stalls.filter((stall) => Number.isFinite(Number(stall.latitude)) && Number.isFinite(Number(stall.longitude)));
  const center = validStalls.length ? [Number(validStalls[0].latitude), Number(validStalls[0].longitude)] : defaultCenter;
  const overlapCount = validStalls.filter((stall) => (stall.overlaps ?? []).length > 0).length;

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <AdminPageHeader
        eyebrow={t('geofence.eyebrow')}
        title={t('geofence.title')}
        description={t('geofence.subtitle')}
        action={
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
          >
            <RefreshCcw size={17} />
            {t('geofence.refresh')}
          </button>
        }
      />

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {error.response?.data?.error ?? t('geofence.error_loading')}
        </div>
      )}

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="order-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:order-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-950">{t('geofence.stall_list')}</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {isLoading ? t('geofence.loading') : t('geofence.stall_count', { total: validStalls.length, overlap: overlapCount })}
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
                      {t('geofence.radius', { radius: stall.activationRadius })}
                    </span>
                    {hasOverlap && <span className="rounded-full bg-red-100 px-2 py-1 text-red-700">{t('geofence.overlaps_count', { count: stall.overlaps.length })}</span>}
                  </div>
                </article>
              );
            })}
            {!isLoading && validStalls.length === 0 && (
              <p className="rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">{t('geofence.no_stalls')}</p>
            )}
          </div>
        </aside>

        <article className="order-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:order-2">
          <div className="h-[420px] w-full md:h-[560px] xl:h-[calc(100vh-210px)] relative">
            <div className="absolute top-3 left-3 z-[1000] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-black text-slate-700 shadow-sm">
              {t('geofence.zoom_level', { zoom, type: zoom < 15 ? t('geofence.zoom_macro') : t('geofence.zoom_micro') })}
            </div>
            <MapContainer center={center} zoom={zoom} className="h-full w-full" zoomControl={true}>
              <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapZoomTracker onZoomChange={setZoom} />

              {/* Zoom Level Xa: Draw Tours */}
              {zoom < 15 &&
                tours.map((tour) => (
                  <Circle
                    key={`tour-${tour.id}`}
                    center={[Number(tour.latitude), Number(tour.longitude)]}
                    radius={tour.radius}
                    pathOptions={{
                      color: '#0D9488',
                      fillColor: '#0D9488',
                      fillOpacity: 0.15,
                      weight: 3
                    }}
                  >
                    <Tooltip direction="center" permanent={false} opacity={0.9}>
                      <span className="text-xs font-bold text-teal-800">{t('geofence.tour')}: {tour.name}</span>
                    </Tooltip>
                  </Circle>
                ))}

              {/* Zoom Level Gan: Draw Stalls & POIs */}
              {zoom >= 15 && (
                <>
                  {/* Stalls */}
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
                          <span className="text-xs font-bold">🏪 {t('geofence.stall')}: {stall.name}</span>
                        </Tooltip>
                      </CircleMarker>
                    );
                  })}

                  {/* POIs */}
                  {pois.map((poi) => {
                    const position = [Number(poi.latitude), Number(poi.longitude)];
                    const color = poi.status === 'ACTIVE' ? '#0F766E' : '#B45309';

                    return (
                      <Circle
                        key={`poi-${poi.id}-circle`}
                        center={position}
                        radius={poi.activationRadius}
                        pathOptions={{
                          color,
                          fillColor: color,
                          fillOpacity: 0.1,
                          weight: 1.5,
                          dashArray: '4, 4'
                        }}
                      />
                    );
                  })}
                  {pois.map((poi) => {
                    const position = [Number(poi.latitude), Number(poi.longitude)];

                    return (
                      <CircleMarker
                        key={`poi-${poi.id}`}
                        center={position}
                        radius={7}
                        pathOptions={{
                          color: '#ffffff',
                          fillColor: poi.status === 'ACTIVE' ? '#0F766E' : '#D97706',
                          fillOpacity: 0.9,
                          weight: 2
                        }}
                      >
                        <Tooltip direction="top" offset={[0, -6]} opacity={1}>
                          <span className="text-xs font-bold">📍 {t('geofence.poi')}: {poi.name}</span>
                        </Tooltip>
                      </CircleMarker>
                    );
                  })}
                </>
              )}
            </MapContainer>
          </div>
        </article>
      </section>
    </div>
  );
}
