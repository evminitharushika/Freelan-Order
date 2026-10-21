import { AnimatePresence, motion } from 'framer-motion';
import { ClipboardList, ExternalLink, LayoutDashboard, LogOut, Menu, Package, UserRound, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/format';
import { Logo } from '../brand/Logo';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList, end: false },
  { to: '/admin/products', label: 'Products', icon: Package, end: false },
  { to: '/admin/profile', label: 'My Profile', icon: UserRound, end: true },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-6 pb-8">
        <Link to="/admin" onClick={onNavigate} aria-label="Admin dashboard">
          <Logo />
        </Link>
        <p className="mt-3 inline-block rounded-full bg-turmeric/15 px-2.5 py-0.5 text-[0.65rem] font-bold tracking-[0.2em] text-turmeric uppercase">Orders admin</p>
      </div>
      <nav className="flex-1 space-y-1 px-3" aria-label="Admin">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                isActive ? 'bg-cream text-maroon shadow-sm' : 'text-cream/75 hover:bg-cream/10 hover:text-cream',
              )
            }
          >
            <item.icon className="size-5" aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
        <Link to="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-cream/60 transition hover:bg-cream/10 hover:text-cream">
          <ExternalLink className="size-5" aria-hidden="true" />
          View website
        </Link>
      </nav>
      <div className="border-t border-cream/10 p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-turmeric font-display font-black text-maroon">{user?.name.charAt(0) ?? 'A'}</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{user?.name}</p>
            <p className="truncate text-xs text-cream/60">{user?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={async () => {
            await logout();
            navigate('/admin/login', { replace: true });
          }}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-cream/75 transition hover:bg-chilli hover:text-cream"
        >
          <LogOut className="size-5" aria-hidden="true" />
          Logout
        </button>
      </div>
    </div>
  );
}

/** Calm, functional shell for /admin/*: fixed sidebar on desktop, drawer on mobile. */
export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="min-h-[100svh] bg-[#f7f3ee] text-ink">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-maroon text-cream lg:block print:hidden">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between bg-maroon px-4 py-3 text-cream lg:hidden print:hidden">
        <Link to="/admin" aria-label="Admin dashboard">
          <Logo />
        </Link>
        <button type="button" onClick={() => setOpen(true)} className="rounded-full p-2" aria-label="Open navigation" aria-expanded={open} aria-controls="admin-drawer">
          <Menu className="size-6" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div className="absolute inset-0 bg-ink/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} aria-hidden="true" />
            <motion.aside
              id="admin-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Admin navigation"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
              className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-maroon text-cream shadow-2xl"
            >
              <button type="button" onClick={() => setOpen(false)} className="absolute top-5 right-4 rounded-full p-2 text-cream/70 hover:text-cream" aria-label="Close navigation">
                <X className="size-5" />
              </button>
              <SidebarContent onNavigate={() => setOpen(false)} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <main className="min-w-0 overflow-x-clip lg:pl-64 print:pl-0">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 print:max-w-none print:p-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
