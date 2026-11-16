import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  Check,
  CheckCircle2,
  Copy,
  PackageSearch,
  Plus,
  Search,
  Wallet,
  X,
} from 'lucide-react';
import type { CurrencyCode, OrderRecord } from '../types/topup';
import { formatCurrency } from '../utils/pricing';
import { EASE_CYBER, MagneticButton, OdometerPrice, ParticleBurst } from './MotionPrimitives';

interface OrderReceiptModalProps {
  order: OrderRecord | null;
  currency: CurrencyCode;
  onClose: () => void;
  onTrackOrder: (orderId: string) => void;
}

export const OrderReceiptModal: React.FC<OrderReceiptModalProps> = ({
  order,
  currency,
  onClose,
  onTrackOrder,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);

  const handleCopyOrderId = () => {
    if (!order) return;
    navigator.clipboard?.writeText(order.orderId).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <AnimatePresence>
      {order && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="receipt-modal-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
        >
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 8 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-[#151A23] p-6 shadow-2xl shadow-black/80"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup struk pesanan"
              className="absolute right-4 top-4 rounded-xl p-2 text-[#94A3B8] hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-[#06B6D4]/40 bg-[#06B6D4]/15 text-[#06B6D4]">
                <ParticleBurst triggerKey={order.orderId} />
                <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
              </div>
              <h2 id="receipt-modal-title" className="mt-4 text-xl font-extrabold text-[#F8FAFC]">
                Top-Up Berhasil!
              </h2>
              <p className="mt-1 text-xs text-[#94A3B8]">
                Item dikirim otomatis ke {order.verifiedNickname}
              </p>

              <button
                type="button"
                onClick={handleCopyOrderId}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#0B0E14] px-3.5 py-2 font-mono text-xs font-bold text-[#06B6D4] hover:border-[#06B6D4]/50 transition-colors"
              >
                <span>{order.orderId}</span>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>

            <dl className="mt-6 space-y-2.5 rounded-2xl border border-white/[0.08] bg-[#0B0E14]/70 p-4 text-xs">
              <div className="flex justify-between gap-2">
                <dt className="text-[#94A3B8]">Produk</dt>
                <dd className="font-semibold text-[#F8FAFC]">{order.gameTitle}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[#94A3B8]">Nominal</dt>
                <dd className="font-semibold text-[#F8FAFC]">{order.packageLabel}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[#94A3B8]">ID Akun</dt>
                <dd className="font-mono text-[#CBD5E1]">
                  {order.userId}
                  {order.serverZone ? ` (${order.serverZone})` : ''}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[#94A3B8]">Pembayaran</dt>
                <dd className="text-[#CBD5E1]">{order.paymentMethodName}</dd>
              </div>
              <div className="flex justify-between gap-2 border-t border-white/[0.08] pt-2.5 text-sm">
                <dt className="font-semibold text-[#94A3B8]">Total Dibayar</dt>
                <dd className="font-mono font-bold text-[#06B6D4] tabular-nums">
                  {formatCurrency(order.totalUsd, currency)}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex gap-3">
              <MagneticButton
                variant="secondary"
                onClick={() => onTrackOrder(order.orderId)}
                className="h-11 flex-1 text-xs"
              >
                <PackageSearch className="h-4 w-4" />
                <span>Cek Status</span>
              </MagneticButton>
              <MagneticButton
                variant="primary"
                onClick={onClose}
                className="h-11 flex-1 text-xs"
              >
                <span>Selesai</span>
              </MagneticButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface TrackOrderModalProps {
  open: boolean;
  orders: OrderRecord[];
  initialOrderId?: string;
  currency: CurrencyCode;
  onClose: () => void;
}

export const TrackOrderModal: React.FC<TrackOrderModalProps> = ({
  open,
  orders,
  initialOrderId,
  currency,
  onClose,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [searchId, setSearchId] = useState(initialOrderId ?? '');
  const activeQuery = (searchId || initialOrderId || orders[0]?.orderId || '').trim().toUpperCase();
  const matchedOrder = orders.find((o) => o.orderId.toUpperCase() === activeQuery) ?? null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="track-order-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
        >
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 8 }}
            transition={{ duration: 0.26, ease: EASE_CYBER }}
            className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-[#151A23] p-6 shadow-2xl shadow-black/80"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup cek pesanan"
              className="absolute right-4 top-4 rounded-xl p-2 text-[#94A3B8] hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 id="track-order-title" className="text-xl font-extrabold text-[#F8FAFC]">
              Cek Pesanan NipNime
            </h2>
            <p className="mt-1 text-xs text-[#94A3B8]">
              Lacak status transaksi real-time menggunakan Kode Pesanan.
            </p>

            <div className="relative mt-4">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]"
                aria-hidden="true"
              />
              <label htmlFor="track-order-input" className="sr-only">
                Kode Pesanan
              </label>
              <input
                id="track-order-input"
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Masukkan Kode Pesanan (contoh: NIP-884120)"
                className="h-11 w-full rounded-xl border border-white/15 bg-[#0B0E14] pl-10 pr-4 font-mono text-xs uppercase text-[#F8FAFC] placeholder:normal-case placeholder:font-sans placeholder:text-[#64748B] focus:border-[#06B6D4] focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
              />
            </div>

            {orders.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-[#94A3B8]">Terbaru:</span>
                {orders.slice(0, 3).map((o) => (
                  <button
                    key={o.orderId}
                    type="button"
                    onClick={() => setSearchId(o.orderId)}
                    className={`rounded-lg border px-2.5 py-1 font-mono text-[11px] font-semibold transition-colors ${
                      activeQuery === o.orderId
                        ? 'border-[#06B6D4] bg-[#06B6D4]/15 text-[#06B6D4]'
                        : 'border-white/10 bg-[#0B0E14] text-[#CBD5E1] hover:border-white/25'
                    }`}
                  >
                    {o.orderId}
                  </button>
                ))}
              </div>
            )}

            {matchedOrder ? (
              <div className="mt-5 rounded-2xl border border-white/[0.08] bg-[#0B0E14]/75 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-mono text-sm font-bold text-[#F8FAFC]">
                      {matchedOrder.orderId}
                    </p>
                    <p className="text-xs text-[#94A3B8]">{matchedOrder.createdAt}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    {matchedOrder.status}
                  </span>
                </div>

                <dl className="mt-4 space-y-2 border-t border-white/[0.08] pt-3 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-[#94A3B8]">Produk</dt>
                    <dd className="font-semibold text-[#F8FAFC]">{matchedOrder.gameTitle}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#94A3B8]">Nominal</dt>
                    <dd className="text-[#CBD5E1]">{matchedOrder.packageLabel}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#94A3B8]">Penerima</dt>
                    <dd className="font-mono text-[#06B6D4]">{matchedOrder.verifiedNickname}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#94A3B8]">Total</dt>
                    <dd className="font-mono font-bold text-[#F8FAFC] tabular-nums">
                      {formatCurrency(matchedOrder.totalUsd, currency)}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-white/[0.08] bg-[#0B0E14]/60 p-6 text-center">
                <p className="text-sm font-semibold text-[#F8FAFC]">Pesanan tidak ditemukan</p>
                <p className="mt-1 text-xs text-[#94A3B8]">
                  Periksa Kode Pesanan atau pilih riwayat transaksi terbaru di atas.
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface SaldoModalProps {
  open: boolean;
  saldoUsd: number;
  currency: CurrencyCode;
  onClose: () => void;
  onTopUpSaldo: (amountUsd: number) => void;
}

const TOPUP_PRESETS_USD = [
  { label: 'Rp 50.000', usd: 50000 / 15800 },
  { label: 'Rp 100.000', usd: 100000 / 15800 },
  { label: 'Rp 250.000', usd: 250000 / 15800 },
  { label: 'Rp 500.000', usd: 500000 / 15800 },
];

export const SaldoModal: React.FC<SaldoModalProps> = ({
  open,
  saldoUsd,
  currency,
  onClose,
  onTopUpSaldo,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [selectedIdx, setSelectedIdx] = useState(1);
  const [burstKey, setBurstKey] = useState(0);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="saldo-modal-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
        >
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 8 }}
            transition={{ duration: 0.26, ease: EASE_CYBER }}
            className="relative w-full max-w-md rounded-3xl border border-white/15 bg-[#151A23] p-6 shadow-2xl shadow-black/80"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup modal saldo"
              className="absolute right-4 top-4 rounded-xl p-2 text-[#94A3B8] hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#06B6D4]/40 bg-[#06B6D4]/15 text-[#06B6D4]">
                <Wallet className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 id="saldo-modal-title" className="text-lg font-extrabold text-[#F8FAFC]">
                  Saldo Akun NipNime
                </h2>
                <p className="text-xs text-[#94A3B8]">
                  Checkout 0% biaya admin & proses di bawah 1 detik
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/[0.08] bg-[#0B0E14]/80 p-4">
              <p className="text-xs text-[#94A3B8]">Saldo Aktif Sekarang</p>
              <div className="mt-1">
                <OdometerPrice
                  amountUsd={saldoUsd}
                  currency={currency}
                  className="text-2xl font-extrabold text-[#06B6D4]"
                />
              </div>
            </div>

            <div className="mt-5">
              <p className="text-xs font-semibold text-[#CBD5E1]">Pilih Nominal Isi Saldo</p>
              <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                {TOPUP_PRESETS_USD.map((preset, idx) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setSelectedIdx(idx)}
                    className={`rounded-xl border p-3 text-left font-mono text-xs font-bold transition-colors ${
                      selectedIdx === idx
                        ? 'border-[#06B6D4] bg-[#06B6D4]/15 text-[#F8FAFC]'
                        : 'border-white/10 bg-[#0B0E14]/60 text-[#CBD5E1] hover:border-white/25'
                    }`}
                  >
                    {formatCurrency(preset.usd, currency)}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative mt-6 flex gap-3">
              <ParticleBurst triggerKey={burstKey} />
              <MagneticButton
                variant="primary"
                glow
                onClick={() => {
                  setBurstKey((k) => k + 1);
                  onTopUpSaldo(TOPUP_PRESETS_USD[selectedIdx].usd);
                }}
                className="h-11 flex-1 text-xs"
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Saldo Sekarang</span>
              </MagneticButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
