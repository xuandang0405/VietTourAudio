import { Crown, Headphones, MapPinned, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getVisitorSessionId } from '../../utils/visitorSession';
import { usePremiumStore } from '../vendor-wallet/stores/premiumStore';
import { CheckoutMatrix } from './CheckoutMatrix';
import { Confetti } from '../../visitor/components/Confetti';
import { premiumAccessApi } from './premiumAccessApi';

export function UserPremiumUpgrade() {
  const { t } = useTranslation();
  const applyServerStatus = usePremiumStore((state) => state.applyServerStatus);
  const [celebrating, setCelebrating] = useState(false);
  const handleSuccess = async () => {
    applyServerStatus(await premiumAccessApi.getStatus());
    setCelebrating(true);
    window.setTimeout(() => setCelebrating(false), 2200);
  };
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 px-4 py-12 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="text-center"><Crown className="mx-auto text-amber-300" size={44} /><h1 className="mt-4 text-4xl font-black">{t('payment.premium_presentation_title')}</h1><p className="mt-3 text-slate-300">{t('payment.premium_desc')}</p><div className="mx-auto mt-5 inline-flex items-end gap-2 rounded-2xl border border-amber-300/30 bg-amber-300/10 px-6 py-3"><strong className="text-4xl font-black text-amber-300">30.000</strong><span className="pb-1 font-bold text-amber-100">VND / 24 giờ</span></div></header>
        <div className="mx-auto my-8 grid max-w-3xl gap-3 sm:grid-cols-3">
          {[['payment.feature_audio', Headphones], ['payment.feature_map', MapPinned], ['payment.feature_unlimited', Sparkles]].map(([key, Icon]) => <div key={key} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center"><Icon className="mx-auto text-teal-300" /><p className="mt-2 text-sm font-bold">{t(key)}</p></div>)}
        </div>
        <CheckoutMatrix senderId={getVisitorSessionId()} senderType="USER" transactionType="USER_PREMIUM" onSuccess={handleSuccess} />
      </div>
      <Confetti show={celebrating} />
    </main>
  );
}
