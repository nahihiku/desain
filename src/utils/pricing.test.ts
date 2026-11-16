import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateOrderSummary,
  convertUsdAmount,
  filterGames,
  formatCurrency,
  getCheckoutProgress,
  getEffectivePriceUsd,
  splitCountdownSeconds,
  verifyGameAccount,
} from './pricing';
import type { Denomination, GameFieldConfig, GameItem, PaymentChannel } from '../types/topup';

const sampleDenom: Denomination = {
  id: 'd-250',
  label: '250 Diamonds',
  amount: 250,
  bonus: '+25 Bonus',
  priceUsd: 10.0,
  iconType: 'diamond',
};

const samplePayment: PaymentChannel = {
  id: 'qris-instant',
  groupId: 'qris',
  name: 'QRIS Instan',
  subtitle: 'Scan & bayar dari semua e-wallet',
  feePercent: 1.5,
  feeFlatUsd: 0.15,
};

const sampleFieldConfig: GameFieldConfig = {
  userIdLabel: 'User ID',
  userIdPlaceholder: 'contoh: 84920144',
  requiresServer: true,
  serverType: 'input',
  serverLabel: 'Zone ID',
  serverPlaceholder: 'contoh: 2049',
  helperText: 'Buka profil game untuk menyalin ID.',
};

test('calculateOrderSummary computes subtotal, reseller discount, promo discount, fee, and total accurately', () => {
  const summaryNoPromo = calculateOrderSummary({
    denomination: sampleDenom,
    paymentChannel: samplePayment,
    promoCode: '',
  });
  assert.equal(summaryNoPromo.subtotalUsd, 10);
  assert.equal(summaryNoPromo.promoDiscountUsd, 0);
  assert.equal(summaryNoPromo.feeUsd, 0.3);
  assert.equal(summaryNoPromo.totalUsd, 10.3);

  const summaryWithPromo = calculateOrderSummary({
    denomination: sampleDenom,
    paymentChannel: samplePayment,
    promoCode: 'nipnime15',
  });
  assert.equal(summaryWithPromo.promoApplied, 'NIPNIME15');
  assert.equal(summaryWithPromo.promoDiscountUsd, 1.5);
  assert.equal(summaryWithPromo.feeUsd, 0.28);
  assert.equal(summaryWithPromo.totalUsd, 8.78);

  const resellerSummary = calculateOrderSummary({
    denomination: sampleDenom,
    paymentChannel: samplePayment,
    promoCode: '',
    isReseller: true,
  });
  assert.equal(getEffectivePriceUsd(10, true), 9.2);
  assert.equal(resellerSummary.resellerDiscountUsd, 0.8);
  assert.equal(resellerSummary.subtotalUsd, 9.2);
});

test('calculateOrderSummary flags invalid promo codes without altering subtotal', () => {
  const summary = calculateOrderSummary({
    denomination: sampleDenom,
    paymentChannel: samplePayment,
    promoCode: 'INVALID99',
  });
  assert.equal(summary.promoApplied, null);
  assert.ok(summary.promoError);
  assert.equal(summary.promoDiscountUsd, 0);
  assert.equal(summary.totalUsd, 10.3);
});

test('verifyGameAccount validates empty, short, and malformed server inputs', () => {
  const empty = verifyGameAccount({
    gameId: 'mlbb',
    fieldConfig: sampleFieldConfig,
    userId: '',
    serverZone: '2049',
  });
  assert.equal(empty.valid, false);
  assert.ok(empty.error);

  const shortId = verifyGameAccount({
    gameId: 'mlbb',
    fieldConfig: sampleFieldConfig,
    userId: '123',
    serverZone: '2049',
  });
  assert.equal(shortId.valid, false);

  const badZone = verifyGameAccount({
    gameId: 'mlbb',
    fieldConfig: sampleFieldConfig,
    userId: '84920144',
    serverZone: 'ab',
  });
  assert.equal(badZone.valid, false);

  const ok = verifyGameAccount({
    gameId: 'mlbb',
    fieldConfig: sampleFieldConfig,
    userId: '84920144',
    serverZone: '2049',
  });
  assert.equal(ok.valid, true);
  assert.ok(ok.nickname?.includes('#144'));
  assert.equal(ok.region, '2049');
});

test('formatCurrency & convertUsdAmount handle IDR, USD, and EUR', () => {
  assert.equal(formatCurrency(10, 'USD'), '$10.00');
  assert.equal(formatCurrency(10, 'EUR'), '€9.20');
  assert.equal(convertUsdAmount(10, 'IDR'), 158000);
  assert.ok(formatCurrency(10, 'IDR').startsWith('Rp '));
});

test('filterGames filters accurately by NipNime categories and search query', () => {
  const mockGames = [
    {
      id: 'mlbb',
      title: 'Mobile Legends',
      publisher: 'Moonton',
      category: 'Game Mobile',
      currencyName: 'Diamonds',
    },
    {
      id: 'valorant',
      title: 'Valorant',
      publisher: 'Riot Games',
      category: 'Game PC',
      currencyName: 'VP',
    },
  ] as GameItem[];

  assert.equal(filterGames(mockGames, 'Semua', '').length, 2);
  assert.equal(filterGames(mockGames, 'Game PC', '').length, 1);
  assert.equal(filterGames(mockGames, 'Semua', 'riot')[0].id, 'valorant');
  assert.equal(filterGames(mockGames, 'Game Mobile', 'valorant').length, 0);
});

test('getCheckoutProgress and splitCountdownSeconds compute step progress and padded digits', () => {
  assert.deepEqual(
    getCheckoutProgress({
      isAccountVerified: true,
      hasDenomination: true,
      hasPaymentMethod: false,
    }),
    { completedSteps: 2, percentage: 67 }
  );
  assert.deepEqual(splitCountdownSeconds(3665), {
    hours: '01',
    minutes: '01',
    seconds: '05',
  });
});
