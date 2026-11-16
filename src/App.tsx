import { useCallback, useEffect, useState } from 'react';
import { MotionConfig } from 'motion/react';
import {
  FLASH_SALES,
  GAME_CATALOG,
  INITIAL_ORDERS,
  PAYMENT_GROUPS,
  PROMO_BANNERS,
} from './data/catalog';
import type {
  CategoryFilter,
  CurrencyCode,
  Denomination,
  GameItem,
  LanguageCode,
  OrderRecord,
  PaymentChannel,
  ToastMessage,
} from './types/topup';
import { formatCurrency } from './utils/pricing';
import { Navbar } from './components/Navbar';
import { HeroCarousel } from './components/HeroCarousel';
import { FlashSaleRow } from './components/FlashSaleRow';
import { GameCatalogGrid } from './components/GameCatalogGrid';
import { TopUpCheckoutView } from './components/TopUpCheckoutView';
import { OrderReceiptModal, SaldoModal, TrackOrderModal } from './components/OrderModals';
import { SupportWidget } from './components/SupportWidget';
import { AmbientCyberBackdrop, ToastContainer } from './components/MotionPrimitives';

export default function App() {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('Semua');
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [preselectedDenomId, setPreselectedDenomId] = useState<string | undefined>(undefined);
  const [currency, setCurrency] = useState<CurrencyCode>('IDR');
  const [language, setLanguage] = useState<LanguageCode>('ID');
  const [isReseller, setIsReseller] = useState(false);
  const [saldoUsd, setSaldoUsd] = useState(250000 / 15800);
  const [saldoModalOpen, setSaldoModalOpen] = useState(false);
  const [orders, setOrders] = useState<OrderRecord[]>(INITIAL_ORDERS);
  const [receiptOrder, setReceiptOrder] = useState<OrderRecord | null>(null);
  const [trackOpen, setTrackOpen] = useState(false);
  const [trackOrderId, setTrackOrderId] = useState<string | undefined>(undefined);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gameParam = params.get('game');
    if (gameParam && GAME_CATALOG.some((g) => g.id === gameParam)) {
      setSelectedGameId(gameParam);
    }
  }, []);

  const notify = useCallback(
    (title: string, description: string, variant: ToastMessage['variant'] = 'info') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-1), { id, title, description, variant }]);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleSelectGame = (gameId: string, denominationId?: string) => {
    setSelectedGameId(gameId);
    setPreselectedDenomId(denominationId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopyPromo = (code: string) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    notify('Kode Promo Disalin', `${code} siap ditempel di Langkah 3 checkout.`, 'success');
  };

  const handleToggleReseller = () => {
    setIsReseller((prev) => {
      const next = !prev;
      notify(
        next ? 'Mode Reseller Aktif' : 'Mode Member Standar',
        next
          ? 'Diskon Reseller 8% otomatis berlaku di seluruh katalog.'
          : 'Harga kembali ke tarif member reguler.',
        next ? 'success' : 'info'
      );
      return next;
    });
  };

  const handleTopUpSaldo = (amountUsd: number) => {
    setSaldoUsd((prev) => Math.round((prev + amountUsd) * 1000) / 1000);
    notify(
      'Saldo Ditambahkan',
      `+${formatCurrency(amountUsd, currency)} masuk ke Saldo NipNime kamu.`,
      'success'
    );
  };

  const handleCompleteOrder = (payload: {
    game: GameItem;
    denomination: Denomination;
    paymentChannel: PaymentChannel;
    userId: string;
    serverZone: string;
    verifiedNickname: string;
    totalUsd: number;
  }) => {
    if (payload.paymentChannel.id === 'saldo-nipnime') {
      setSaldoUsd((prev) => Math.max(0, Math.round((prev - payload.totalUsd) * 1000) / 1000));
    }

    const orderId = `NIP-${Math.floor(100000 + Math.random() * 899999)}`;
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(
      2,
      '0'
    )}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newOrder: OrderRecord = {
      orderId,
      createdAt: timestamp,
      gameTitle: payload.game.title,
      gameId: payload.game.id,
      packageLabel: payload.denomination.label,
      userId: payload.userId,
      serverZone: payload.serverZone || undefined,
      verifiedNickname: payload.verifiedNickname,
      paymentMethodName: payload.paymentChannel.name,
      totalUsd: payload.totalUsd,
      currency,
      status: 'Sukses',
    };

    setOrders((prev) => [newOrder, ...prev]);
    setReceiptOrder(newOrder);
    notify(
      'Transaksi Sukses',
      `${payload.denomination.label} terkirim ke ${payload.verifiedNickname}.`,
      'success'
    );
  };

  const selectedGame = selectedGameId
    ? GAME_CATALOG.find((g) => g.id === selectedGameId) ?? null
    : null;

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-screen bg-[#0B0E14] text-[#F8FAFC] flex flex-col">
        <AmbientCyberBackdrop />

        <div className="relative z-10 flex min-h-screen flex-col">
          <Navbar
            games={GAME_CATALOG}
            currency={currency}
            language={language}
            saldoUsd={saldoUsd}
            orderCount={orders.length}
            onSelectGame={(id) => handleSelectGame(id)}
            onGoHome={() => {
              setSelectedGameId(null);
              setPreselectedDenomId(undefined);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenTrackOrder={() => {
              setTrackOrderId(orders[0]?.orderId);
              setTrackOpen(true);
            }}
            onOpenSaldo={() => setSaldoModalOpen(true)}
            onChangeCurrency={(c) => {
              setCurrency(c);
              notify('Mata Uang Diubah', `Harga ditampilkan dalam ${c}.`, 'info');
            }}
            onChangeLanguage={(lang) => {
              setLanguage(lang);
              notify(
                'Bahasa Diubah',
                lang === 'ID' ? 'Antarmuka Bahasa Indonesia aktif.' : 'English interface active.',
                'info'
              );
            }}
          />

          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            {selectedGame ? (
              <TopUpCheckoutView
                game={selectedGame}
                initialDenominationId={preselectedDenomId}
                paymentGroups={PAYMENT_GROUPS}
                currency={currency}
                isReseller={isReseller}
                saldoUsd={saldoUsd}
                onBack={() => {
                  setSelectedGameId(null);
                  setPreselectedDenomId(undefined);
                }}
                onOpenSaldo={() => setSaldoModalOpen(true)}
                onCompleteOrder={handleCompleteOrder}
                onNotify={notify}
              />
            ) : (
              <div className="space-y-10 sm:space-y-12">
                <HeroCarousel
                  banners={PROMO_BANNERS}
                  onSelectGame={(id) => handleSelectGame(id)}
                  onCopyPromo={handleCopyPromo}
                />

                <FlashSaleRow
                  items={FLASH_SALES}
                  currency={currency}
                  isReseller={isReseller}
                  onSelectFlashItem={(gameId, denomId) =>
                    handleSelectGame(gameId, denomId)
                  }
                />

                <GameCatalogGrid
                  games={GAME_CATALOG}
                  activeCategory={activeCategory}
                  currency={currency}
                  isReseller={isReseller}
                  saldoUsd={saldoUsd}
                  onToggleReseller={handleToggleReseller}
                  onOpenSaldo={() => setSaldoModalOpen(true)}
                  onSelectCategory={setActiveCategory}
                  onSelectGame={(id) => handleSelectGame(id)}
                />
              </div>
            )}
          </main>

          <footer className="border-t border-white/[0.08] bg-[#0B0E14]/90 py-8">
            <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-4 text-xs text-[#64748B] sm:flex-row sm:items-center sm:px-6 lg:px-8">
              <p className="font-medium text-[#94A3B8]">
                NipNime Top-Up Store · Layanan Top-Up Game & Produk Digital Otomatis 24 Jam
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setTrackOrderId(orders[0]?.orderId);
                    setTrackOpen(true);
                  }}
                  className="hover:text-[#06B6D4] transition-colors"
                >
                  Cek Pesanan
                </button>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => setSaldoModalOpen(true)}
                  className="hover:text-[#06B6D4] transition-colors"
                >
                  Saldo & Isi Saldo
                </button>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={handleToggleReseller}
                  className="hover:text-[#06B6D4] transition-colors"
                >
                  Mode Reseller
                </button>
                <span aria-hidden="true">·</span>
                <span>© 2026 NipNime Top-Up</span>
              </div>
            </div>
          </footer>
        </div>

        <SupportWidget
          offsetForMobileBar={Boolean(selectedGame)}
          onNotify={notify}
        />

        <ToastContainer toasts={toasts} onDismiss={dismissToast} />

        <OrderReceiptModal
          order={receiptOrder}
          currency={currency}
          onClose={() => setReceiptOrder(null)}
          onTrackOrder={(orderId) => {
            setReceiptOrder(null);
            setTrackOrderId(orderId);
            setTrackOpen(true);
          }}
        />

        <TrackOrderModal
          open={trackOpen}
          orders={orders}
          initialOrderId={trackOrderId}
          currency={currency}
          onClose={() => setTrackOpen(false)}
        />

        <SaldoModal
          open={saldoModalOpen}
          saldoUsd={saldoUsd}
          currency={currency}
          onClose={() => setSaldoModalOpen(false)}
          onTopUpSaldo={handleTopUpSaldo}
        />
      </div>
    </MotionConfig>
  );
}
