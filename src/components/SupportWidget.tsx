import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ChevronDown,
  Headphones,
  HelpCircle,
  MessageCircle,
  MessageSquare,
  X,
} from 'lucide-react';
import { EASE_CYBER } from './MotionPrimitives';

const FAQ_ITEMS = [
  {
    q: 'Berapa lama Diamond / VP masuk ke akun?',
    a: 'Seluruh pesanan terverifikasi diproses otomatis dalam 1–3 detik setelah pembayaran terkonfirmasi.',
  },
  {
    q: 'Apa keuntungan Mode Reseller & Saldo NipNime?',
    a: 'Mode Reseller memberi potongan harga 8% di seluruh katalog, dan Saldo NipNime bebas biaya admin (0%).',
  },
  {
    q: 'Kode promo apa yang sedang aktif?',
    a: 'Gunakan kode NIPNIME15 untuk diskon 15% atau CYBER10 untuk diskon 10% pada Langkah 3 checkout.',
  },
];

interface SupportWidgetProps {
  offsetForMobileBar?: boolean;
  onNotify: (title: string, description: string, variant?: 'success' | 'info' | 'error') => void;
}

export const SupportWidget: React.FC<SupportWidgetProps> = ({
  offsetForMobileBar = false,
  onNotify,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [activeFaqIdx, setActiveFaqIdx] = useState<number | null>(0);

  return (
    <div
      className={`fixed right-4 z-40 flex flex-col items-end gap-3 sm:right-6 ${
        offsetForMobileBar ? 'bottom-20 lg:bottom-6' : 'bottom-5 sm:bottom-6'
      }`}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.92 }}
            transition={{ duration: 0.24, ease: EASE_CYBER }}
            className="w-72 overflow-hidden rounded-2xl border border-white/15 bg-[#151A23]/95 p-3 shadow-2xl shadow-black/75 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] px-2 pb-2.5">
              <div>
                <p className="text-sm font-bold text-[#F8FAFC]">Bantuan NipNime 24/7</p>
                <p className="text-[11px] text-[#94A3B8]">Respon cepat di bawah 2 menit</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setFaqOpen(false);
                }}
                aria-label="Tutup menu bantuan"
                className="rounded-lg p-1 text-[#94A3B8] hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-2.5 space-y-1.5">
              <button
                type="button"
                onClick={() => {
                  onNotify(
                    'WhatsApp CS NipNime',
                    'Menghubungkan ke desk bantuan WhatsApp 24 jam.',
                    'info'
                  );
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-[#F8FAFC] transition-colors hover:bg-white/[0.07]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p>WhatsApp CS</p>
                  <p className="text-[11px] font-normal text-[#94A3B8]">Chat langsung admin</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onNotify(
                    'Discord Komunitas NipNime',
                    'Undangan disalin: discord.gg/nipnime',
                    'info'
                  );
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-[#F8FAFC] transition-colors hover:bg-white/[0.07]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7C3AED]/20 text-[#A78BFA]">
                  <MessageSquare className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p>Discord NipNime</p>
                  <p className="text-[11px] font-normal text-[#94A3B8]">Info promo & tiket kendala</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFaqOpen((prev) => !prev)}
                aria-expanded={faqOpen}
                className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-[#F8FAFC] transition-colors hover:bg-white/[0.07]"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#06B6D4]/15 text-[#06B6D4]">
                    <HelpCircle className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block">FAQ Cepat</span>
                    <span className="block text-[11px] font-normal text-[#94A3B8]">
                      Jawaban transaksi & ID
                    </span>
                  </span>
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-[#94A3B8] transition-transform duration-200 ${
                    faqOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>

            <AnimatePresence initial={false}>
              {faqOpen && (
                <motion.div
                  initial={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: EASE_CYBER }}
                  className="overflow-hidden border-t border-white/[0.08] mt-2 pt-2 space-y-1.5"
                >
                  {FAQ_ITEMS.map((item, idx) => {
                    const expanded = activeFaqIdx === idx;
                    return (
                      <div key={item.q} className="rounded-xl bg-[#0B0E14]/70 p-2.5">
                        <button
                          type="button"
                          aria-expanded={expanded}
                          onClick={() => setActiveFaqIdx(expanded ? null : idx)}
                          className="flex w-full items-center justify-between gap-2 text-left text-xs font-semibold text-[#F8FAFC]"
                        >
                          <span>{item.q}</span>
                          <ChevronDown
                            className={`h-3.5 w-3.5 shrink-0 text-[#94A3B8] transition-transform ${
                              expanded ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        {expanded && (
                          <p className="mt-1.5 text-[11px] leading-relaxed text-[#94A3B8]">
                            {item.a}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Breathing Pulse Floating Action Button */}
      <motion.button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={open ? 'Tutup menu bantuan pelanggan' : 'Buka menu bantuan pelanggan'}
        whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}
        whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
        className="relative flex h-13 w-13 items-center justify-center rounded-2xl border border-white/15 bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] text-white shadow-xl shadow-[#7C3AED]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]"
      >
        {!open && !shouldReduceMotion && (
          <span
            aria-hidden="true"
            className="live-pulse-ring pointer-events-none absolute inset-0 rounded-2xl border border-[#06B6D4]/70"
          />
        )}
        {open ? <X className="h-5 w-5" /> : <Headphones className="h-5 w-5" />}
      </motion.button>
    </div>
  );
};
