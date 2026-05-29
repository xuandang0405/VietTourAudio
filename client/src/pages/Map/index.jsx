function MapPage() {
  return (
    <main className="page-shell">
      <section className="page-heading">
        <p className="eyebrow">Map</p>
        <h1>Bản đồ thuyết minh</h1>
        <p>Khung màn hình bản đồ cho POI, geofence, vị trí GPS và audio tự động.</p>
      </section>
      <section className="map-preview">
        <div className="map-route" />
        <div className="map-pin primary-pin">POI</div>
        <div className="map-pin secondary-pin">QR</div>
        <aside>
          <h2>Đang ở gần</h2>
          <p>Góc rang cà phê phin</p>
          <span>Bán kính kích hoạt: 35m</span>
        </aside>
      </section>
    </main>
  );
}

export default MapPage;
