import { Bell, ChevronRight, Languages, ShieldCheck, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';

const options = [
  ['Ngôn ngữ', 'Tiếng Việt', Languages],
  ['Thông báo GPS', 'Đang bật', Bell],
  ['Quyền riêng tư', 'An toàn', ShieldCheck]
];

function Profile() {
  return (
    <main className="screen profile-screen">
      <section className="profile-card">
        <span className="profile-avatar"><UserRound size={28} /></span>
        <div>
          <p>Xin chào</p>
          <h1>Khách du lịch</h1>
        </div>
      </section>

      <div className="settings-list">
        {options.map(([title, value, Icon]) => (
          <button type="button" key={title}>
            <Icon size={20} />
            <span>{title}</span>
            <strong>{value}</strong>
            <ChevronRight size={18} />
          </button>
        ))}
      </div>

      <Link className="primary-button sunset full-width" to="/login">Đăng nhập tài khoản</Link>
    </main>
  );
}

export default Profile;
