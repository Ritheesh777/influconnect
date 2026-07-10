import { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Logo, { LogoMark } from '../components/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { motion } from '../lib/motion.jsx';
import { IconMenu, IconX } from '../components/icons.jsx';

const navItems = [
  { to: '/', label: 'Home', end: true },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/campaigns', label: 'Browse Campaigns' },
  { to: '/about', label: 'About' },
];

export default function PublicLayout() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const dashHome = { company: '/company', creator: '/creator', admin: '/admin' }[user?.role];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <header
        className={`safe-top sticky top-0 z-40 transition-colors duration-300 ${
          scrolled ? 'glass border-b border-ink-200/60' : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'text-brand-700' : 'text-ink-600 hover:text-ink-900'
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <Link to={dashHome} className="btn-primary">Go to Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="btn-ghost">Login</Link>
                <Link to="/register" className="btn-primary">Sign Up</Link>
              </>
            )}
          </div>
          <button className="rounded-lg p-1.5 text-ink-700 md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            {open ? <IconX className="h-6 w-6" /> : <IconMenu className="h-6 w-6" />}
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              className="glass border-t border-ink-200/60 px-4 py-3 md:hidden"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
            >
              {navItems.map((n) => (
                <NavLink key={n.to} to={n.to} end={n.end} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700">
                  {n.label}
                </NavLink>
              ))}
              <div className="mt-2 flex gap-2">
                {user ? (
                  <Link to={dashHome} className="btn-primary flex-1">Dashboard</Link>
                ) : (
                  <>
                    <Link to="/login" className="btn-outline flex-1">Login</Link>
                    <Link to="/register" className="btn-primary flex-1">Sign Up</Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="safe-bottom border-t border-ink-200/70 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-4">
          <div className="sm:col-span-2 md:col-span-1">
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-ink-500">
              The trusted marketplace connecting brands with the right creators.
            </p>
          </div>
          <FooterCol title="Platform" links={[['How It Works', '/how-it-works'], ['Browse Campaigns', '/campaigns'], ['For Creators', '/register/creator'], ['For Companies', '/register/company']]} />
          <FooterCol title="Company" links={[['About', '/about'], ['Contact', '/about'], ['Terms', '/terms'], ['Privacy', '/privacy']]} />
          <FooterCol title="Get Started" links={[['Login', '/login'], ['Sign Up', '/register']]} />
        </div>
        <div className="border-t border-ink-100 py-4 text-center text-xs text-ink-400">
          <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4">
            <LogoMark size={16} />
            © {new Date().getFullYear()} InfluConnect. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold text-ink-900">{title}</h4>
      <ul className="space-y-2">
        {links.map(([label, to]) => (
          <li key={label}>
            <Link to={to} className="text-sm text-ink-500 transition-colors hover:text-brand-600">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
