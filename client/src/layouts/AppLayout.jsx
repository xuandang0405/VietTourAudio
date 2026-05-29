import { NavLink, Outlet } from 'react-router-dom';
const logo = `${import.meta.env.BASE_URL}brand/logo.png`;
const logoText = `${import.meta.env.BASE_URL}brand/logo-text.png`;

function AppLayout() {
  return (
    <div className="site-shell">
      <header className="navbar">
        <NavLink className="brand" to="/" aria-label="VietTourAudio home">
          <img className="brand-icon" src={logo} alt="" aria-hidden="true" />
          <img className="brand-text" src={logoText} alt="VietTourAudio" />
        </NavLink>
        <nav className="nav-links" aria-label="Main navigation">
          <NavLink to="/map">Bản đồ</NavLink>
          <NavLink to="/premium">Premium</NavLink>
          <NavLink to="/stall-dashboard">Chủ sạp</NavLink>
          <NavLink to="/admin-dashboard">Admin</NavLink>
        </nav>
        <div className="nav-actions">
          <NavLink className="ghost-button" to="/login">Đăng nhập</NavLink>
          <NavLink className="primary-button compact" to="/register">Đăng ký</NavLink>
        </div>
      </header>

      <Outlet />

      <footer className="footer">
        <img src={logoText} alt="VietTourAudio" />
        <p>Web app/PWA thuyết minh du lịch tự động theo GPS, QR và audio đa ngôn ngữ.</p>
      </footer>
    </div>
  );
}

export default AppLayout;
