import { IconSparkles } from './icons.jsx';

/**
 * Premium membership badge — worn by active subscribers.
 *
 * Uses the logo's own gradient (pink → violet → blue), deliberately reserved
 * for premium so the palette stays scarce and signals status. Kept visually
 * distinct from the other two status marks:
 *   blue check  = admin-verified (§17)
 *   green mark  = collaborating (§18)
 *   gradient    = paying member
 */
export default function PremiumBadge({ size = 'md', className = '' }) {
  if (size === 'sm')
    return (
      <span
        className={`grad-logo inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white ${className}`}
        title="Premium member"
        aria-label="Premium member"
      >
        <IconSparkles className="h-2.5 w-2.5" strokeWidth={2.5} />
      </span>
    );
  return (
    <span
      className={`grad-logo inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm ${className}`}
      title="Premium member"
    >
      <IconSparkles className="h-3 w-3" strokeWidth={2.5} />
      Premium
    </span>
  );
}
