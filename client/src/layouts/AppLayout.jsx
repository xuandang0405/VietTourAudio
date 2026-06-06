import { Compass, Map, MapPin, UserRound } from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import AudioPlayerSheet from '../components/AudioPlayerSheet.jsx';
import ScrollReset from '../components/ScrollReset.jsx';
import { defaultZoneSlug } from '../data/zones.js';
import logoText from '../assets/logo/logo-text.png';

function AppLayout() {
  const location = useLocation();
  const showAudioSheet = /^\/zone\/[^/]+\/map/.test(location.pathname);
  const isZoneFlow = /^\/zone\/[^/]+/.test(location.pathname);
  const currentZoneSlug = location.pathname.match(/^\/zone\/([^/]+)/)?.[1] ?? defaultZoneSlug;
  const tabs = [
    { to: `/zone/${currentZoneSlug}`, label: 'Khu vực', icon: MapPin, end: true },
    { to: `/zone/${currentZoneSlug}/map`, label: 'Bản đồ', icon: Map, end: true },
    { to: '/explore', label: 'Khám phá', icon: Compass, end: true },
    { to: '/profile', label: 'Hồ sơ', icon: UserRound, end: true }
  ];

  return (
    <div className="app-viewport">
      <ScrollReset />
      <div className={showAudioSheet ? 'mobile-shell has-audio-sheet' : 'mobile-shell'}>
        {!isZoneFlow && (
          <header className="app-topbar">
            <NavLink className="brand" to={`/zone/${defaultZoneSlug}`} aria-label="VietTourAudio home">
              <img className="brand-text" src={logoText} alt="VietTourAudio" />
            </NavLink>
          </header>
        )}

        <div className="app-content">
          <Outlet />
        </div>

        {showAudioSheet && <AudioPlayerSheet />}

        <nav className="bottom-nav" aria-label="Điều hướng chính">
          {tabs.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              className={({ isActive }) => [
                'bottom-tab',
                isActive ? 'active' : ''
              ].filter(Boolean).join(' ')}
              to={to}
              end={end}
              key={to}
            >
              <span><Icon size={21} /></span>
              <small>{label}</small>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}

export default AppLayout;
