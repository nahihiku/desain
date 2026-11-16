import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  CreditCard,
  Crown,
  Loader2,
  ShieldCheck,
  Sparkles,
  Tag,
  UserCheck,
  Wallet,
} from 'lucide-react';
import type {
  AccountVerificationResult,
  CurrencyCode,
  Denomination,
  GameItem,
  PaymentChannel,
  PaymentGroupId,
  PaymentMethodGroup,
} from '../types/topup';
import {
  calculateOrderSummary,
  formatCurrency,
  getCheckoutProgress,
  getEffectivePriceUsd,
  verifyGameAccount,
} from '../utils/pricing';
import {
  CornerReticle,
  CurrencyGlyph,
  EASE_CYBER,
  GameArtImage,
  MagneticButton,
  OdometerPrice,
  ParticleBurst,
  TiltCard,
} from './MotionPrimitives';

interface TopUpCheckoutViewProps {
  game: GameItem;
  initialDenominationId?: string;
  paymentGroups: PaymentMethodGroup[];
  currency: CurrencyCode;
  isReseller: boolean;
  saldoUsd: number;
  onBack: () => void;
  onOpenSaldo: () => void;
  onCompleteOrder: (payload: {
    game: GameItem;
    denomination: Denomination;
    paymentChannel: PaymentChannel;
    userId: string;
    serverZone: string;
    verifiedNickname: string;
    totalUsd: number;
  }) => void;
  onNotify: (title: string, description: string, variant?: 'success' | 'info' | 'error') => void;
}

export const TopUpCheckoutView: React.FC<TopUpCheckoutViewProps> = ({
  game,
  initialDenominationId,
  paymentGroups,
  currency,
  isReseller,
  saldoUsd,
  onBack,
  onOpenSaldo,
  onCompleteOrder,
  onNotify,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [userId, setUserId] = useState('');
  const [serverZone, setServerZone] = useState(
    game.fieldConfig.serverType === 'select' && game.fieldConfig.serverOptions?.length
      ? game.fieldConfig.serverOptions[0]
      : ''
  );
  const [verifying, setVerifying] = useState(false);
  const [verification, setVerification] = useState<AccountVerificationResult | null>(null);
  const [shakeAccount, setShakeAccount] = useState(false);
  const [verifyBurstKey, setVerifyBurstKey] = useState(0);
  const [denomBurstKey, setDenomBurstKey] = useState(0);

  const [selectedDenomId, setSelectedDenomId] = useState<string>(
    initialDenominationId ||
      game.denominations.find((d) => d.popular)?.id ||
      game.denominations[0].id
  );
  const [openPaymentGroup, setOpenPaymentGroup] = useState<PaymentGroupId>('qris');
  const [selectedChannelId, setSelectedChannelId] = useState<string>('qris-all');
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const step1Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUserId('');
    setServerZone(
      game.fieldConfig.serverType === 'select' && game.fieldConfig.serverOptions?.length
        ? game.fieldConfig.serverOptions[0]
        : ''
    );
    setVerification(null);
    setSelectedDenomId(
      initialDenominationId ||
        game.denominations.find((d) => d.popular)?.id ||
        game.denominations[0].id
    );
  }, [game, initialDenominationId]);

  const selectedDenomination =
    game.denominations.find((d) => d.id === selectedDenomId) ?? null;

  const allChannels = paymentGroups.flatMap((g) => g.channels);
  const selectedChannel =
    allChannels.find((c) => c.id === selectedChannelId) ?? null;

  const summary = calculateOrderSummary({
    denomination: selectedDenomination,
    paymentChannel: selectedChannel,
    promoCode: appliedPromo,
    isReseller,
  });

  const progress = getCheckoutProgress({
    isAccountVerified: Boolean(verification?.valid),
    hasDenomination: Boolean(selectedDenomination),
    hasPaymentMethod: Boolean(selectedChannel),
  });

  const isSaldoInsufficient =
    selectedChannel?.id === 'saldo-nipnime' && summary.totalUsd > saldoUsd;

  const triggerAccountShake = () => {
    setShakeAccount(true);
    window.setTimeout(() => setShakeAccount(false), 520);
  };

  const handleVerifyAccount = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setVerifying(true);
    setVerification(null);

    window.setTimeout(() => {
      const result = verifyGameAccount({
        gameId: game.id,
        fieldConfig: game.fieldConfig,
        userId,
        serverZone,
      });
      setVerifying(false);
      setVerification(result);
      if (!result.valid) {
        triggerAccountShake();
        onNotify('Verifikasi Gagal', result.error ?? 'Periksa ID tujuan.', 'error');
      } else {
        setVerifyBurstKey((k) => k + 1);
        onNotify(
          'Akun Terverifikasi',
          `Ditemukan ${result.nickname} (${result.region}).`,
          'success'
        );
      }
    }, 550);
  };

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedPromo(promoInput.trim());
    const testSummary = calculateOrderSummary({
      denomination: selectedDenomination,
      paymentChannel: selectedChannel,
      promoCode: promoInput.trim(),
      isReseller,
    });
    if (testSummary.promoApplied) {
      onNotify(
        `Promo ${testSummary.promoApplied} Aktif`,
        `Hemat ${formatCurrency(testSummary.promoDiscountUsd, currency)} di pesanan ini.`,
        'success'
      );
    } else if (promoInput.trim()) {
      onNotify('Kode Promo Tidak Valid', testSummary.promoError ?? 'Coba NIPNIME15.', 'error');
    }
  };

  const handleCheckout = () => {
    if (!verification?.valid || !verification.nickname) {
      const quickCheck = verifyGameAccount({
        gameId: game.id,
        fieldConfig: game.fieldConfig,
        userId,
        serverZone,
      });
      if (!quickCheck.valid) {
        setVerification(quickCheck);
        triggerAccountShake();
        step1Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        onNotify(
          'Cek ID Terlebih Dahulu',
          quickCheck.error ?? 'Masukkan dan cek ID akun tujuan sebelum checkout.',
          'error'
        );
        return;
      }
      setVerification(quickCheck);
      return;
    }

    if (!selectedDenomination || !selectedChannel) {
      onNotify('Lengkapi Pesanan', 'Pilih nominal dan metode pembayaran.', 'error');
      return;
    }

    if (isSaldoInsufficient) {
      onNotify(
        'Saldo NipNime Kurang',
        'Isi saldo terlebih dahulu atau pilih QRIS / E-Wallet.',
        'error'
      );
      onOpenSaldo();
      return;
    }

    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      onCompleteOrder({
        game,
        denomination: selectedDenomination,
        paymentChannel: selectedChannel,
        userId: userId.trim(),
        serverZone: serverZone.trim(),
        verifiedNickname: verification.nickname!,
        totalUsd: summary.totalUsd,
      });
    }, 650);
  };

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE_CYBER }}
      className="space-y-6 pb-24 lg:pb-8"
    >
      {/* Top Breadcrumb + Checkout Progress Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-[#151A23]/85 p-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-white/10 bg-[#0B0E14]/75 px-3.5 py-2 text-xs font-semibold text-[#F8FAFC] transition-colors hover:border-[#06B6D4]/50 hover:text-[#06B6D4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Kembali ke Katalog</span>
        </button>

        <div className="flex-1 sm:max-w-sm">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-[#94A3B8]">
              Progres Checkout · {progress.completedSteps}/3 langkah siap
            </span>
            <span className="font-mono font-semibold text-[#06B6D4] tabular-nums">
              {progress.percentage}%
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/[0.08]">
            <motion.div
              animate={{ scaleX: progress.percentage / 100 }}
              initial={{ scaleX: 0 }}
              transition={{ duration: 0.4, ease: EASE_CYBER }}
              style={{ transformOrigin: 'left' }}
              className="h-full w-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#06B6D4]"
            />
          </div>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        <div className="space-y-6 lg:col-span-8">
          {/* Game Header Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#151A23] p-5 sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="h-24 w-32 shrink-0 overflow-hidden rounded-xl border border-white/10 sm:h-28 sm:w-36">
                <GameArtImage
                  src={game.image}
                  alt={game.title}
                  emblem={game.emblem}
                  emblemCode={game.emblemCode}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-medium text-[#94A3B8]">
                    {game.publisher} · {game.category}
                  </span>
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="live-pulse-ring absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    </span>
                    Otomatis 24 Jam
                  </span>
                  {isReseller && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#06B6D4]">
                      <Crown className="h-3.5 w-3.5" aria-hidden="true" />
                      Harga Reseller (-8%)
                    </span>
                  )}
                </div>
                <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-[#F8FAFC] sm:text-3xl">
                  {game.title}
                </h1>
                <p className="mt-1.5 text-xs text-[#94A3B8] sm:text-sm">
                  {game.fieldConfig.helperText}
                </p>
              </div>
            </div>
          </div>

          {/* STEP 1: Account Verification with Laser Scan Beam & Particle Burst */}
          <motion.section
            ref={step1Ref}
            aria-labelledby="step-1-heading"
            animate={
              shakeAccount && !shouldReduceMotion
                ? { x: [0, -8, 8, -6, 6, 0] }
                : { x: 0 }
            }
            transition={{ duration: 0.42, ease: EASE_CYBER }}
            className={`relative overflow-hidden rounded-2xl border bg-[#151A23]/90 p-5 sm:p-6 transition-colors ${
              verification?.valid === false
                ? 'border-rose-500/60'
                : verification?.valid
                ? 'border-[#06B6D4]/50'
                : 'border-white/[0.08]'
            }`}
          >
            {/* Cyber Laser Scan Beam while verifying */}
            {verifying && !shouldReduceMotion && (
              <div
                aria-hidden="true"
                className="cyber-scan-beam pointer-events-none absolute inset-x-0 top-0 z-10 h-12 bg-gradient-to-b from-transparent via-[#06B6D4]/25 to-transparent"
              />
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#7C3AED] font-mono text-sm font-bold text-white">
                  1
                </span>
                <div>
                  <h2 id="step-1-heading" className="text-lg font-bold text-[#F8FAFC]">
                    Data Akun Tujuan
                  </h2>
                  <p className="text-xs text-[#94A3B8]">
                    Masukkan {game.fieldConfig.userIdLabel} untuk verifikasi otomatis
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setUserId(
                    game.id === 'valorant'
                      ? 'Shadow#ID1'
                      : game.category === 'Pulsa & E-Money'
                      ? '081234567890'
                      : '84920144'
                  );
                  if (game.fieldConfig.serverType === 'input') {
                    setServerZone('2049');
                  }
                  setVerification(null);
                }}
                className="text-xs font-medium text-[#06B6D4] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4] rounded"
              >
                Isi contoh ID
              </button>
            </div>

            <form onSubmit={handleVerifyAccount} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="relative">
                  <input
                    id="checkout-user-id"
                    type="text"
                    value={userId}
                    onChange={(e) => {
                      setUserId(e.target.value);
                      if (verification) setVerification(null);
                    }}
                    placeholder=" "
                    className="peer h-14 w-full rounded-xl border border-white/15 bg-[#0B0E14]/90 px-4 pt-5 pb-1.5 font-mono text-sm text-[#F8FAFC] transition-all duration-200 focus:border-[#06B6D4] focus:outline-none focus:ring-4 focus:ring-[#06B6D4]/15"
                  />
                  <label
                    htmlFor="checkout-user-id"
                    className="pointer-events-none absolute left-4 top-2 text-[11px] font-medium text-[#94A3B8] transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-[11px] peer-focus:text-[#06B6D4]"
                  >
                    {game.fieldConfig.userIdLabel}
                  </label>
                </div>

                {game.fieldConfig.requiresServer && game.fieldConfig.serverType === 'input' && (
                  <div className="relative">
                    <input
                      id="checkout-server-zone"
                      type="text"
                      value={serverZone}
                      onChange={(e) => {
                        setServerZone(e.target.value);
                        if (verification) setVerification(null);
                      }}
                      placeholder=" "
                      className="peer h-14 w-full rounded-xl border border-white/15 bg-[#0B0E14]/90 px-4 pt-5 pb-1.5 font-mono text-sm text-[#F8FAFC] transition-all duration-200 focus:border-[#06B6D4] focus:outline-none focus:ring-4 focus:ring-[#06B6D4]/15"
                    />
                    <label
                      htmlFor="checkout-server-zone"
                      className="pointer-events-none absolute left-4 top-2 text-[11px] font-medium text-[#94A3B8] transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-[11px] peer-focus:text-[#06B6D4]"
                    >
                      {game.fieldConfig.serverLabel ?? 'Zone ID'}
                    </label>
                  </div>
                )}

                {game.fieldConfig.requiresServer && game.fieldConfig.serverType === 'select' && (
                  <div className="relative">
                    <label
                      htmlFor="checkout-server-select"
                      className="pointer-events-none absolute left-4 top-2 text-[11px] font-medium text-[#06B6D4]"
                    >
                      {game.fieldConfig.serverLabel ?? 'Server'}
                    </label>
                    <select
                      id="checkout-server-select"
                      value={serverZone}
                      onChange={(e) => {
                        setServerZone(e.target.value);
                        if (verification) setVerification(null);
                      }}
                      className="h-14 w-full appearance-none rounded-xl border border-white/15 bg-[#0B0E14]/90 px-4 pt-5 pb-1.5 text-sm font-medium text-[#F8FAFC] transition-all duration-200 focus:border-[#06B6D4] focus:outline-none focus:ring-4 focus:ring-[#06B6D4]/15"
                    >
                      {game.fieldConfig.serverOptions?.map((opt) => (
                        <option key={opt} value={opt} className="bg-[#151A23] text-white">
                          {opt}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]"
                      aria-hidden="true"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative">
                  <ParticleBurst triggerKey={verifyBurstKey} />
                  <MagneticButton
                    type="submit"
                    variant="secondary"
                    disabled={verifying}
                    className="h-11 px-5 text-sm border-[#7C3AED]/40"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {verifying ? (
                        <motion.span
                          key="spinner"
                          initial={{ opacity: 0, scale: 0.7 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.7 }}
                          transition={{ duration: 0.16 }}
                          className="inline-flex items-center gap-2"
                        >
                          <Loader2 className="h-4 w-4 animate-spin text-[#06B6D4]" />
                          <span>Memindai ID...</span>
                        </motion.span>
                      ) : verification?.valid ? (
                        <motion.span
                          key="verified"
                          initial={{ opacity: 0, scale: 0.7 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.7 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                          className="inline-flex items-center gap-2 text-[#06B6D4]"
                        >
                          <Check className="h-4 w-4" />
                          <span>Terverifikasi</span>
                        </motion.span>
                      ) : (
                        <motion.span
                          key="idle"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="inline-flex items-center gap-2"
                        >
                          <UserCheck className="h-4 w-4 text-[#A78BFA]" />
                          <span>Cek ID</span>
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </MagneticButton>
                </div>

                <AnimatePresence mode="wait">
                  {verification?.valid && (
                    <motion.div
                      key="badge-ok"
                      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.94 }}
                      transition={{ type: 'spring', stiffness: 360, damping: 26 }}
                      className="inline-flex flex-wrap items-center gap-2 rounded-xl border border-[#06B6D4]/40 bg-[#06B6D4]/10 px-3.5 py-2 text-xs"
                    >
                      <ShieldCheck className="h-4 w-4 text-[#06B6D4]" aria-hidden="true" />
                      <span className="text-[#CBD5E1]">Nickname:</span>
                      <span className="font-mono font-bold text-[#F8FAFC]">
                        {verification.nickname}
                      </span>
                      {verification.tier && (
                        <span className="text-[#A78BFA] font-medium">· {verification.tier}</span>
                      )}
                    </motion.div>
                  )}
                  {verification && !verification.valid && (
                    <motion.p
                      key="badge-err"
                      role="alert"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-xs font-medium text-rose-400"
                    >
                      {verification.error}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </form>
          </motion.section>

          {/* STEP 2: Nominal Selection with CornerReticle Lock-On & Particle Burst */}
          <section
            aria-labelledby="step-2-heading"
            className="rounded-2xl border border-white/[0.08] bg-[#151A23]/90 p-5 sm:p-6"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#7C3AED] font-mono text-sm font-bold text-white">
                2
              </span>
              <div>
                <h2 id="step-2-heading" className="text-lg font-bold text-[#F8FAFC]">
                  Pilih Nominal {game.currencyName}
                </h2>
                <p className="text-xs text-[#94A3B8]">
                  Klik paket yang diinginkan · Masuk otomatis ke akun dalam hitungan detik
                </p>
              </div>
            </div>

            <div
              role="radiogroup"
              aria-label={`Paket ${game.currencyName}`}
              className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3"
            >
              {game.denominations.map((denom) => {
                const isSelected = denom.id === selectedDenomId;
                const effectivePriceUsd = getEffectivePriceUsd(denom.priceUsd, isReseller);

                return (
                  <TiltCard key={denom.id} maxTilt={6}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => {
                        setSelectedDenomId(denom.id);
                        setDenomBurstKey((k) => k + 1);
                      }}
                      className={`group relative flex h-full w-full flex-col justify-between overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4] ${
                        isSelected
                          ? 'border-[#06B6D4] bg-gradient-to-br from-[#7C3AED]/25 via-[#151A23] to-[#06B6D4]/20 shadow-lg shadow-[#06B6D4]/20'
                          : 'border-white/10 bg-[#0B0E14]/75 hover:border-[#7C3AED]/50 hover:bg-[#0B0E14]'
                      }`}
                    >
                      <CornerReticle active={isSelected} />
                      {isSelected && <ParticleBurst triggerKey={`${denom.id}-${denomBurstKey}`} />}

                      <AnimatePresence>
                        {isSelected && (
                          <motion.span
                            initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 480, damping: 24 }}
                            className="absolute top-3 right-3 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-[#06B6D4] text-[#0B0E14] shadow-md"
                          >
                            <Check className="h-3.5 w-3.5 stroke-[3]" aria-hidden="true" />
                          </motion.span>
                        )}
                      </AnimatePresence>

                      <div className="relative z-10 flex flex-col gap-2 pr-6 sm:flex-row sm:items-start sm:gap-3 sm:pr-7">
                        <CurrencyGlyph
                          type={denom.iconType}
                          className="h-7 w-7 shrink-0 sm:h-8 sm:w-8"
                        />
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-[#F8FAFC] leading-snug">
                            {denom.label}
                          </p>
                          {denom.bonus && (
                            <p className="mt-0.5 text-[11px] sm:text-xs font-semibold text-[#06B6D4]">
                              {denom.bonus}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="relative z-10 mt-4 flex items-end justify-between gap-2">
                        <div className="font-mono tabular-nums">
                          <p className="text-sm sm:text-base font-bold text-[#F8FAFC]">
                            {formatCurrency(effectivePriceUsd, currency)}
                          </p>
                          {(denom.originalPriceUsd || isReseller) && (
                            <p className="text-[11px] text-[#64748B] line-through">
                              {formatCurrency(denom.originalPriceUsd ?? denom.priceUsd, currency)}
                            </p>
                          )}
                        </div>
                        {denom.badge && (
                          <span className="text-[11px] font-semibold text-[#A78BFA]">
                            {denom.badge}
                          </span>
                        )}
                      </div>
                    </button>
                  </TiltCard>
                );
              })}
            </div>
          </section>

          {/* STEP 3: Payment Method Accordions (incl. Saldo NipNime) + Promo Code */}
          <section
            aria-labelledby="step-3-heading"
            className="rounded-2xl border border-white/[0.08] bg-[#151A23]/90 p-5 sm:p-6"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#7C3AED] font-mono text-sm font-bold text-white">
                3
              </span>
              <div>
                <h2 id="step-3-heading" className="text-lg font-bold text-[#F8FAFC]">
                  Metode Pembayaran
                </h2>
                <p className="text-xs text-[#94A3B8]">
                  Kalkulasi biaya real-time · Saldo NipNime, QRIS, E-Wallet & VA
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {paymentGroups.map((group) => {
                const isOpen = openPaymentGroup === group.id;
                const hasSelectedInGroup = group.channels.some(
                  (c) => c.id === selectedChannelId
                );

                return (
                  <div
                    key={group.id}
                    className={`overflow-hidden rounded-2xl border transition-colors ${
                      hasSelectedInGroup
                        ? 'border-[#7C3AED]/50 bg-[#0B0E14]/80'
                        : 'border-white/10 bg-[#0B0E14]/50'
                    }`}
                  >
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() =>
                        setOpenPaymentGroup((prev) =>
                          prev === group.id ? prev : group.id
                        )
                      }
                      className="flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {group.id === 'saldo' ? (
                          <Wallet
                            className={`h-5 w-5 shrink-0 ${
                              hasSelectedInGroup ? 'text-[#06B6D4]' : 'text-[#94A3B8]'
                            }`}
                            aria-hidden="true"
                          />
                        ) : (
                          <CreditCard
                            className={`h-5 w-5 shrink-0 ${
                              hasSelectedInGroup ? 'text-[#06B6D4]' : 'text-[#94A3B8]'
                            }`}
                            aria-hidden="true"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#F8FAFC]">
                            {group.title}
                          </p>
                          <p className="truncate text-xs text-[#94A3B8]">
                            {group.id === 'saldo'
                              ? `Saldo tersedia: ${formatCurrency(saldoUsd, currency)}`
                              : group.subtitle}
                          </p>
                        </div>
                      </div>
                      <motion.span
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.22, ease: EASE_CYBER }}
                        className="shrink-0 text-[#94A3B8]"
                      >
                        <ChevronDown className="h-4 w-4" aria-hidden="true" />
                      </motion.span>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: EASE_CYBER }}
                          className="overflow-hidden border-t border-white/[0.06]"
                        >
                          <div className="grid grid-cols-1 gap-2.5 p-3.5 sm:grid-cols-2">
                            {group.channels.map((channel) => {
                              const isChannelSelected = channel.id === selectedChannelId;
                              const channelSummary = calculateOrderSummary({
                                denomination: selectedDenomination,
                                paymentChannel: channel,
                                promoCode: appliedPromo,
                                isReseller,
                              });
                              return (
                                <button
                                  key={channel.id}
                                  type="button"
                                  onClick={() => setSelectedChannelId(channel.id)}
                                  className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4] ${
                                    isChannelSelected
                                      ? 'border-[#06B6D4] bg-[#06B6D4]/10'
                                      : 'border-white/10 bg-[#151A23]/80 hover:border-white/25'
                                  }`}
                                >
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="truncate text-sm font-semibold text-[#F8FAFC]">
                                        {channel.name}
                                      </p>
                                      {channel.badge && (
                                        <span className="text-[11px] font-semibold text-[#06B6D4]">
                                          · {channel.badge}
                                        </span>
                                      )}
                                    </div>
                                    <p className="mt-0.5 truncate text-xs text-[#94A3B8]">
                                      {channel.subtitle}
                                    </p>
                                  </div>
                                  <span className="shrink-0 font-mono text-xs font-bold tabular-nums text-[#F8FAFC]">
                                    {formatCurrency(channelSummary.totalUsd, currency)}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Promo Code Input */}
            <form onSubmit={handleApplyPromo} className="mt-5 flex flex-col gap-2.5 sm:flex-row">
              <div className="relative flex-1">
                <Tag
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]"
                  aria-hidden="true"
                />
                <label htmlFor="checkout-promo-code" className="sr-only">
                  Kode Promo
                </label>
                <input
                  id="checkout-promo-code"
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  placeholder="Kode promo (contoh: NIPNIME15)"
                  className="h-11 w-full rounded-xl border border-white/15 bg-[#0B0E14]/90 pl-10 pr-4 font-mono text-xs uppercase text-[#F8FAFC] placeholder:normal-case placeholder:font-sans placeholder:text-[#64748B] focus:border-[#06B6D4] focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
                />
              </div>
              <MagneticButton
                type="submit"
                variant="secondary"
                className="h-11 px-5 text-xs sm:text-sm"
              >
                Pakai Promo
              </MagneticButton>
            </form>
          </section>
        </div>

        {/* STEP 4 (Desktop): Sticky Summary Card */}
        <aside className="hidden lg:block lg:col-span-4 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-white/10 bg-[#151A23]/95 p-6 shadow-2xl shadow-black/50 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div>
                <p className="text-xs font-medium text-[#94A3B8]">Ringkasan Pesanan</p>
                <h3 className="mt-0.5 text-base font-bold text-[#F8FAFC]">{game.title}</h3>
              </div>
              <Sparkles className="h-5 w-5 text-[#06B6D4]" aria-hidden="true" />
            </div>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-[#94A3B8]">Akun</dt>
                <dd className="font-mono text-xs font-semibold text-[#F8FAFC] truncate max-w-[180px]">
                  {verification?.valid ? verification.nickname : 'Belum diverifikasi'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-[#94A3B8]">Item</dt>
                <dd className="font-semibold text-[#F8FAFC] text-right">
                  {selectedDenomination?.label ?? '—'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-[#94A3B8]">Pembayaran</dt>
                <dd className="font-medium text-[#CBD5E1] text-right">
                  {selectedChannel?.name ?? '—'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
                <dt className="text-[#94A3B8]">Harga Paket</dt>
                <dd className="font-mono tabular-nums text-[#F8FAFC]">
                  {formatCurrency(summary.basePriceUsd, currency)}
                </dd>
              </div>
              {summary.resellerDiscountUsd > 0 && (
                <div className="flex items-center justify-between gap-2 text-[#A78BFA]">
                  <dt>Diskon Reseller (8%)</dt>
                  <dd className="font-mono tabular-nums">
                    -{formatCurrency(summary.resellerDiscountUsd, currency)}
                  </dd>
                </div>
              )}
              {summary.promoDiscountUsd > 0 && (
                <div className="flex items-center justify-between gap-2 text-[#06B6D4]">
                  <dt>Promo ({summary.promoApplied})</dt>
                  <dd className="font-mono tabular-nums">
                    -{formatCurrency(summary.promoDiscountUsd, currency)}
                  </dd>
                </div>
              )}
              <div className="flex items-center justify-between gap-2">
                <dt className="text-[#94A3B8]">Biaya Layanan</dt>
                <dd className="font-mono tabular-nums text-[#CBD5E1]">
                  {formatCurrency(summary.feeUsd, currency)}
                </dd>
              </div>
            </dl>

            <div className="mt-5 flex items-baseline justify-between border-t border-white/[0.08] pt-4">
              <span className="text-sm font-semibold text-[#94A3B8]">Total Bayar</span>
              <OdometerPrice
                amountUsd={summary.totalUsd}
                currency={currency}
                className="text-2xl font-extrabold text-[#F8FAFC]"
              />
            </div>

            {isSaldoInsufficient && (
              <p className="mt-3 text-xs font-medium text-amber-400">
                Saldo NipNime ({formatCurrency(saldoUsd, currency)}) belum mencukupi.
              </p>
            )}

            <div className="mt-6">
              <MagneticButton
                variant="primary"
                glow
                disabled={submitting}
                onClick={handleCheckout}
                className="h-12 w-full text-sm"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Memproses Pesanan...</span>
                  </>
                ) : isSaldoInsufficient ? (
                  <span>Isi Saldo & Lanjutkan</span>
                ) : (
                  <span>Beli Sekarang</span>
                )}
              </MagneticButton>
              <p className="mt-3 text-center text-[11px] text-[#64748B]">
                Garansi akun cocok · Pengiriman otomatis 24 jam
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* STEP 4 (Mobile): Sticky Bottom Bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#0B0E14]/95 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[11px] font-medium text-[#94A3B8]">
              {selectedDenomination?.label ?? 'Pilih nominal'}
            </p>
            <OdometerPrice
              amountUsd={summary.totalUsd}
              currency={currency}
              className="text-lg font-extrabold text-[#F8FAFC]"
            />
          </div>
          <MagneticButton
            variant="primary"
            glow
            disabled={submitting}
            onClick={handleCheckout}
            className="h-11 px-6 text-sm"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>Beli Sekarang</span>
            )}
          </MagneticButton>
        </div>
      </div>
    </motion.div>
  );
};
