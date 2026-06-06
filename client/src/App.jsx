import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout.jsx';
import AdminDashboard from './pages/AdminDashboard/index.jsx';
import Home from './pages/Home/index.jsx';
import Login from './pages/Login/index.jsx';
import MapPage from './pages/Map/index.jsx';
import Payment from './pages/Payment/index.jsx';
import Premium from './pages/Premium/index.jsx';
import Profile from './pages/Profile/index.jsx';
import Register from './pages/Register/index.jsx';
import Saved from './pages/Saved/index.jsx';
import StallDashboard from './pages/StallDashboard/index.jsx';
import ZoneLanding from './pages/ZoneLanding/index.jsx';
import ZoneMap from './pages/ZoneMap/index.jsx';
import VietnamMapIllustration from './components/VietnamMapIllustration.jsx';
import { defaultZoneSlug } from './data/zones.js';
import logo from './assets/logo/logo.png';
import logoText from './assets/logo/logo-text.png';

function SplashScreen() {
  return (
    <main className="splash-screen">
      <div className="soundwave-bg" aria-hidden="true" />
      <VietnamMapIllustration variant="splash" />
      <section className="splash-card">
        <img className="splash-logo" src={logo} alt="VietTourAudio" />
        <img className="splash-logo-text" src={logoText} alt="VietTourAudio" />
        <p>Thuyết minh du lịch tự động theo GPS, QR và âm thanh đa ngôn ngữ.</p>
        <Link className="primary-button sunset" to={`/zone/${defaultZoneSlug}`}>
          Bắt đầu hành trình
        </Link>
      </section>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route element={<AppLayout />}>
          <Route path="/zone/:zoneSlug" element={<ZoneLanding />} />
          <Route path="/zone/:zoneSlug/map" element={<ZoneMap />} />
          <Route path="/explore" element={<Home />} />
          <Route path="/map" element={<Navigate to={`/zone/${defaultZoneSlug}/map`} replace />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/premium" element={<Premium />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/stall-dashboard" element={<StallDashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/legacy-map" element={<MapPage />} />
        </Route>
        <Route path="*" element={<Navigate to={`/zone/${defaultZoneSlug}`} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
