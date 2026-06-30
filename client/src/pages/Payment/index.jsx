import { SuccessBadge } from '../../components/UiState.jsx';

function Payment() {
  return (
    <main className="page-shell">
      <section className="payment-panel">
        <div>
          <p className="eyebrow">Payment</p>
          <h1>Thanh toán QR</h1>
          <p>Khung màn hình thanh toán cho MoMo, Bank QR, Stripe và ghi nhận tiền mặt.</p>
          <SuccessBadge>QR sẵn sàng</SuccessBadge>
        </div>
        <div className="qr-placeholder">QR</div>
        <button className="primary-button secondary" type="button">Kiểm tra trạng thái thanh toán</button>
      </section>
    </main>
  );
}

export default Payment;
