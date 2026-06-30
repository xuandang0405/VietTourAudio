function Register() {
  return (
    <main className="auth-shell">
      <section className="auth-panel wide">
        <p className="eyebrow">Stall onboarding</p>
        <h1>Đăng ký chủ sạp</h1>
        <form className="form-grid two-columns">
          <label>Họ tên<input type="text" placeholder="Tên chủ sạp" /></label>
          <label>Email<input type="email" placeholder="owner@viettouraudio.local" /></label>
          <label>Số điện thoại<input type="tel" placeholder="090..." /></label>
          <label>Tên sạp<input type="text" placeholder="Sạp đặc sản địa phương" /></label>
          <label className="full-row">Mô tả<textarea placeholder="Giới thiệu ngắn về sạp" /></label>
          <button className="primary-button" type="button">Gửi đăng ký</button>
        </form>
      </section>
    </main>
  );
}

export default Register;
