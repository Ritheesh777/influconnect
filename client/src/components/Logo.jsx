import { Link } from 'react-router-dom';

/**
 * Custom InfluConnect mark: two interlocking nodes (brand + creator) joined by a
 * link — drawn as SVG, no emoji, crisp at any size.
 */
export function LogoMark({ size = 34, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="ic-grad" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7c3aed" />
          <stop offset="1" stopColor="#c026d3" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#ic-grad)" />
      <circle cx="15" cy="20" r="5.4" stroke="white" strokeWidth="2.4" />
      <circle cx="25" cy="20" r="5.4" stroke="white" strokeWidth="2.4" opacity="0.85" />
      <path d="M18.2 20h3.6" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export default function Logo({ to = '/', light = false, size = 34 }) {
  return (
    <Link to={to} className="group flex items-center gap-2.5">
      <span className="transition-transform duration-200 group-hover:scale-105">
        <LogoMark size={size} />
      </span>
      <span
        className={`font-display text-lg font-700 font-bold tracking-tight ${
          light ? 'text-white' : 'text-ink-950'
        }`}
      >
        Influ<span className="text-gradient">Connect</span>
      </span>
    </Link>
  );
}
