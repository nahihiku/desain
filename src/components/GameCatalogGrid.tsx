import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Crown, Wallet, Zap } from 'lucide-react';
import type { CategoryFilter, CurrencyCode, GameItem } from '../types/topup';
import { formatCurrency, getEffectivePriceUsd } from '../utils/pricing';
import { EASE_CYBER, GameArtImage, OdometerPrice, TiltCard } from './MotionPrimitives';

const CATEGORIES: CategoryFilter[] = [
  'Semua',
  'Game Mobile',
  'Game PC',
  'Voucher & Card',
  'Pulsa & E-Money',
];

interface GameCatalogGridProps {
  games: GameItem[];
  activeCategory: CategoryFilter;
  currency: CurrencyCode;
  isReseller: boolean;
  saldoUsd: number;
  onToggleReseller: () => void;
  onOpenSaldo: () => void;
  onSelectCategory: (category: CategoryFilter) => void;
  onSelectGame: (gameId: string) => void;
}

export const GameCatalogGrid: React.FC<GameCatalogGridProps> = ({
  games,
  activeCategory,
  currency,
  isReseller,
  saldoUsd,
  onToggleReseller,
  onOpenSaldo,
  onSelectCategory,
  onSelectGame,
}) => {
  const shouldReduceMotion = useReducedMotion();

  const filtered =
    activeCategory === 'Semua'
      ? games
      : games.filter((g) => g.category === activeCategory);

  return (
    <section aria-labelledby="catalog-heading" className="space-y-6">
      {/* NipNime Member & Reseller Strip */}
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.38, ease: EASE_CYBER }}
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-[#151A23]/85 p-3.5 sm:px-5"
      >
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={isReseller}
            onClick={onToggleReseller}
            className={`inline-flex h-10 items-center gap-2.5 rounded-xl border px-3.5 text-xs font-semibold transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4] ${
              isReseller
                ? 'border-[#06B6D4] bg-gradient-to-r from-[#7C3AED]/25 to-[#06B6D4]/20 text-[#06B6D4] shadow-md shadow-[#06B6D4]/15'
                : 'border-white/10 bg-[#0B0E14]/80 text-[#CBD5E1] hover:border-[#7C3AED]/50 hover:text-white'
            }`}
          >
            <Crown
              className={`h-4 w-4 ${isReseller ? 'text-[#06B6D4]' : 'text-[#A78BFA]'}`}
              aria-hidden="true"
            />
            <span>Mode Reseller (-8%)</span>
            <span
              className={`inline-flex h-4 w-7 items-center rounded-full p-0.5 transition-colors ${
                isReseller ? 'bg-[#06B6D4]' : 'bg-white/15'
              }`}
            >
              <motion.span
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={`h-3 w-3 rounded-full bg-white ${
                  isReseller ? 'ml-auto' : 'ml-0'
                }`}
              />
            </span>
          </button>

          <p className="text-xs text-[#94A3B8]">
            {isReseller
              ? 'Harga Reseller VIP aktif di seluruh katalog.'
              : 'Aktifkan Mode Reseller untuk potongan 8% otomatis.'}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenSaldo}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#0B0E14]/80 px-3.5 text-xs font-semibold text-[#F8FAFC] transition-colors hover:border-[#06B6D4]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]"
        >
          <Wallet className="h-3.5 w-3.5 text-[#06B6D4]" aria-hidden="true" />
          <span className="text-[#94A3B8]">Saldo:</span>
          <OdometerPrice amountUsd={saldoUsd} currency={currency} className="text-[#F8FAFC]" />
          <span className="text-[#06B6D4] font-semibold">· Isi Saldo</span>
        </button>
      </motion.div>

      {/* Section Title + Sliding Category Tabs */}
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.38, delay: 0.06, ease: EASE_CYBER }}
        className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
      >
        <div>
          <h2
            id="catalog-heading"
            className="text-xl font-bold tracking-tight text-[#F8FAFC] sm:text-2xl"
          >
            Katalog Top-Up NipNime
          </h2>
          <p className="mt-1 text-xs text-[#94A3B8] sm:text-sm">
            Pilih game, pulsa, atau produk digital · Proses otomatis 24 jam nonstop
          </p>
        </div>

        {/* Category Filter Tabs with Sliding Pill Indicator */}
        <div
          role="tablist"
          aria-label="Kategori produk top-up"
          className="no-scrollbar flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#151A23]/90 p-1.5"
        >
          {CATEGORIES.map((category) => {
            const isActive = category === activeCategory;
            return (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onSelectCategory(category)}
                className={`relative rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4] sm:text-sm ${
                  isActive ? 'text-white' : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="catalogCategoryPill"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] shadow-md shadow-[#7C3AED]/25"
                  />
                )}
                <span className="relative z-10">{category}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Responsive Grid: 2 cols mobile, 4 cols tablet, 6 cols desktop */}
      <motion.div
        key={activeCategory}
        initial={shouldReduceMotion ? 'visible' : 'hidden'}
        whileInView="visible"
        viewport={{ once: true, amount: 0.06 }}
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.055,
              delayChildren: 0.05,
            },
          },
        }}
        className="grid grid-cols-2 gap-3.5 sm:gap-4 md:grid-cols-4 lg:grid-cols-6"
      >
        {filtered.map((game) => {
          const minBaseUsd = Math.min(...game.denominations.map((d) => d.priceUsd));
          const startingPriceUsd = getEffectivePriceUsd(minBaseUsd, isReseller);

          return (
            <motion.div
              key={game.id}
              variants={{
                hidden: { opacity: 0, y: 24, scale: 0.96 },
                visible: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { duration: 0.42, ease: EASE_CYBER },
                },
              }}
            >
              <TiltCard maxTilt={7} className="h-full">
                <button
                  type="button"
                  onClick={() => onSelectGame(game.id)}
                  className="group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#151A23] text-left transition-colors duration-200 hover:border-[#06B6D4]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]"
                >
                  {/* 4:3 Image / Emblem Container */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#0B0E14]">
                    <GameArtImage
                      src={game.image}
                      alt={game.title}
                      emblem={game.emblem}
                      emblemCode={game.emblemCode}
                      className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.08]"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-[#151A23] via-transparent to-black/15"
                    />

                    {/* Hover Overlay CTA */}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#0B0E14]/55 opacity-0 backdrop-blur-[2px] transition-opacity duration-200 group-hover:opacity-100">
                      <span className="inline-flex items-center gap-1 rounded-xl border border-white/20 bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
                        Top Up
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                    </div>

                    {game.isHot && (
                      <motion.span
                        animate={
                          shouldReduceMotion ? undefined : { opacity: [0.85, 1, 0.85] }
                        }
                        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-lg border border-[#06B6D4]/40 bg-[#0B0E14]/85 px-2 py-0.5 text-[10px] font-semibold text-[#06B6D4] backdrop-blur-md"
                      >
                        <Zap className="h-2.5 w-2.5 fill-current" aria-hidden="true" />
                        Populer
                      </motion.span>
                    )}
                  </div>

                  {/* Clean Card Metadata + Starting Price */}
                  <div className="flex flex-1 flex-col justify-between p-3.5">
                    <div>
                      <p className="truncate text-[11px] font-medium text-[#94A3B8]">
                        {game.publisher}
                      </p>
                      <h3 className="mt-0.5 line-clamp-2 text-sm font-bold leading-snug text-[#F8FAFC] group-hover:text-[#06B6D4] transition-colors">
                        {game.title}
                      </h3>
                    </div>
                    <p className="mt-2.5 font-mono text-[11px] font-semibold tabular-nums text-[#06B6D4]">
                      Mulai {formatCurrency(startingPriceUsd, currency)}
                    </p>
                  </div>
                </button>
              </TiltCard>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
};
