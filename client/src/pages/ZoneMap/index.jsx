import { useState } from 'react';
import { LocateFixed, MapPin, Play, QrCode, Search, Satellite, Sparkles } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { EmptyState, ErrorState, LoadingState } from '../../components/UiState.jsx';
import { getZoneBySlug } from '../../data/zones.js';
import { triggerHaptic } from '../../utils/haptics.js';

function ZoneMap() {
  const { zoneSlug } = useParams();
  const zone = getZoneBySlug(zoneSlug);
  const isLoading = false;
  const hasError = false;
  const displayPois = zone.pois;
  const activePoi = displayPois.find((poi) => poi.nearest) ?? displayPois[0];
  const [isSatellite, setIsSatellite] = useState(false);

  return (
    <main className="zone-map-screen">
      <section className="screen-heading">
        <p className="eyebrow">Local Map</p>
        <h1>{zone.name}</h1>
        <p className="map-bounds-desc">{zone.mapBoundsLabel}</p>
      </section>

      <section className="local-map-panel" aria-label={`Bản đồ cục bộ ${zone.name}`}>
        <div className={`local-map-canvas ${isSatellite ? 'satellite-mode' : ''}`}>
          {isSatellite ? (
            <div className="satellite-overlay" />
          ) : (
            <>
              <div className="street-line main" />
              <div className="street-line branch-one" />
              <div className="street-line branch-two" />
              <div className="river-strip" />
            </>
          )}
          <div className="user-radius" aria-hidden="true" />

          {!isLoading && !hasError && displayPois.map((poi) => (
            <button
              className={`local-poi-pin ${poi.positionClass} ${poi.nearest ? 'nearest' : ''} ${poi.premium ? 'premium' : ''}`}
              type="button"
              key={poi.id}
              onClick={() => triggerHaptic([16, 28, 16])}
            >
              <MapPin size={17} fill="currentColor" />
              <span>{poi.name}</span>
            </button>
          ))}

          {activePoi && (
            <article className="local-map-popover">
              <span><Sparkles size={14} />Gần bạn nhất</span>
              <strong>{activePoi.name}</strong>
              <p>{activePoi.distance} · {activePoi.audioLength}</p>
              <button type="button" onClick={() => triggerHaptic(24)}>
                <Play size={15} fill="currentColor" />
                Phát thuyết minh
              </button>
            </article>
          )}

          <div className="map-controls-group">
            <button
              className="map-control-btn haptic-ripple"
              type="button"
              aria-label="Định vị lại"
              onClick={() => triggerHaptic(14)}
            >
              <LocateFixed size={18} />
            </button>
            <button
              className={`map-control-btn haptic-ripple ${isSatellite ? 'active' : ''}`}
              type="button"
              aria-label="Chế độ vệ tinh"
              onClick={() => {
                triggerHaptic(14);
                setIsSatellite(!isSatellite);
              }}
            >
              <Satellite size={18} />
            </button>
            <button
              className="map-control-btn haptic-ripple"
              type="button"
              aria-label="Quét QR sạp"
              onClick={() => triggerHaptic(18)}
            >
              <QrCode size={18} />
            </button>
          </div>
        </div>
      </section>

      <section className="zone-bottom-sheet" aria-label="Danh sách sạp trong khu vực">
        <div className="sheet-handle" aria-hidden="true" />
        <label className="search-bar compact">
          <Search size={18} />
          <input type="search" placeholder="Tìm sạp, quán ăn, di tích trong khu vực..." />
        </label>

        <div className="gps-empty-state">
          <Satellite size={18} />
          <span>Đang tìm kiếm vị trí của bạn... Hãy đảm bảo bạn đã cấp quyền GPS</span>
        </div>

        {isLoading && <LoadingState title="Đang tải sạp trong khu vực" description="Bản đồ đang lấy danh sách POI theo QR khu vực." />}
        {hasError && <ErrorState title="Không thể tải bản đồ cục bộ" description="Vui lòng kiểm tra GPS hoặc kết nối mạng." />}
        {!isLoading && !hasError && displayPois.length === 0 && (
          <EmptyState title="Chưa có sạp trong khu vực" description="Danh sách POI sẽ hiển thị sau khi backend trả dữ liệu cho QR khu vực này." />
        )}
        {!isLoading && !hasError && displayPois.length > 0 && (
          <div className="zone-poi-list">
            {displayPois.map((poi) => (
              <article className={poi.nearest ? 'zone-poi-card nearest' : 'zone-poi-card'} key={poi.id}>
                <div className="zone-poi-thumb">
                  <span>{poi.initials}</span>
                </div>
                <div>
                  <h2>{poi.name}</h2>
                  <p>{poi.type}</p>
                  <strong>{poi.distance}</strong>
                </div>
                <button className="haptic-ripple" type="button" aria-label={`Phát audio ${poi.name}`} onClick={() => triggerHaptic(24)}>
                  <Play size={18} fill="currentColor" />
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default ZoneMap;
