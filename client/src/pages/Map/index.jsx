import { Crown, LocateFixed, MapPin, Navigation, Play } from 'lucide-react';
import VietnamMapIllustration from '../../components/VietnamMapIllustration.jsx';

const markers = [
  { label: 'Huế', className: 'marker-hue', premium: false },
  { label: 'Hội An', className: 'marker-hoian', premium: true },
  { label: 'TP.HCM', className: 'marker-saigon', premium: false }
];

function MapPage() {
  return (
    <main className="map-screen">
      <section className="map-toolbar">
        <div>
          <p className="eyebrow">Interactive Map</p>
          <h1>Bản đồ thuyết minh</h1>
        </div>
        <button type="button" aria-label="Dẫn đường">
          <Navigation size={20} />
        </button>
      </section>

      <section className="interactive-map" aria-label="Bản đồ Việt Nam có Hoàng Sa và Trường Sa">
        <div className="map-watermark">
          <VietnamMapIllustration variant="map" />
        </div>
        <div className="map-grid-overlay" aria-hidden="true" />

        {markers.map((marker) => (
          <button className={`poi-marker ${marker.className} ${marker.premium ? 'premium' : ''}`} type="button" key={marker.label}>
            {marker.premium ? <Crown size={16} /> : <MapPin size={16} />}
            <span>{marker.label}</span>
          </button>
        ))}

        <article className="map-popup-card">
          <span>Premium POI</span>
          <h2>Phố Cổ Hội An</h2>
          <p>Audio tour 45 phút · 4.9 ★</p>
          <button type="button"><Play size={16} fill="currentColor" />Phát thuyết minh</button>
        </article>

        <button className="locate-fab" type="button" aria-label="Định vị vị trí hiện tại">
          <LocateFixed size={24} />
        </button>
      </section>
    </main>
  );
}

export default MapPage;
