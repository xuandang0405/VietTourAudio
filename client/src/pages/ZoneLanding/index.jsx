import { Globe2, MapPin, ShieldCheck, Star } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import ZoneQrCard from '../../components/ZoneQrCard.jsx';
import { getZoneBySlug } from '../../data/zones.js';
import logoText from '../../assets/logo/logo-text.png';

function ZoneLanding() {
  const { zoneSlug } = useParams();
  const zone = getZoneBySlug(zoneSlug);

  return (
    <main className="zone-landing-screen">
      <section className="zone-hero">
        <img src={zone.coverImage} alt={zone.name} />
        <div className="zone-hero-overlay" />
        <header className="zone-hero-topbar">
          <img src={logoText} alt="VietTourAudio" />
          <button type="button" aria-label="Đổi ngôn ngữ">
            <Globe2 size={18} />
            VI
          </button>
        </header>
      </section>

      <section className="zone-content-panel">
        <p className="zone-status"><ShieldCheck size={16} />{zone.statusLabel}</p>
        <h1>{zone.name}</h1>
        <div className="zone-meta-row" aria-label="Thông tin khu vực">
          <span><MapPin size={15} />{zone.poiCount} Điểm tham quan</span>
          <span>{zone.audioMinutes} Phút Audio</span>
          <span><Star size={15} fill="currentColor" />{zone.rating}/5</span>
        </div>
        <p className="zone-summary">{zone.summary}</p>

        <Link className="primary-button sunset full-width zone-cta" to={`/zone/${zone.slug}/map`}>
          MUA GÓI AUDIO KHU VỰC NÀY - {zone.audioPrice}
        </Link>

        <ZoneQrCard zone={zone} />
      </section>
    </main>
  );
}

export default ZoneLanding;
