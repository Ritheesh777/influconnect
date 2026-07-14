import { IconShield } from './icons.jsx';

/**
 * Locked-contact panel (v1 change request §5).
 * Shows that contact details exist, without revealing them. The values here are
 * already masked by the API — nothing real is present in the DOM.
 */
export default function LockedContact({ contact = {}, socials = [], role = 'creator' }) {
  const rows = [
    ['Email', contact.email || '********@*****.com'],
    ['Phone', contact.phone || '+91 **********'],
    ...(role === 'creator'
      ? socials.slice(0, 3).map((s) => [s.platform || 'Social', '************'])
      : [['Website', '************']]),
  ];

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-ink-200 bg-ink-50 px-4 py-2.5">
        <IconShield className="h-4 w-4 text-ink-500" />
        <span className="text-sm font-semibold text-ink-800">Contact details are protected</span>
      </div>

      <div className="space-y-2 p-4">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium uppercase tracking-wide text-ink-400">{label}</span>
            <span className="select-none font-mono text-sm text-ink-400 blur-[3px]" aria-hidden="true">
              {value}
            </span>
          </div>
        ))}
      </div>

      <p className="border-t border-ink-200 bg-ink-50 px-4 py-3 text-xs text-ink-600">
        Contact information will be available after both parties accept the collaboration.
      </p>
    </div>
  );
}
