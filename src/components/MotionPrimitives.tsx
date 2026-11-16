import React, { useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Smartphone,
  Sparkles,
  Wallet,
  Wifi,
  X,
  Zap,
} from 'lucide-react';
import type { BrandEmblemType, CurrencyCode, Denomination, ToastMessage } from '../types/topup';
import { formatCurrency } from '../utils/pricing';

export const EASE_CYBER = [0.22, 1, 0.36, 1] as const;

export const AmbientCyberBackdrop: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* Subtle drifting cyber grid */}
      <div
        className={`cyber-bg-grid absolute -inset-16 opacity-45 ${
          shouldReduceMotion ? '' : 'cyber-grid-drift'
        }`}
      />
      {/* Top violet & cyan ambient light wells */}
      <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-[#7C3AED]/15 blur-[120px]" />
      <div className="absolute top-20 right-1/5 h-80 w-80 rounded-full bg-[#06B6D4]/12 blur-[120px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0B0E14]/55 to-[#0B0E14]" />
    </div>
  );
};

interface ParticleBurstProps {
  triggerKey: number | string;
}

const SPARK_ANGLES = [0, 36, 72, 108, 144, 180, 216, 252, 288, 324];

export const ParticleBurst: React.FC<ParticleBurstProps> = ({ triggerKey }) => {
  const shouldReduceMotion = useReducedMotion();
  if (shouldReduceMotion || !triggerKey) return null;

  return (
    <div
      key={triggerKey}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible"
    >
      {SPARK_ANGLES.map((deg, idx) => {
        const rad = (deg * Math.PI) / 180;
        const dist = idx % 2 === 0 ? 46 : 34;
        const tx = Math.cos(rad) * dist;
        const ty = Math.sin(rad) * dist;
        return (
          <motion.span
            key={deg}
            initial={{ x: 0, y: 0, scale: 1.1, opacity: 1 }}
            animate={{ x: tx, y: ty, scale: 0, opacity: 0 }}
            transition={{ duration: 0.55, ease: EASE_CYBER }}
            className={`absolute h-1.5 w-1.5 rotate-45 ${
              idx % 2 === 0 ? 'bg-[#06B6D4]' : 'bg-[#A78BFA]'
            }`}
          />
        );
      })}
    </div>
  );
};

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  glow?: boolean;
  magneticStrength?: number;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  glow = false,
  magneticStrength = 0.22,
  disabled,
  onClick,
  type = 'button',
  ...rest
}) => {
  const ref = useRef<HTMLButtonElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 320, damping: 22, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 320, damping: 22, mass: 0.5 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (shouldReduceMotion || disabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const offsetX = (e.clientX - (rect.left + rect.width / 2)) * magneticStrength;
    const offsetY = (e.clientY - (rect.top + rect.height / 2)) * magneticStrength;
    x.set(Math.max(-8, Math.min(8, offsetX)));
    y.set(Math.max(-6, Math.min(6, offsetY)));
  };

  const handleMouseLeave = () => {
    setHovered(false);
    x.set(0);
    y.set(0);
  };

  const baseStyles =
    variant === 'primary'
      ? 'bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#06B6D4] text-white border border-white/15 shadow-lg shadow-[#7C3AED]/25'
      : variant === 'secondary'
      ? 'bg-[#151A23] hover:bg-[#1C2330] text-[#F8FAFC] border border-white/10 hover:border-[#7C3AED]/50'
      : 'bg-transparent hover:bg-white/[0.06] text-[#F8FAFC] border border-transparent';

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={shouldReduceMotion ? undefined : { x: springX, y: springY }}
      whileTap={disabled || shouldReduceMotion ? undefined : { scale: 0.96 }}
      transition={{ duration: 0.18, ease: EASE_CYBER }}
      onMouseEnter={() => setHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl font-semibold whitespace-nowrap shrink-0 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0E14] disabled:opacity-50 disabled:cursor-not-allowed ${baseStyles} ${className}`}
      {...(rest as Record<string, unknown>)}
    >
      {glow && !disabled && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-[1px] rounded-xl bg-gradient-to-r from-[#7C3AED]/60 via-[#06B6D4]/60 to-[#7C3AED]/60 opacity-0 blur-[7px] transition-opacity duration-300 group-hover:opacity-80"
        />
      )}
      {!shouldReduceMotion && !disabled && hovered && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent shimmer-overlay"
        />
      )}
      <span className="relative z-10 inline-flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
};

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  holoGlare?: boolean;
}

export const TiltCard: React.FC<TiltCardProps> = ({
  children,
  className = '',
  maxTilt = 7,
  holoGlare = true,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const [hovered, setHovered] = useState(false);

  const rotateX = useSpring(
    useTransform(mouseY, [0, 1], [maxTilt, -maxTilt]),
    { stiffness: 260, damping: 24 }
  );
  const rotateY = useSpring(
    useTransform(mouseX, [0, 1], [-maxTilt, maxTilt]),
    { stiffness: 260, damping: 24 }
  );

  const glareX = useTransform(mouseX, [0, 1], ['0%', '100%']);
  const glareY = useTransform(mouseY, [0, 1], ['0%', '100%']);
  const glareBg = useMotionTemplate`radial-gradient(240px circle at ${glareX} ${glareY}, rgba(6,182,212,0.16), rgba(124,58,237,0.08) 45%, transparent 75%)`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseLeave = () => {
    setHovered(false);
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={
        shouldReduceMotion
          ? undefined
          : {
              rotateX,
              rotateY,
              transformPerspective: 900,
              transformStyle: 'preserve-3d',
            }
      }
      className={`relative ${className}`}
    >
      {children}
      {holoGlare && !shouldReduceMotion && (
        <motion.div
          aria-hidden="true"
          style={{ background: glareBg }}
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="pointer-events-none absolute inset-0 rounded-2xl"
        />
      )}
    </motion.div>
  );
};

export const CornerReticle: React.FC<{ active: boolean }> = ({ active }) => {
  const shouldReduceMotion = useReducedMotion();
  if (!active) return null;

  return (
    <motion.div
      aria-hidden="true"
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 1.08 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.22, ease: EASE_CYBER }}
      className="pointer-events-none absolute inset-0 z-20"
    >
      <span className="absolute top-1.5 left-1.5 h-2.5 w-2.5 border-t-2 border-l-2 border-[#06B6D4] rounded-tl-sm" />
      <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 border-t-2 border-r-2 border-[#06B6D4] rounded-tr-sm" />
      <span className="absolute bottom-1.5 left-1.5 h-2.5 w-2.5 border-b-2 border-l-2 border-[#7C3AED] rounded-bl-sm" />
      <span className="absolute bottom-1.5 right-1.5 h-2.5 w-2.5 border-b-2 border-r-2 border-[#7C3AED] rounded-br-sm" />
    </motion.div>
  );
};

interface OdometerPriceProps {
  amountUsd: number;
  currency: CurrencyCode;
  className?: string;
}

export const OdometerPrice: React.FC<OdometerPriceProps> = ({
  amountUsd,
  currency,
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();
  const formatted = formatCurrency(amountUsd, currency);
  const chars = formatted.split('');

  if (shouldReduceMotion) {
    return <span className={`font-mono tabular-nums ${className}`}>{formatted}</span>;
  }

  return (
    <span
      className={`inline-flex items-baseline font-mono tabular-nums overflow-hidden ${className}`}
      aria-label={formatted}
    >
      {chars.map((char, index) => (
        <span key={`${index}-${chars.length}`} className="relative inline-block overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={char}
              initial={{ y: '65%', opacity: 0 }}
              animate={{ y: '0%', opacity: 1 }}
              exit={{ y: '-65%', opacity: 0 }}
              transition={{ duration: 0.22, ease: EASE_CYBER }}
              className="inline-block"
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  );
};

export const FlipDigit: React.FC<{ value: string; label: string }> = ({ value, label }) => {
  const shouldReduceMotion = useReducedMotion();
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex h-9 min-w-[2.4rem] items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[#151A23] px-2 font-mono text-sm font-bold tabular-nums text-[#F8FAFC] shadow-inner">
        {shouldReduceMotion ? (
          <span>{value}</span>
        ) : (
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={value}
              initial={{ y: '-55%', opacity: 0 }}
              animate={{ y: '0%', opacity: 1 }}
              exit={{ y: '55%', opacity: 0 }}
              transition={{ duration: 0.28, ease: EASE_CYBER }}
              className="inline-block"
            >
              {value}
            </motion.span>
          </AnimatePresence>
        )}
      </div>
      <span className="mt-1 text-[10px] font-medium text-[#94A3B8]">{label}</span>
    </div>
  );
};

export const CurrencyGlyph: React.FC<{
  type: Denomination['iconType'];
  className?: string;
}> = ({ type, className = 'w-7 h-7' }) => {
  switch (type) {
    case 'diamond':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <path
            d="M8 6H24L29 13L16 28L3 13L8 6Z"
            fill="url(#diamondGrad)"
            stroke="#38BDF8"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M3 13H29M11 6L9 13L16 28L23 13L21 6" stroke="white" strokeOpacity="0.4" strokeWidth="1.2" />
          <defs>
            <linearGradient id="diamondGrad" x1="3" y1="6" x2="29" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#06B6D4" />
              <stop offset="1" stopColor="#7C3AED" />
            </linearGradient>
          </defs>
        </svg>
      );
    case 'crystal':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <path
            d="M16 3L25 11L21 28L16 30L11 28L7 11L16 3Z"
            fill="url(#crystalGrad)"
            stroke="#A78BFA"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M16 3V30M7 11L16 14L25 11" stroke="white" strokeOpacity="0.4" strokeWidth="1.2" />
          <defs>
            <linearGradient id="crystalGrad" x1="7" y1="3" x2="25" y2="30" gradientUnits="userSpaceOnUse">
              <stop stopColor="#8B5CF6" />
              <stop offset="1" stopColor="#06B6D4" />
            </linearGradient>
          </defs>
        </svg>
      );
    case 'coin':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <circle cx="16" cy="16" r="12" fill="url(#coinGrad)" stroke="#FBBF24" strokeWidth="1.5" />
          <circle cx="16" cy="16" r="8" stroke="white" strokeOpacity="0.35" strokeWidth="1.2" />
          <path d="M16 11V21M13 14.5L16 11L19 14.5" stroke="#FEF3C7" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <defs>
            <linearGradient id="coinGrad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F59E0B" />
              <stop offset="1" stopColor="#B45309" />
            </linearGradient>
          </defs>
        </svg>
      );
    case 'voucher':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <rect x="3" y="7" width="26" height="18" rx="4" fill="url(#voucherGrad)" stroke="#22D3EE" strokeWidth="1.5" />
          <path d="M3 13H29" stroke="white" strokeOpacity="0.35" strokeWidth="1.5" />
          <circle cx="22" cy="19" r="2.2" fill="#E0F2FE" />
          <defs>
            <linearGradient id="voucherGrad" x1="3" y1="7" x2="29" y2="25" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0E7490" />
              <stop offset="1" stopColor="#5B21B6" />
            </linearGradient>
          </defs>
        </svg>
      );
    case 'crown':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <path
            d="M4 23L6 10L12.5 15L16 7L19.5 15L26 10L28 23H4Z"
            fill="url(#crownGrad)"
            stroke="#C4B5FD"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <rect x="5" y="25" width="22" height="3" rx="1.5" fill="#7C3AED" />
          <defs>
            <linearGradient id="crownGrad" x1="4" y1="7" x2="28" y2="23" gradientUnits="userSpaceOnUse">
              <stop stopColor="#A855F7" />
              <stop offset="1" stopColor="#06B6D4" />
            </linearGradient>
          </defs>
        </svg>
      );
  }
};

const EMBLEM_STYLES: Record<
  Exclude<BrandEmblemType, 'artwork'>,
  { bg: string; badge: string; icon: 'telco' | 'wallet' | 'power' | 'data' }
> = {
  telkomsel: {
    bg: 'from-[#450A0A] via-[#1E1B2E] to-[#0B0E14]',
    badge: 'text-rose-400 border-rose-500/35 bg-rose-500/15',
    icon: 'telco',
  },
  dana: {
    bg: 'from-[#082F49] via-[#0F172A] to-[#0B0E14]',
    badge: 'text-sky-400 border-sky-400/35 bg-sky-500/15',
    icon: 'wallet',
  },
  gopay: {
    bg: 'from-[#064E3B] via-[#0F172A] to-[#0B0E14]',
    badge: 'text-emerald-400 border-emerald-400/35 bg-emerald-500/15',
    icon: 'wallet',
  },
  ovo: {
    bg: 'from-[#3B0764] via-[#1E1B4B] to-[#0B0E14]',
    badge: 'text-purple-300 border-purple-400/35 bg-purple-500/15',
    icon: 'wallet',
  },
  shopeepay: {
    bg: 'from-[#431407] via-[#1F1726] to-[#0B0E14]',
    badge: 'text-orange-400 border-orange-400/35 bg-orange-500/15',
    icon: 'wallet',
  },
  pln: {
    bg: 'from-[#422006] via-[#151A23] to-[#0B0E14]',
    badge: 'text-amber-300 border-amber-400/35 bg-amber-500/15',
    icon: 'power',
  },
  xl: {
    bg: 'from-[#172554] via-[#151A23] to-[#0B0E14]',
    badge: 'text-cyan-300 border-cyan-400/35 bg-cyan-500/15',
    icon: 'data',
  },
  indosat: {
    bg: 'from-[#422006] via-[#1E1B2E] to-[#0B0E14]',
    badge: 'text-yellow-300 border-yellow-400/35 bg-yellow-500/15',
    icon: 'telco',
  },
};

export const GameArtImage: React.FC<{
  src: string;
  alt: string;
  emblem?: BrandEmblemType;
  emblemCode?: string;
  className?: string;
}> = ({ src, alt, emblem = 'artwork', emblemCode, className = '' }) => {
  const [failed, setFailed] = useState(false);

  if (emblem && emblem !== 'artwork') {
    const style = EMBLEM_STYLES[emblem];
    const IconComp =
      style.icon === 'power'
        ? Zap
        : style.icon === 'wallet'
        ? Wallet
        : style.icon === 'data'
        ? Wifi
        : Smartphone;

    return (
      <div
        className={`relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br ${style.bg} ${className}`}
      >
        <div
          aria-hidden="true"
          className="cyber-bg-grid absolute inset-0 opacity-40"
        />
        <div
          className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl border shadow-lg ${style.badge}`}
        >
          <IconComp className="h-5 w-5" aria-hidden="true" />
        </div>
        {emblemCode && (
          <span className="relative z-10 mt-2 font-mono text-[11px] font-bold tracking-widest text-slate-300">
            {emblemCode}
          </span>
        )}
      </div>
    );
  }

  if (failed || !src) {
    return (
      <div
        className={`flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#1B1633] via-[#151A23] to-[#0E2430] p-4 text-center ${className}`}
      >
        <Sparkles className="h-7 w-7 text-[#06B6D4]" aria-hidden="true" />
        <span className="mt-2 text-xs font-semibold text-slate-300 line-clamp-2">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};

export const ToastContainer: React.FC<{
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((t) =>
      window.setTimeout(() => onDismiss(t.id), 2800)
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [toasts, onDismiss]);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed top-18 right-3 z-50 flex w-[calc(100%-1.5rem)] max-w-xs flex-col gap-2 sm:top-auto sm:bottom-6 sm:left-6 sm:right-auto"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const icon =
            toast.variant === 'success' ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-[#06B6D4]" />
            ) : toast.variant === 'error' ? (
              <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
            ) : (
              <Info className="h-5 w-5 shrink-0 text-[#A78BFA]" />
            );

          return (
            <motion.div
              key={toast.id}
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -32, scale: 0.94 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -24, scale: 0.94 }}
              transition={{ duration: 0.26, ease: EASE_CYBER }}
              className="pointer-events-auto flex items-start gap-3 rounded-xl border border-white/10 bg-[#151A23]/95 p-3.5 shadow-2xl shadow-black/50 backdrop-blur-xl"
            >
              {icon}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#F8FAFC]">{toast.title}</p>
                {toast.description && (
                  <p className="mt-0.5 text-xs text-[#94A3B8] leading-relaxed">
                    {toast.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                aria-label={`Tutup ${toast.title}`}
                className="rounded-md p-1 text-[#94A3B8] hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
