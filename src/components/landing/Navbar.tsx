import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, Menu, Phone, ShoppingBasket, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { company, telLink, whatsappLink } from '../../config/company';
import { useOrderStart } from '../../hooks/useOrderStart';
import { cn } from '../../lib/format';
import { scrollToTarget } from '../../lib/scroll';
import { Logo } from '../brand/Logo';

const LINKS = [
  { id: 'products', label: 'Products' },
  { id: 'how-it-works', label: 'How to order' },
  { id: 'contact', label: 'Contact' },
];

export function Navbar() {
  const { startOrder } = useOrderStart();
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const go = (id: string) => {
    setOpen(false);
    scrollToTarget(id, id === 'products' ? 0 : -72);
  };

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,padding] duration-300',
        solid || open ? 'bg-maroon/92 py-2.5 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.5)] backdrop-blur-md' : 'bg-transparent py-4 sm:py-5',
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8" aria-label="Main">
        <Link to="/" className="rounded-xl" aria-label="Freelan Sri Lanka home" onClick={() => scrollToTarget(0)}>
          <Logo />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => go(l.id)}
              className="rounded-full px-4 py-2 text-sm font-semibold text-cream/85 transition hover:bg-cream/10 hover:text-cream"
            >
              {l.label}
            </button>
          ))}
          <a
            href={telLink(company.phones[0])}
            className="ml-2 hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-cream/85 transition hover:bg-cream/10 hover:text-cream lg:inline-flex"
          >
            <Phone className="size-4 text-turmeric" aria-hidden="true" />
            <span className="tabular">{company.phones[0].display}</span>
          </a>
          <button
            type="button"
            onClick={() => startOrder()}
            className="ml-3 inline-flex items-center gap-2 rounded-full bg-turmeric px-5 py-2.5 text-sm font-extrabold uppercase tracking-wider text-maroon transition hover:bg-turmeric-300 active:scale-95"
          >
            <ShoppingBasket className="size-4" />
            Order now
          </button>
        </div>

        <button
          type="button"
          className="rounded-full p-2.5 text-cream md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden md:hidden"
          >
            <div className="flex flex-col gap-1 px-4 pt-3 pb-5">
              {LINKS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => go(l.id)}
                  className="rounded-xl px-3 py-3 text-left font-display text-2xl font-bold text-cream hover:bg-cream/10"
                >
                  {l.label}
                </button>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2">
                <a href={telLink(company.mobile)} className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-cream/25 px-4 py-3 text-sm font-bold text-cream">
                  <Phone className="size-4 text-turmeric" aria-hidden="true" /> Call
                </a>
                <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-cream/25 px-4 py-3 text-sm font-bold text-cream">
                  <MessageCircle className="size-4 text-turmeric" aria-hidden="true" /> WhatsApp
                </a>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  startOrder();
                }}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-turmeric px-5 py-4 font-extrabold uppercase tracking-wider text-maroon"
              >
                <ShoppingBasket className="size-5" />
                Order now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
