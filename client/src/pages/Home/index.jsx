import { ArrowRight, Compass, QrCode, Star, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState, ErrorState, LoadingState } from '../../components/UiState.jsx';
import ZoneQrCard from '../../components/ZoneQrCard.jsx';
import { zones } from '../../data/zones.js';
import logo from '../../assets/logo/logo.png';

function Home() {
  const isLoading = false;
  const hasError = false;
  const zoneList = zones;

  return (
    <main className="screen global-dashboard-screen">
      <header className="explore-header">
        <div className="mini-brand">
          <img src={logo} alt="VietTourAudio" />
          <div>
            <span>Global Dashboard</span>
            <strong>Khám phá theo khu vực</strong>
          </div>
        </div>
        <Link className="avatar-button" to="/profile" aria-label="Hồ sơ">
          <UserRound size={20} />
        </Link>
      </header>

      <section className="global-hero-panel">
        <div>
          <p className="eyebrow">Zone Based PWA</p>
          <h1>Điểm đến tiếp theo của bạn?</h1>
          <p>VietTourAudio chỉ mở dữ liệu chi tiết khi khách quét đúng QR tại từng khu vực.</p>
        </div>
        <Compass size={54} />
      </section>

      {isLoading && <LoadingState title="Đang tải khu vực" description="VietTourAudio đang lấy danh sách khu vực có QR riêng." />}
      {hasError && <ErrorState title="Không thể tải khu vực" description="Kiểm tra kết nối hoặc thử lại sau." />}
      {!isLoading && !hasError && zoneList.length === 0 && (
        <EmptyState title="Chưa có khu vực" description="Khu vực sẽ xuất hiện khi admin tạo QR khu vực trên hệ thống." />
      )}
      {!isLoading && !hasError && zoneList.length > 0 && (
        <section className="zone-grid" aria-label="Danh sách khu vực">
          {zoneList.map((zone) => (
            <article className="zone-card" key={zone.id}>
              <Link className="zone-card-cover" to={zone.qrPath}>
                <img src={zone.coverImage} alt={zone.name} />
                <span className={zone.accessLabel === 'Cần quét QR' ? 'locked' : ''}>
                  <QrCode size={14} />
                  {zone.accessLabel}
                </span>
              </Link>
              <div className="zone-card-body">
                <h2>{zone.name}</h2>
                <p>{zone.city}</p>
                <div className="zone-card-meta">
                  <span>{zone.poiCount} điểm</span>
                  <span>{zone.audioMinutes} phút</span>
                  <span><Star size={13} fill="currentColor" />{zone.rating}</span>
                </div>
                <ZoneQrCard zone={zone} compact />
                <Link className="zone-card-link" to={zone.qrPath}>
                  Mở không gian khu vực
                  <ArrowRight size={16} />
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

export default Home;
