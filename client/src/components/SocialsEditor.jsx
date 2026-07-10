import { useState } from 'react';
import { ALL_PLATFORMS, PLATFORM_LABELS } from '../utils/constants.js';

const blank = { platform: 'instagram', username: '', followers: 0, avgViews: 0, engagementRate: 0 };

export default function SocialsEditor({ initial = [], onSave }) {
  const [rows, setRows] = useState(initial.length ? initial.map((s) => ({ ...s })) : [{ ...blank }]);

  const update = (i, key, value) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [key]: value } : row)));
  const add = () => setRows((r) => [...r, { ...blank }]);
  const remove = (i) => setRows((r) => r.filter((_, idx) => idx !== i));

  const save = () => {
    const cleaned = rows
      .filter((r) => r.username.trim())
      .map((r) => ({
        platform: r.platform,
        username: r.username.trim(),
        followers: Number(r.followers) || 0,
        avgViews: Number(r.avgViews) || 0,
        engagementRate: Number(r.engagementRate) || 0,
      }));
    onSave(cleaned);
  };

  return (
    <div className="space-y-4">
      {rows.map((row, i) => (
        <div key={i} className="rounded-xl border border-slate-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <select className="input w-auto" value={row.platform} onChange={(e) => update(i, 'platform', e.target.value)}>
              {ALL_PLATFORMS.map((p) => <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>)}
            </select>
            {rows.length > 1 && (
              <button onClick={() => remove(i)} className="text-sm text-rose-500">Remove</button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input" placeholder="Username / handle" value={row.username} onChange={(e) => update(i, 'username', e.target.value)} />
            <input className="input" type="number" placeholder="Followers" value={row.followers || ''} onChange={(e) => update(i, 'followers', e.target.value)} />
            <input className="input" type="number" placeholder="Avg views" value={row.avgViews || ''} onChange={(e) => update(i, 'avgViews', e.target.value)} />
            <input className="input" type="number" step="0.1" placeholder="Engagement rate %" value={row.engagementRate || ''} onChange={(e) => update(i, 'engagementRate', e.target.value)} />
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between">
        <button onClick={add} className="text-sm font-medium text-brand-600">+ Add another platform</button>
        <button onClick={save} className="btn-primary">Save Accounts</button>
      </div>
      <p className="text-xs text-slate-400">
        Tip: verified metrics via official OAuth are coming soon. For now, enter your current numbers honestly — companies can report inflated stats.
      </p>
    </div>
  );
}
