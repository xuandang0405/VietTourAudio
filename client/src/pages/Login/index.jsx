function Login() {
  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <p className="eyebrow">Welcome back</p>
        <h1>Đăng nhập</h1>
        <form className="form-grid">
          <label>Email<input type="email" placeholder="admin@viettouraudio.local" /></label>
          <label>Mật khẩu<input type="password" placeholder="••••••••" /></label>
          <button className="primary-button" type="button">Đăng nhập</button>
        </form>
      </section>
    </main>
  );
}

export default Login;
