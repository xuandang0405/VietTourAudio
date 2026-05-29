import { Link } from 'react-router-dom';
const heroTravel = `${import.meta.env.BASE_URL}brand/hero-travel.png`;

const features = [
  ['GPS tự động', 'Kích hoạt thuyết minh khi khách đến gần sạp hoặc POI.'],
  ['QR tức thì', 'Mở đúng nội dung, ghi nhận lượt quét và nguồn giới thiệu.'],
  ['Audio đa ngôn ngữ', 'Hỗ trợ tiếng Việt, Anh và các ngôn ngữ du lịch phổ biến.'],
  ['Dashboard doanh thu', 'Theo dõi lượt ghé, lượt nghe, thanh toán và hoa hồng.']
];

function Home() {
  return (
    <main>
      <section className="hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(6, 78, 59, 0.92), rgba(15, 118, 110, 0.62)), url(${heroTravel})` }}>
        <div className="hero-content">
          <p className="eyebrow">GPS Audio Guide Platform</p>
          <h1>VietTourAudio</h1>
          <p className="hero-copy">
            PWA thuyết minh du lịch tự động theo GPS, QR và nội dung audio đa ngôn ngữ,
            giúp khách hiểu câu chuyện của từng điểm đến ngay khi họ bước tới.
          </p>
          <div className="hero-actions">
            <Link className="primary-button" to="/map">Bắt đầu khám phá</Link>
            <Link className="secondary-button" to="/register">Đăng ký chủ sạp</Link>
          </div>
        </div>
      </section>

      <section className="section feature-section">
        <div className="section-heading">
          <span className="eyebrow">Trải nghiệm lõi</span>
          <h2>Nghe đúng nơi, đúng ngôn ngữ, đúng thời điểm</h2>
        </div>
        <div className="feature-grid">
          {features.map(([title, description]) => (
            <article className="feature-card" key={title}>
              <span className="feature-mark" />
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section split-section">
        <div>
          <span className="eyebrow">Dành cho chủ sạp</span>
          <h2>Biến mỗi lượt ghé thành dữ liệu kinh doanh</h2>
          <p>
            Chủ sạp quản lý nội dung giới thiệu, ảnh, video, QR thanh toán, gói tháng và
            thống kê lượt khách trên cùng một dashboard.
          </p>
        </div>
        <div className="metric-panel">
          <div><strong>12.8K</strong><span>Lượt quét QR</span></div>
          <div><strong>7.4K</strong><span>Lượt nghe audio</span></div>
          <div><strong>10%</strong><span>Hoa hồng Premium</span></div>
        </div>
      </section>

      <section className="section premium-band">
        <div>
          <span className="eyebrow">Premium</span>
          <h2>Ưu tiên hiển thị, giọng đọc cao cấp và media nổi bật</h2>
          <p>
            Gói Premium giúp sạp xuất hiện nổi bật hơn trên bản đồ, có nhiều lựa chọn giọng
            audio và thêm ảnh/video giới thiệu để tăng tỷ lệ chuyển đổi.
          </p>
        </div>
        <Link className="primary-button light" to="/premium">Xem gói Premium</Link>
      </section>
    </main>
  );
}

export default Home;
