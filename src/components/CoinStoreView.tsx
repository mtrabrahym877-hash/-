import React, { useState } from 'react';
import { Coins, Crown, CheckCircle2, Sparkles, ArrowUpRight, Gift } from 'lucide-react';
import {
  UserProfile,
  COIN_PACKAGES,
  VIP_PLANS,
  CoinPackage,
  VipPlan,
  CoinTransaction,
  VIP_TIER_LABELS,
} from '../types';

interface CoinStoreViewProps {
  currentUser: UserProfile;
  transactions: CoinTransaction[];
  onPurchasePackage: (pkg: CoinPackage) => Promise<void>;
  onClaimDailyReward: () => Promise<void>;
  onUpgradeVip: (plan: VipPlan) => Promise<void>;
}

export const CoinStoreView: React.FC<CoinStoreViewProps> = ({
  currentUser,
  transactions,
  onPurchasePackage,
  onClaimDailyReward,
  onUpgradeVip,
}) => {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [confirmationBanner, setConfirmationBanner] = useState<string | null>(null);

  const handleBuyBundle = async (pkg: CoinPackage) => {
    if (processingId) return;
    setProcessingId(pkg.id);
    try {
      await onPurchasePackage(pkg);
      setConfirmationBanner(
        `تم شحن ${(pkg.coins + pkg.bonusCoins).toLocaleString('en-US')} كوينز من «${pkg.name}» إلى محفظتك بنجاح.`
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleDailyReward = async () => {
    if (processingId) return;
    setProcessingId('daily_reward');
    try {
      await onClaimDailyReward();
      setConfirmationBanner('تمت إضافة إكرامية الضيافة اليومية (+150 كوينز) إلى رصيدك.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleVipPurchase = async (plan: VipPlan) => {
    if (processingId) return;
    setProcessingId(plan.tier);
    try {
      await onUpgradeVip(plan);
      setConfirmationBanner(`مبارك! تمت ترقية عضويتك إلى «${plan.title}».`);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-12">
      {/* Store Header & Wallet Balance Summary */}
      <div className="bg-[#131B2E] border border-white/10 rounded-xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="max-w-xl">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <span>خزينة مجلسنا</span>
            <span aria-hidden="true">·</span>
            <span>شحن فوري وموثق</span>
            <span aria-hidden="true">·</span>
            <span>مرتبتك الحالية: {VIP_TIER_LABELS[currentUser.vipTier]}</span>
          </div>
          <h1 className="text-3xl font-bold font-display text-white">
            متجر الكوينز والألقاب الملكية
          </h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            اشحن رصيدك من الكوينز الذهبية لإرسال الهدايا التراثية العربية في الغرف
            الصوتية، ودعم المضيفين والشعراء، وترقية مقامك في صدارة المجلس.
          </p>
        </div>

        <div className="w-full md:w-auto bg-[#0B0F17] border border-[#D4AF37]/40 rounded-xl p-5 flex items-center justify-between md:justify-start gap-6">
          <div>
            <span className="text-xs text-slate-400 block">رصيد محفظتك الحالي</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono-num text-[#D4AF37]">
                {currentUser.coins.toLocaleString('en-US')}
              </span>
              <span className="text-xs text-slate-300">كوينز ذهبي</span>
            </div>
          </div>

          <button
            onClick={handleDailyReward}
            disabled={processingId !== null}
            className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/40 hover:bg-[#D4AF37]/25 transition-colors whitespace-nowrap flex items-center gap-1.5"
          >
            <Gift className="w-4 h-4" />
            <span>إكرامية اليوم (+150)</span>
          </button>
        </div>
      </div>

      {confirmationBanner && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-700/50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-sm text-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{confirmationBanner}</span>
          </div>
          <button
            onClick={() => setConfirmationBanner(null)}
            className="text-xs text-emerald-300 hover:text-white whitespace-nowrap"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Section 1: Featured Coin Bundles */}
      <section>
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold font-display text-white">
              01. باقات شحن الكوينز الذهبية
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              اختر الباقة المناسبة واحصل على كوينز إضافية مجانية مع كل عملية شحن
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {COIN_PACKAGES.map((pkg) => {
            const totalCoins = pkg.coins + pkg.bonusCoins;
            return (
              <div
                key={pkg.id}
                className={`bg-[#131B2E] rounded-xl border overflow-hidden flex flex-col justify-between transition-transform duration-150 hover:-translate-y-0.5 ${
                  pkg.featured
                    ? 'border-[#D4AF37]'
                    : 'border-white/10'
                }`}
              >
                <div>
                  {/* Product Imagery (65%+ visual prominence) */}
                  <div className="relative h-48 bg-[#0B0F17] overflow-hidden">
                    <img
                      src={pkg.image}
                      alt={pkg.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#131B2E] via-transparent to-transparent" />
                    {pkg.featured && (
                      <span className="absolute top-3 left-3 text-xs font-medium text-[#D4AF37] bg-[#0B0F17]/90 px-2.5 py-1 rounded">
                        الأكثر طلباً
                      </span>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                      <span>شحن فوري</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-400 font-mono-num">
                        +{pkg.bonusCoins.toLocaleString('en-US')} مجاناً
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white">{pkg.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {pkg.subtitle}
                    </p>

                    <div className="mt-4 pt-4 border-t border-white/10 flex items-baseline justify-between">
                      <div>
                        <span className="text-xs text-slate-400 block">الإجمالي</span>
                        <span className="font-mono-num text-lg font-bold text-[#D4AF37]">
                          {totalCoins.toLocaleString('en-US')} كوينز
                        </span>
                      </div>
                      <div className="text-left">
                        <span className="text-xs text-slate-400 block">السعر</span>
                        <span className="font-mono-num text-base font-semibold text-white">
                          {pkg.priceSar} ر.س
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-5">
                  <button
                    onClick={() => handleBuyBundle(pkg)}
                    disabled={processingId !== null}
                    className="w-full py-2.5 px-4 rounded-lg text-xs font-bold bg-[#D4AF37] text-[#0B0F17] hover:bg-[#e3be42] disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    {processingId === pkg.id ? 'جاري الشحن...' : 'شحن الباقة الآن'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 2: VIP Memberships */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold font-display text-white">
            02. المراتب والألقاب الملكية (VIP)
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            ارتقِ بمكانتك في المجالس الصوتية باستخدام رصيد الكوينز الخاص بك
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {VIP_PLANS.map((plan) => {
            const isCurrentTier = currentUser.vipTier === plan.tier;
            const canAfford = currentUser.coins >= plan.costCoins;

            return (
              <div
                key={plan.tier}
                className="bg-[#131B2E] border border-white/10 rounded-xl p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-slate-400">{plan.subtitle}</span>
                    <Crown className="w-5 h-5 text-[#D4AF37]" />
                  </div>

                  <h3 className="text-xl font-bold text-white">{plan.title}</h3>

                  <div className="my-4 pb-4 border-b border-white/10 flex items-baseline gap-2">
                    <span className="font-mono-num text-2xl font-bold text-[#D4AF37]">
                      {plan.costCoins.toLocaleString('en-US')}
                    </span>
                    <span className="text-xs text-slate-400">كوينز ذهبي</span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-300 mb-6">
                    {plan.perks.map((perk, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#D4AF37] font-bold">·</span>
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleVipPurchase(plan)}
                  disabled={isCurrentTier || !canAfford || processingId !== null}
                  className={`w-full py-2.5 px-4 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                    isCurrentTier
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/40 cursor-default'
                      : canAfford
                      ? 'bg-white text-[#0B0F17] hover:bg-slate-200'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isCurrentTier
                    ? 'مرتبتك الفعالة حالياً'
                    : canAfford
                    ? `ترقية مقابل ${plan.costCoins.toLocaleString('en-US')} كوينز`
                    : 'رصيد الكوينز غير كافٍ'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 3: Recent Transactions Ledger */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-bold font-display text-white">
            03. سجل العمليات المالية الأخير
          </h2>
        </div>

        <div className="bg-[#131B2E] border border-white/10 rounded-xl overflow-hidden">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              لا توجد عمليات مسجلة بعد. اشحن أول باقة أو اطلب إكرامية اليوم للبدء.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-[#0B0F17] text-xs text-slate-400 border-b border-white/10">
                  <tr>
                    <th className="py-3 px-4 font-medium">العملية</th>
                    <th className="py-3 px-4 font-medium">النوع</th>
                    <th className="py-3 px-4 font-medium text-left">المقدار</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {transactions.slice(0, 8).map((tx) => (
                    <tr key={tx.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-4 text-white font-medium">
                        {tx.title}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400">
                        {tx.type === 'topup'
                          ? 'شحن باقة'
                          : tx.type === 'gift_sent'
                          ? 'إهداء في مجلس'
                          : tx.type === 'vip_upgrade'
                          ? 'ترقية عضوية'
                          : 'إكرامية يومية'}
                      </td>
                      <td
                        className={`py-3 px-4 font-mono-num font-semibold text-left ${
                          tx.amount >= 0 ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {tx.amount >= 0 ? `+${tx.amount.toLocaleString('en-US')}` : tx.amount.toLocaleString('en-US')}{' '}
                        كوينز
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
