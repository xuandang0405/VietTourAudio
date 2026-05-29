function AdminDashboard() {
  return (
    <main className="dashboard-shell">
      <section className="page-heading">
        <p className="eyebrow">Admin</p>
        <h1>Dashboard hệ thống</h1>
        <p>Quản lý người dùng, chủ sạp, thanh toán, premium, hoa hồng và media.</p>
      </section>
      <section className="admin-table">
        <div><strong>Sạp chờ duyệt</strong><span>7</span></div>
        <div><strong>Thanh toán hôm nay</strong><span>23</span></div>
        <div><strong>Audio cần kiểm duyệt</strong><span>14</span></div>
        <div><strong>Hoa hồng chờ trả</strong><span>9</span></div>
      </section>
    </main>
  );
}

export default AdminDashboard;
