import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronDown, Globe, PackageSearch, Search, Wallet, X, Zap } from 'lucide-react';
import type { CurrencyCode, GameItem, LanguageCode } from '../types/topup';
import { formatCurrency } from '../utils/pricing';
import { EASE_CYBER, GameArtImage, MagneticButton } from './MotionPrimitives';

interface NavbarProps {
  games: GameItem[];
  currency: CurrencyCode;
  language: LanguageCode;
  saldoUsd: number;
  orderCount: number;
  onSelectGame: (gameId: string) => void;
  onGoHome: () => void;
  onOpenTrackOrder: () => void;
  onOpenSaldo: () => void;
  onChangeCurrency: (currency: CurrencyCode) => void;
  onChangeLanguage: (language: LanguageCode) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  games,
  currency,
  language,
  saldoUsd,
  orderCount,
  onSelectGame,
  onGoHome,
  onOpenTrackOrder,
  onOpenSaldo,
  onChangeCurrency,
  onChangeLanguage,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [localeOpen, setLocaleOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const localeRef = useRef<HTMLDivElement>(null);

  const searchResults = query.trim()
    ? games
        .filter(
          (g) =>
            g.title.toLowerCase().includes(query.trim().toLowerCase()) ||
            g.publisher.toLowerCase().includes(query.trim().toLowerCase()) ||
            g.category.toLowerCase().includes(query.trim().toLowerCase()) ||
            g.currencyName.toLowerCase().includes(query.trim().toLowerCase())
        )
        .slice(0, 6)
    : [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
      if (localeRef.current && !localeRef.current.contains(event.target as Node)) {
        setLocaleOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSearchOpen(false);
        setLocaleOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleOpenSearch = () => {
    setSearchOpen(true);
    window.setTimeout(() => inputRef.current?.focus(), 60);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#0B0E14]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:gap-5 sm:px-6 lg:px-8">
        {/* Brand Logo with Animated Hover */}
        <motion.button
          type="button"
          onClick={onGoHome}
          whileHover={shouldReduceMotion ? undefined : { scale: 1.03 }}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
          transition={{ duration: 0.18, ease: EASE_CYBER }}
          className="group flex items-center gap-2 rounded-lg py-1 pr-1 text-left whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4] sm:gap-2.5 sm:pr-2"
          aria-label="NipNime Top-Up Beranda"
        >
          <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] shadow-md shadow-[#7C3AED]/30 transition-transform duration-300 group-hover:rotate-12 sm:h-9 sm:w-9">
            <Zap className="h-4 w-4 text-white fill-white/25 sm:h-4.5 sm:w-4.5" aria-hidden="true" />
          </span>
          <span className="text-base font-extrabold tracking-tight text-[#F8FAFC] sm:text-lg">
            NipNime<span className="text-[#06B6D4]">.</span>
          </span>
        </motion.button>

        {/* Expandable Search Bar with Instant Dropdown Results */}
        <div
          ref={searchRef}
          className={`relative flex items-center justify-end sm:flex-1 sm:justify-center max-w-md ${
            searchOpen ? 'flex-1' : ''
          }`}
        >
          <div className="relative flex w-full items-center justify-end">
            <button
              type="button"
              onClick={handleOpenSearch}
              aria-label="Cari game, pulsa, atau voucher"
              className={`flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-[#151A23] text-[#94A3B8] hover:text-white transition-colors sm:hidden ${
                searchOpen ? 'hidden' : 'flex'
              }`}
            >
              <Search className="h-4 w-4" />
            </button>

            <div className={`relative w-full ${searchOpen ? 'block' : 'hidden sm:block'}`}>
              <label htmlFor="navbar-game-search" className="sr-only">
                Cari game, pulsa, e-wallet, atau voucher
              </label>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]"
                aria-hidden="true"
              />
              <input
                ref={inputRef}
                id="navbar-game-search"
                type="text"
                value={query}
                onFocus={() => setSearchOpen(true)}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSearchOpen(true);
                }}
                placeholder={
                  language === 'ID'
                    ? 'Cari MLBB, Valorant, DANA, PLN...'
                    : 'Search MLBB, Valorant, DANA, vouchers...'
                }
                className="h-9 sm:h-10 w-full rounded-xl border border-white/10 bg-[#151A23]/90 pl-9 pr-8 text-xs sm:text-sm text-[#F8FAFC] placeholder:text-[#64748B] transition-all duration-200 focus:border-[#06B6D4]/70 focus:bg-[#151A23] focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/25"
              />
              {(query || searchOpen) && (
                <button
                  type="button"
                  onClick={() => {
                    if (query) {
                      setQuery('');
                      inputRef.current?.focus();
                    } else {
                      setSearchOpen(false);
                    }
                  }}
                  aria-label="Hapus atau tutup pencarian"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#94A3B8] hover:bg-white/10 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <AnimatePresence>
            {searchOpen && query.trim().length > 0 && (
              <motion.div
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.2, ease: EASE_CYBER }}
                className="absolute top-12 left-0 right-0 z-50 overflow-hidden rounded-2xl border border-white/10 bg-[#151A23]/95 p-2 shadow-2xl shadow-black/70 backdrop-blur-xl"
              >
                {searchResults.length > 0 ? (
                  <ul role="listbox" aria-label="Hasil pencarian" className="space-y-1">
                    {searchResults.map((game) => (
                      <li key={game.id}>
                        <button
                          type="button"
                          onClick={() => {
                            onSelectGame(game.id);
                            setQuery('');
                            setSearchOpen(false);
                          }}
                          className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]"
                        >
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/10">
                            <GameArtImage
                              src={game.image}
                              alt={game.title}
                              emblem={game.emblem}
                              emblemCode={game.emblemCode}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-[#F8FAFC]">
                              {game.title}
                            </p>
                            <p className="truncate text-xs text-[#94A3B8]">
                              {game.publisher} · {game.category}
                            </p>
                          </div>
                          <span className="text-xs font-medium text-[#06B6D4] whitespace-nowrap">
                            {game.currencyName}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-6 text-center">
                    <p className="text-sm font-medium text-[#F8FAFC]">Produk tidak ditemukan</p>
                    <p className="mt-1 text-xs text-[#94A3B8]">
                      Coba cari Mobile Legends, Valorant, Honor of Kings, atau DANA.
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Controls: Saldo Button (desktop), Language/Currency, Cek Pesanan */}
        <div className="flex items-center gap-1.5 shrink-0 sm:gap-2.5">
          <button
            type="button"
            onClick={onOpenSaldo}
            aria-label="Lihat Saldo NipNime"
            className="hidden md:inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#151A23] px-3 text-xs font-semibold text-[#F8FAFC] whitespace-nowrap shrink-0 transition-colors hover:border-[#06B6D4]/50 hover:bg-[#1C2330] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]"
          >
            <Wallet className="h-3.5 w-3.5 text-[#06B6D4]" aria-hidden="true" />
            <span className="font-mono tabular-nums">{formatCurrency(saldoUsd, currency)}</span>
          </button>

          <div ref={localeRef} className="relative">
            <button
              type="button"
              onClick={() => setLocaleOpen((prev) => !prev)}
              aria-expanded={localeOpen}
              aria-label="Pilih bahasa dan mata uang"
              className="inline-flex h-9 sm:h-10 items-center gap-1 sm:gap-1.5 rounded-xl border border-white/10 bg-[#151A23] px-2 sm:px-3 text-xs font-semibold text-[#F8FAFC] whitespace-nowrap shrink-0 transition-colors hover:border-[#7C3AED]/50 hover:bg-[#1C2330] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]"
            >
              <Globe className="h-3.5 w-3.5 text-[#06B6D4]" aria-hidden="true" />
              <span className="font-mono">
                <span className="hidden sm:inline">{language} · </span>
                {currency}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-[#94A3B8] transition-transform duration-200 ${
                  localeOpen ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>

            <AnimatePresence>
              {localeOpen && (
                <motion.div
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.18, ease: EASE_CYBER }}
                  className="absolute right-0 top-12 z-50 w-56 rounded-2xl border border-white/10 bg-[#151A23]/95 p-3 shadow-2xl shadow-black/70 backdrop-blur-xl"
                >
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                      Mata Uang
                    </p>
                    <div className="mt-1.5 grid grid-cols-3 gap-1">
                      {(['IDR', 'USD', 'EUR'] as CurrencyCode[]).map((code) => (
                        <button
                          key={code}
                          type="button"
                          onClick={() => {
                            onChangeCurrency(code);
                            setLocaleOpen(false);
                          }}
                          className={`rounded-lg py-1.5 font-mono text-xs font-semibold transition-colors ${
                            currency === code
                              ? 'bg-[#7C3AED] text-white'
                              : 'bg-white/[0.04] text-[#94A3B8] hover:bg-white/[0.08] hover:text-white'
                          }`}
                        >
                          {code}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 border-t border-white/[0.08] pt-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                      Bahasa
                    </p>
                    <div className="mt-1.5 grid grid-cols-2 gap-1">
                      {(['ID', 'EN'] as LanguageCode[]).map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => {
                            onChangeLanguage(lang);
                            setLocaleOpen(false);
                          }}
                          className={`rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                            language === lang
                              ? 'bg-[#06B6D4] text-[#0B0E14]'
                              : 'bg-white/[0.04] text-[#94A3B8] hover:bg-white/[0.08] hover:text-white'
                          }`}
                        >
                          {lang === 'ID' ? 'Indonesia' : 'English'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 border-t border-white/[0.08] pt-3 md:hidden">
                    <button
                      type="button"
                      onClick={() => {
                        setLocaleOpen(false);
                        onOpenSaldo();
                      }}
                      className="flex w-full items-center justify-between rounded-lg bg-white/[0.05] px-2.5 py-2 text-xs font-semibold text-[#F8FAFC] hover:bg-white/[0.1]"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Wallet className="h-3.5 w-3.5 text-[#06B6D4]" />
                        Saldo NipNime
                      </span>
                      <span className="font-mono text-[#06B6D4]">
                        {formatCurrency(saldoUsd, currency)}
                      </span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <MagneticButton
            variant="primary"
            glow
            onClick={onOpenTrackOrder}
            className="h-9 sm:h-10 px-2.5 text-xs sm:px-4 sm:text-sm"
          >
            <PackageSearch className="h-4 w-4" aria-hidden="true" />
            <span className="sm:hidden">{language === 'ID' ? 'Lacak' : 'Track'}</span>
            <span className="hidden sm:inline">
              {language === 'ID' ? 'Cek Pesanan' : 'Track Order'}
            </span>
            {orderCount > 0 && (
              <span className="hidden sm:inline-block ml-0.5 rounded-md bg-white/20 px-1.5 py-0.5 font-mono text-[11px] leading-none">
                {orderCount}
              </span>
            )}
          </MagneticButton>
        </div>
      </div>
    </header>
  );
};
