import { EmptyState, ErrorState, LoadingState } from '../../components/UiState.jsx';

const adminRows = [
  ['Sạp chờ duyệt', 7],
  ['Thanh toán hôm nay', 23],
  ['Audio cần kiểm duyệt', 14],
  ['Hoa hồng chờ trả', 9]
];

function AdminDashboard() {
  const isLoading = false;
  const hasError = false;

  return (
    <main className="dashboard-shell">
      <section className="page-heading">
        <p className="eyebrow">Admin</p>
        <h1>Dashboard hệ thống</h1>
        <p>Quản lý người dùng, chủ sạp, thanh toán, premium, hoa hồng và media.</p>
      </section>
      {isLoading && <LoadingState title="Đang tải dữ liệu admin" description="Các hàng quản trị sẽ được lấy từ backend." />}
      {hasError && <ErrorState title="Không thể tải dữ liệu admin" description="Vui lòng kiểm tra quyền admin hoặc thử lại." />}
      {!isLoading && !hasError && adminRows.length === 0 && (
        <EmptyState title="Chưa có tác vụ admin" description="Các tác vụ duyệt sạp, kiểm duyệt audio và hoa hồng sẽ xuất hiện tại đây." />
      )}
      {!isLoading && !hasError && adminRows.length > 0 && (
        <section className="admin-table">
          {adminRows.map(([label, value]) => (
            <div key={label}><strong>{label}</strong><span>{value}</span></div>
          ))}
        </section>
      )}
    </main>
  );
}

export default AdminDashboard;
