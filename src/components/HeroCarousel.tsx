import React, { useEffect, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react';
import { ArrowRight, Check, ChevronLeft, ChevronRight, Copy, Zap } from 'lucide-react';
import type { PromoBanner } from '../types/topup';
import { EASE_CYBER, GameArtImage, MagneticButton, ParticleBurst } from './MotionPrimitives';
import VaporizeTextCycle, { Tag } from './ui/vapour-text-effect';

interface HeroCarouselProps {
  banners: PromoBanner[];
  onSelectGame: (gameId: string) => void;
  onCopyPromo: (code: string) => void;
}

const SLIDE_DURATION_MS = 6500;

export const HeroCarousel: React.FC<HeroCarouselProps> = ({
  banners,
  onSelectGame,
  onCopyPromo,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copyBurstKey, setCopyBurstKey] = useState(0);
  const [heroFontSize, setHeroFontSize] = useState<'28px' | '38px' | '44px'>('44px');
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const updateFont = () => {
      if (window.innerWidth < 640) {
        setHeroFontSize('28px');
      } else if (window.innerWidth < 1024) {
        setHeroFontSize('38px');
      } else {
        setHeroFontSize('44px');
      }
    };
    updateFont();
    window.addEventListener('resize', updateFont);
    return () => window.removeEventListener('resize', updateFont);
  }, []);

  const parallaxX = useMotionValue(0);
  const parallaxY = useMotionValue(0);
  const smoothX = useSpring(parallaxX, { stiffness: 120, damping: 20 });
  const smoothY = useSpring(parallaxY, { stiffness: 120, damping: 20 });
  const hudX = useTransform(smoothX, (v) => v * -0.7);
  const hudY = useTransform(smoothY, (v) => v * -0.7);

  useEffect(() => {
    if (paused || banners.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % banners.length);
    }, SLIDE_DURATION_MS);
    return () => window.clearInterval(timer);
  }, [paused, banners.length]);

  const current = banners[activeIndex];

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (shouldReduceMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    parallaxX.set(nx * -22);
    parallaxY.set(ny * -14);
  };

  const handleMouseLeave = () => {
    setPaused(false);
    parallaxX.set(0);
    parallaxY.set(0);
  };

  const handleCopy = (code: string) => {
    setCopiedCode(code);
    setCopyBurstKey((k) => k + 1);
    onCopyPromo(code);
    window.setTimeout(() => {
      setCopiedCode((prev) => (prev === code ? null : prev));
    }, 2200);
  };

  return (
    <section
      aria-label="Promo unggulan NipNime"
      onMouseEnter={() => setPaused(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#151A23] shadow-2xl shadow-black/60"
    >
      <div className="relative min-h-[350px] sm:min-h-[400px] lg:min-h-[430px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.45, ease: EASE_CYBER }}
            className="absolute inset-0"
          >
            {/* Multi-depth Parallax Backdrop */}
            <motion.div
              style={shouldReduceMotion ? undefined : { x: smoothX, y: smoothY, scale: 1.07 }}
              className="absolute inset-0"
            >
              <GameArtImage
                src={current.image}
                alt={current.title}
                className="h-full w-full object-cover object-center"
              />
            </motion.div>

            {/* Measured Contrast Scrim */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-r from-[#0B0E14] via-[#0B0E14]/88 to-[#0B0E14]/35"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-[#0B0E14]/95 via-transparent to-[#0B0E14]/30"
            />
          </motion.div>
        </AnimatePresence>

        {/* Foreground Content + Counter-Parallax Floating HUD Card */}
        <div className="relative z-10 flex min-h-[350px] flex-col justify-between p-6 sm:min-h-[400px] sm:p-10 lg:min-h-[430px] lg:p-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                  transition={{ duration: 0.35, ease: EASE_CYBER }}
                >
                  <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-[#06B6D4]">
                    <span>{current.kicker}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{current.discountLabel}</span>
                  </div>

                  <div className="mt-3 h-[54px] w-full sm:h-[64px] lg:h-[72px]">
                    <VaporizeTextCycle
                      key={current.id}
                      texts={current.vaporizeTexts}
                      font={{
                        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                        fontSize: heroFontSize,
                        fontWeight: 800,
                      }}
                      color="rgb(248, 250, 252)"
                      spread={4}
                      density={6}
                      animation={{
                        vaporizeDuration: 1.5,
                        fadeInDuration: 0.65,
                        waitDuration: 2.2,
                      }}
                      direction="left-to-right"
                      alignment="left"
                      tag={Tag.H1}
                    />
                  </div>

                  <p className="mt-2.5 max-w-lg text-sm leading-relaxed text-[#CBD5E1] sm:text-base">
                    {current.subtitle}
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <MagneticButton
                      variant="primary"
                      glow
                      onClick={() => onSelectGame(current.targetGameId)}
                      className="h-11 px-5 text-sm"
                    >
                      <span>{current.ctaLabel}</span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </MagneticButton>

                    <div className="relative">
                      <ParticleBurst triggerKey={copyBurstKey} />
                      <motion.button
                        type="button"
                        onClick={() => handleCopy(current.promoCode)}
                        whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
                        className={`inline-flex h-11 items-center gap-2.5 rounded-xl border px-4 font-mono text-xs font-semibold transition-all duration-200 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4] ${
                          copiedCode === current.promoCode
                            ? 'border-[#06B6D4]/70 bg-[#06B6D4]/15 text-[#06B6D4]'
                            : 'border-white/15 bg-[#0B0E14]/75 text-[#F8FAFC] hover:border-[#7C3AED]/60 hover:bg-[#151A23]'
                        }`}
                        aria-label={`Salin kode promo ${current.promoCode}`}
                      >
                        <span className="text-[#94A3B8] font-sans font-medium">Kode:</span>
                        <span>{current.promoCode}</span>
                        <AnimatePresence mode="wait" initial={false}>
                          {copiedCode === current.promoCode ? (
                            <motion.span
                              key="copied"
                              initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0.6, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.6, opacity: 0 }}
                              transition={{ duration: 0.18, ease: EASE_CYBER }}
                              className="inline-flex items-center gap-1 text-[#06B6D4]"
                            >
                              <Check className="h-3.5 w-3.5" aria-hidden="true" />
                              <span className="font-sans">Tersalin!</span>
                            </motion.span>
                          ) : (
                            <motion.span
                              key="copy"
                              initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              transition={{ duration: 0.18, ease: EASE_CYBER }}
                              className="inline-flex items-center text-[#94A3B8]"
                            >
                              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Floating Counter-Parallax Gamer HUD Card (Desktop) */}
            <motion.div
              style={shouldReduceMotion ? undefined : { x: hudX, y: hudY }}
              className={`hidden lg:flex flex-col gap-3 rounded-2xl border border-white/15 bg-[#0B0E14]/75 p-4 backdrop-blur-xl shadow-2xl ${
                shouldReduceMotion ? '' : 'float-ambient'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C3AED]/30 to-[#06B6D4]/30 border border-[#06B6D4]/40 text-[#06B6D4]">
                  <Zap className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[11px] font-medium text-[#94A3B8]">{current.statLabel}</p>
                  <p className="font-mono text-lg font-extrabold text-[#F8FAFC] tabular-nums">
                    {current.statValue}
                  </p>
                </div>
              </div>
              <div className="border-t border-white/[0.08] pt-2.5 text-xs text-[#CBD5E1]">
                Otomatis 24 Jam · Cek ID Instan
              </div>
            </motion.div>
          </div>

          {/* Interactive Pill Pagination + Prev/Next */}
          <div className="mt-8 flex items-center justify-between">
            <div className="flex items-center gap-2" role="tablist" aria-label="Slide promo">
              {banners.map((banner, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={banner.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`Tampilkan slide ${idx + 1}: ${banner.title}`}
                    onClick={() => setActiveIndex(idx)}
                    className="group flex h-8 items-center px-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4] rounded-full"
                  >
                    <motion.span
                      animate={{
                        width: isActive ? 32 : 8,
                        backgroundColor: isActive ? '#06B6D4' : 'rgba(255,255,255,0.28)',
                      }}
                      transition={{ duration: 0.3, ease: EASE_CYBER }}
                      className="block h-2 rounded-full"
                    />
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Banner promo sebelumnya"
                onClick={() =>
                  setActiveIndex((prev) => (prev - 1 + banners.length) % banners.length)
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-[#0B0E14]/75 text-[#CBD5E1] transition-colors hover:border-[#06B6D4]/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Banner promo berikutnya"
                onClick={() => setActiveIndex((prev) => (prev + 1) % banners.length)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-[#0B0E14]/75 text-[#CBD5E1] transition-colors hover:border-[#06B6D4]/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
