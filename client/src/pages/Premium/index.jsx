function Premium() {
  return (
    <main className="page-shell">
      <section className="page-heading">
        <p className="eyebrow">Premium</p>
        <h1>Gói Premium</h1>
        <p>Ưu tiên hiển thị trên bản đồ, thêm giọng audio cao cấp, ảnh và video giới thiệu.</p>
      </section>
      <section className="pricing-grid">
        <article className="price-card">
          <span>Standard</span>
          <strong>99.000đ</strong>
          <p>Quản lý sạp, QR và audio cơ bản.</p>
        </article>
        <article className="price-card featured">
          <span>Premium</span>
          <strong>299.000đ</strong>
          <p>Ưu tiên hiển thị, media nổi bật và giọng đọc Premium.</p>
        </article>
      </section>
    </main>
  );
}

export default Premium;
