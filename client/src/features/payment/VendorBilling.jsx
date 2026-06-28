import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useVendorAuthStore } from '../../vendor/store/vendorAuthStore';
import { CheckoutMatrix } from './CheckoutMatrix';

export function VendorBilling() {
  const { t } = useTranslation();
  const user = useVendorAuthStore((state) => state.user);
  const [type, setType] = useState('VENDOR_SUBSCRIPTION');
  const senderId = user?.vendorId ?? user?.id;
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-black text-slate-950">{t('payment.vendor_billing_title')}</h1>
      <p className="mt-2 text-slate-500">{t('payment.vendor_billing_desc')}</p>
      <div className="my-6 flex gap-3">
        {['VENDOR_SUBSCRIPTION', 'VENDOR_PREMIUM'].map((value) => <button key={value} type="button" onClick={() => setType(value)} className={`rounded-xl px-4 py-3 text-sm font-black ${type === value ? 'bg-teal-600 text-white' : 'border bg-white text-slate-600'}`}>{t(`payment.${value.toLowerCase()}`)}</button>)}
      </div>
      <CheckoutMatrix senderId={senderId} senderType="VENDOR" transactionType={type} />
    </div>
  );
}
