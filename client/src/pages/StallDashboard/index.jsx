import { EmptyState, ErrorState, LoadingState } from '../../components/UiState.jsx';

const metrics = ['Lượt ghé', 'Lượt quét QR', 'Lượt nghe audio', 'Doanh thu', 'Khách Premium'];

function StallDashboard() {
  const isLoading = false;
  const hasError = false;

  return (
    <main className="dashboard-shell">
      <section className="page-heading">
        <p className="eyebrow">Stall Dashboard</p>
        <h1>Dashboard chủ sạp</h1>
        <p>Theo dõi hiệu quả sạp, QR, audio và doanh thu trong ngày.</p>
      </section>
      {isLoading && <LoadingState title="Đang tải thống kê sạp" description="Dữ liệu dashboard sẽ được đồng bộ từ API analytics." />}
      {hasError && <ErrorState title="Không thể tải dashboard" description="Vui lòng thử lại hoặc kiểm tra quyền chủ sạp." />}
      {!isLoading && !hasError && metrics.length === 0 && (
        <EmptyState title="Chưa có thống kê" description="Chỉ số sẽ xuất hiện khi có lượt ghé, lượt quét QR hoặc thanh toán." />
      )}
      {!isLoading && !hasError && metrics.length > 0 && (
        <section className="dashboard-grid">
          {metrics.map((metric, index) => (
            <article className="metric-card" key={metric}>
              <span>{metric}</span>
              <strong>{[128, 84, 96, '5.48M', 12][index]}</strong>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

export default StallDashboard;
