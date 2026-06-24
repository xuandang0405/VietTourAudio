import { PaymentRepository } from '../repositories/payment.repository';

export class PaymentService {
  private paymentRepo = new PaymentRepository();

  async getPremiumQrData() {
    const qrValue = await this.paymentRepo.getSettingValue('PREMIUM_PAYMENT_QR');

    return {
      qrValue: qrValue ?? 'MOMO-PAY-PREMIUM-12345',
      bankAccount: '190382910283 (Techcombank)',
      transferContent: 'VTA PREMIUM',
      amount: 30000,
      currency: 'VND',
      message: 'Quét mã để thanh toán. Cú pháp: [Số điện thoại của bạn]',
    };
  }
}
