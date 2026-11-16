import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Flame } from 'lucide-react';
import type { CurrencyCode, FlashSaleItem } from '../types/topup';
import { formatCurrency, getEffectivePriceUsd, splitCountdownSeconds } from '../utils/pricing';
import { EASE_CYBER, FlipDigit, GameArtImage, TiltCard } from './MotionPrimitives';

interface FlashSaleRowProps {
  items: FlashSaleItem[];
  currency: CurrencyCode;
  isReseller: boolean;
  onSelectFlashItem: (gameId: string, denominationId: string) => void;
}

export const FlashSaleRow: React.FC<FlashSaleRowProps> = ({
  items,
  currency,
  isReseller,
  onSelectFlashItem,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(2 * 3600 + 14 * 60 + 49);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 2 * 3600 + 14 * 60 + 49));
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const { hours, minutes, seconds } = splitCountdownSeconds(secondsLeft);

  return (
    <section aria-labelledby="flash-sale-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#7C3AED]/40 bg-[#7C3AED]/15 text-[#A78BFA]">
            <Flame className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2
              id="flash-sale-heading"
              className="text-xl font-bold tracking-tight text-[#F8FAFC] sm:text-2xl"
            >
              Flash Drop NipNime
            </h2>
            <p className="text-xs text-[#94A3B8] sm:text-sm">
              Stok terbatas harga spesial · Proses otomatis 24 jam
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2" aria-label="Batas waktu flash sale">
          <span className="mr-1 text-xs font-medium text-[#94A3B8]">Berakhir dalam</span>
          <FlipDigit value={hours} label="JAM" />
          <span className="pb-4 font-mono text-sm font-bold text-[#94A3B8]">:</span>
          <FlipDigit value={minutes} label="MNT" />
          <span className="pb-4 font-mono text-sm font-bold text-[#94A3B8]">:</span>
          <FlipDigit value={seconds} label="DTK" />
        </div>
      </div>

      {/* Horizontal Scrollable Row */}
      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {items.map((item, idx) => {
          const soldRatio = Math.max(
            0.12,
            Math.min(0.95, 1 - item.stockRemaining / item.stockTotal)
          );
          const effectiveSaleUsd = getEffectivePriceUsd(item.salePriceUsd, isReseller);

          return (
            <motion.div
              key={item.id}
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.35, delay: idx * 0.05, ease: EASE_CYBER }}
              className="w-[254px] shrink-0 snap-start sm:w-[272px]"
            >
              <TiltCard maxTilt={6}>
                <button
                  type="button"
                  onClick={() => onSelectFlashItem(item.gameId, item.denominationId)}
                  className="group relative flex w-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#151A23] p-3.5 text-left transition-colors duration-200 hover:border-[#06B6D4]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10">
                      <GameArtImage
                        src={item.image}
                        alt={item.gameTitle}
                        className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.08]"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-[#06B6D4]">
                        {item.gameTitle} · -{item.discountPercent}%
                      </p>
                      <p className="mt-0.5 truncate text-sm font-bold text-[#F8FAFC]">
                        {item.packageLabel}
                      </p>
                      <div className="mt-1 flex items-baseline gap-2 font-mono tabular-nums">
                        <span className="text-sm font-bold text-[#F8FAFC]">
                          {formatCurrency(effectiveSaleUsd, currency)}
                        </span>
                        <span className="text-[11px] text-[#64748B] line-through">
                          {formatCurrency(item.originalPriceUsd, currency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Animated Stock Progress Bar */}
                  <div className="mt-3.5 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
                      <span>Sisa {item.stockRemaining} kuota</span>
                      <span className="inline-flex items-center gap-0.5 font-semibold text-[#A78BFA] group-hover:text-[#06B6D4] transition-colors">
                        Beli
                        <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
                      <motion.div
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: soldRatio }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: 0.1 + idx * 0.05, ease: EASE_CYBER }}
                        style={{ transformOrigin: 'left' }}
                        className="h-full w-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#06B6D4]"
                      />
                    </div>
                  </div>
                </button>
              </TiltCard>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
