import type {
  AccountVerificationResult,
  CategoryFilter,
  CurrencyCode,
  Denomination,
  GameFieldConfig,
  GameItem,
  OrderSummary,
  PaymentChannel,
} from '../types/topup';

const CURRENCY_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  IDR: 15800,
  EUR: 0.92,
};

export const RESELLER_DISCOUNT_RATE = 0.08;

const VALID_PROMO_CODES: Record<string, { rate: number; maxDiscountUsd: number }> = {
  NIPNIME15: { rate: 0.15, maxDiscountUsd: 12 },
  KINETIX15: { rate: 0.15, maxDiscountUsd: 12 },
  CYBER10: { rate: 0.1, maxDiscountUsd: 8 },
  NEON5: { rate: 0.05, maxDiscountUsd: 5 },
};

const DETERMINISTIC_GAMER_TAGS = [
  'Kuroha_X',
  'ValkyrieZero',
  'AetherPulse',
  'Solstice99',
  'NyxPhantom',
  'ZephyrBlade',
  'KyroVanguard',
  'RivenArcane',
  'SoraEclipse',
  'VexChronos',
];

const DETERMINISTIC_TIERS = ['Mythic Glory', 'Radiant', 'Conqueror', 'Grandmaster'];

export function convertUsdAmount(amountUsd: number, currency: CurrencyCode): number {
  const converted = amountUsd * CURRENCY_RATES[currency];
  if (currency === 'IDR') {
    return Math.round(converted / 10) * 10;
  }
  return Math.round(converted * 100) / 100;
}

export function formatCurrency(amountUsd: number, currency: CurrencyCode): string {
  const value = convertUsdAmount(amountUsd, currency);
  if (currency === 'IDR') {
    return `Rp ${value.toLocaleString('id-ID')}`;
  }
  if (currency === 'EUR') {
    return `€${value.toFixed(2)}`;
  }
  return `$${value.toFixed(2)}`;
}

export function getEffectivePriceUsd(priceUsd: number, isReseller: boolean): number {
  if (!isReseller) return Math.round(priceUsd * 100) / 100;
  return Math.round(priceUsd * (1 - RESELLER_DISCOUNT_RATE) * 100) / 100;
}

export function calculateOrderSummary(params: {
  denomination: Denomination | null;
  paymentChannel: PaymentChannel | null;
  promoCode: string;
  isReseller?: boolean;
}): OrderSummary {
  const { denomination, paymentChannel, promoCode, isReseller = false } = params;
  if (!denomination) {
    return {
      basePriceUsd: 0,
      resellerDiscountUsd: 0,
      subtotalUsd: 0,
      promoDiscountUsd: 0,
      promoApplied: null,
      promoError: null,
      feeUsd: 0,
      totalUsd: 0,
    };
  }

  const basePriceUsd = Math.round(denomination.priceUsd * 100) / 100;
  const subtotalUsd = getEffectivePriceUsd(basePriceUsd, isReseller);
  const resellerDiscountUsd = Math.max(
    0,
    Math.round((basePriceUsd - subtotalUsd) * 100) / 100
  );

  const normalizedCode = promoCode.trim().toUpperCase();

  let promoDiscountUsd = 0;
  let promoApplied: string | null = null;
  let promoError: string | null = null;

  if (normalizedCode.length > 0) {
    const promo = VALID_PROMO_CODES[normalizedCode];
    if (promo) {
      promoDiscountUsd = Math.min(
        Math.round(subtotalUsd * promo.rate * 100) / 100,
        promo.maxDiscountUsd
      );
      promoApplied = normalizedCode;
    } else {
      promoError = 'Kode promo tidak valid. Coba NIPNIME15 atau CYBER10.';
    }
  }

  const discountedSubtotal = Math.max(0, subtotalUsd - promoDiscountUsd);
  const feeUsd = paymentChannel
    ? Math.round(
        (discountedSubtotal * (paymentChannel.feePercent / 100) +
          paymentChannel.feeFlatUsd) *
          100
      ) / 100
    : 0;

  const totalUsd = Math.round((discountedSubtotal + feeUsd) * 100) / 100;

  return {
    basePriceUsd,
    resellerDiscountUsd,
    subtotalUsd,
    promoDiscountUsd,
    promoApplied,
    promoError,
    feeUsd,
    totalUsd,
  };
}

export function verifyGameAccount(params: {
  gameId: string;
  fieldConfig: GameFieldConfig;
  userId: string;
  serverZone: string;
}): AccountVerificationResult {
  const trimmedId = params.userId.trim();
  const trimmedServer = params.serverZone.trim();

  if (!trimmedId) {
    return {
      valid: false,
      error: `Masukkan ${params.fieldConfig.userIdLabel} terlebih dahulu.`,
    };
  }

  if (trimmedId.length < 5) {
    return {
      valid: false,
      error: `${params.fieldConfig.userIdLabel} minimal 5 karakter.`,
    };
  }

  if (params.fieldConfig.requiresServer && !trimmedServer) {
    return {
      valid: false,
      error: `Masukkan atau pilih ${params.fieldConfig.serverLabel ?? 'Server Zone'}.`,
    };
  }

  if (
    params.fieldConfig.requiresServer &&
    params.fieldConfig.serverType === 'input' &&
    !/^\d{3,6}$/.test(trimmedServer)
  ) {
    return {
      valid: false,
      error: `${params.fieldConfig.serverLabel ?? 'Zone ID'} harus 3–6 digit angka (contoh: 2049).`,
    };
  }

  let hash = 0;
  const seed = `${params.gameId}:${trimmedId}:${trimmedServer}`;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  const baseTag = DETERMINISTIC_GAMER_TAGS[hash % DETERMINISTIC_GAMER_TAGS.length];
  const tier = DETERMINISTIC_TIERS[hash % DETERMINISTIC_TIERS.length];
  const suffix = trimmedId.slice(-3).toUpperCase();

  return {
    valid: true,
    nickname: `${baseTag}#${suffix}`,
    region: trimmedServer || 'Indonesia',
    tier,
  };
}

export function filterGames(
  games: GameItem[],
  category: CategoryFilter,
  query: string
): GameItem[] {
  const normalizedQuery = query.trim().toLowerCase();
  return games.filter((game) => {
    const matchesCategory = category === 'Semua' || game.category === category;
    if (!matchesCategory) return false;
    if (!normalizedQuery) return true;
    return (
      game.title.toLowerCase().includes(normalizedQuery) ||
      game.publisher.toLowerCase().includes(normalizedQuery) ||
      game.category.toLowerCase().includes(normalizedQuery) ||
      game.currencyName.toLowerCase().includes(normalizedQuery)
    );
  });
}

export function getCheckoutProgress(params: {
  isAccountVerified: boolean;
  hasDenomination: boolean;
  hasPaymentMethod: boolean;
}): { completedSteps: number; percentage: number } {
  let completedSteps = 0;
  if (params.isAccountVerified) completedSteps += 1;
  if (params.hasDenomination) completedSteps += 1;
  if (params.hasPaymentMethod) completedSteps += 1;

  const percentage = Math.round((completedSteps / 3) * 100);
  return { completedSteps, percentage };
}

export function splitCountdownSeconds(totalSeconds: number): {
  hours: string;
  minutes: string;
  seconds: string;
} {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return {
    hours: String(h).padStart(2, '0'),
    minutes: String(m).padStart(2, '0'),
    seconds: String(s).padStart(2, '0'),
  };
}
