export type CategoryFilter =
  | 'Semua'
  | 'Game Mobile'
  | 'Game PC'
  | 'Voucher & Card'
  | 'Pulsa & E-Money';

export type CurrencyCode = 'IDR' | 'USD' | 'EUR';
export type LanguageCode = 'ID' | 'EN';

export interface GameFieldConfig {
  userIdLabel: string;
  userIdPlaceholder: string;
  requiresServer: boolean;
  serverType: 'input' | 'select' | 'none';
  serverLabel?: string;
  serverPlaceholder?: string;
  serverOptions?: string[];
  helperText: string;
}

export interface Denomination {
  id: string;
  label: string;
  amount: number;
  bonus?: string;
  priceUsd: number;
  originalPriceUsd?: number;
  badge?: string;
  iconType: 'diamond' | 'crystal' | 'coin' | 'voucher' | 'crown';
  popular?: boolean;
}

export type BrandEmblemType =
  | 'artwork'
  | 'telkomsel'
  | 'dana'
  | 'gopay'
  | 'ovo'
  | 'shopeepay'
  | 'pln'
  | 'xl'
  | 'indosat';

export interface GameItem {
  id: string;
  title: string;
  publisher: string;
  category: Exclude<CategoryFilter, 'Semua'>;
  image: string;
  emblem?: BrandEmblemType;
  emblemCode?: string;
  accentColor: 'violet' | 'cyan';
  currencyName: string;
  deliveryEstimate: string;
  isHot?: boolean;
  fieldConfig: GameFieldConfig;
  denominations: Denomination[];
}

export interface PromoBanner {
  id: string;
  kicker: string;
  title: string;
  vaporizeTexts: string[];
  subtitle: string;
  promoCode: string;
  discountLabel: string;
  ctaLabel: string;
  targetGameId: string;
  image: string;
  accent: 'violet' | 'cyan';
  statLabel: string;
  statValue: string;
}

export interface FlashSaleItem {
  id: string;
  gameId: string;
  gameTitle: string;
  denominationId: string;
  packageLabel: string;
  image: string;
  originalPriceUsd: number;
  salePriceUsd: number;
  discountPercent: number;
  stockTotal: number;
  stockRemaining: number;
}

export type PaymentGroupId = 'saldo' | 'qris' | 'ewallet' | 'va' | 'retail';

export interface PaymentChannel {
  id: string;
  groupId: PaymentGroupId;
  name: string;
  subtitle: string;
  feePercent: number;
  feeFlatUsd: number;
  badge?: string;
}

export interface PaymentMethodGroup {
  id: PaymentGroupId;
  title: string;
  subtitle: string;
  channels: PaymentChannel[];
}

export interface AccountVerificationResult {
  valid: boolean;
  nickname?: string;
  region?: string;
  tier?: string;
  error?: string;
}

export interface OrderSummary {
  basePriceUsd: number;
  resellerDiscountUsd: number;
  subtotalUsd: number;
  promoDiscountUsd: number;
  promoApplied: string | null;
  promoError: string | null;
  feeUsd: number;
  totalUsd: number;
}

export interface OrderRecord {
  orderId: string;
  createdAt: string;
  gameTitle: string;
  gameId: string;
  packageLabel: string;
  userId: string;
  serverZone?: string;
  verifiedNickname: string;
  paymentMethodName: string;
  totalUsd: number;
  currency: CurrencyCode;
  status: 'Sukses' | 'Diproses' | 'Terverifikasi';
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: 'success' | 'info' | 'error';
}
