const metrics = ['Lượt ghé', 'Lượt quét QR', 'Lượt nghe audio', 'Doanh thu', 'Khách Premium'];

function StallDashboard() {
  return (
    <main className="dashboard-shell">
      <section className="page-heading">
        <p className="eyebrow">Stall Dashboard</p>
        <h1>Dashboard chủ sạp</h1>
        <p>Theo dõi hiệu quả sạp, QR, audio và doanh thu trong ngày.</p>
      </section>
      <section className="dashboard-grid">
        {metrics.map((metric, index) => (
          <article className="metric-card" key={metric}>
            <span>{metric}</span>
            <strong>{[128, 84, 96, '5.48M', 12][index]}</strong>
          </article>
        ))}
      </section>
    </main>
  );
}

export default StallDashboard;
