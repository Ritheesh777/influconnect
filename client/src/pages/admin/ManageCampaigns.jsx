import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAsync } from '../../hooks/useAsync.js';
import { adminApi } from '../../api/endpoints.js';
import { PageLoader, StatusBadge, EmptyState, Pagination } from '../../components/ui.jsx';
import { formatDate } from '../../utils/format.js';
import { IconStar, IconCampaign } from '../../components/icons.jsx';

export default function ManageCampaigns() {
  const [filters, setFilters] = useState({ page: 1 });
  const { data, loading, reload } = useAsync(
    () => adminApi.campaigns(Object.fromEntries(Object.entries(filters).filter(([, v]) => v))),
    [filters]
  );

  const moderate = async (c, patch, label) => {
    try {
      await adminApi.moderateCampaign(c._id, patch);
      toast.success(label);
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value, page: 1 }));

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Manage Campaigns</h1>

      <div className="card grid gap-3 p-4 sm:grid-cols-3">
        <input className="input" placeholder="Search title…" onChange={set('q')} />
        <select className="input" onChange={set('status')} value={filters.status || ''}>
          <option value="">All statuses</option>
          {['active', 'draft', 'paused', 'closed', 'completed'].map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="input" onChange={set('moderation')} value={filters.moderation || ''}>
          <option value="">All moderation</option>
          {['approved', 'pending', 'flagged', 'removed'].map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <PageLoader />
      ) : data?.items?.length ? (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Deadline</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((c) => (
                  <tr key={c._id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 font-medium text-ink-800">{c.title} {c.isFeatured && <IconStar className="h-4 w-4 text-amber-400" fill="currentColor" strokeWidth={0} />}</div>
                      <div className="text-xs text-slate-400">{c.applicationsCount} apps · mod: {c.moderation}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{c.companyProfile?.companyName || '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 text-slate-400">{formatDate(c.deadline)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <button className="chip" onClick={() => moderate(c, { isFeatured: !c.isFeatured }, 'Updated')}>
                          {c.isFeatured ? 'Unfeature' : 'Feature'}
                        </button>
                        {c.moderation !== 'flagged' && (
                          <button className="chip bg-amber-100 text-amber-700" onClick={() => moderate(c, { moderation: 'flagged' }, 'Flagged')}>Flag</button>
                        )}
                        {c.moderation !== 'removed' ? (
                          <button className="chip bg-rose-100 text-rose-700" onClick={() => moderate(c, { moderation: 'removed' }, 'Removed')}>Remove</button>
                        ) : (
                          <button className="chip bg-emerald-100 text-emerald-700" onClick={() => moderate(c, { moderation: 'approved' }, 'Restored')}>Restore</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={filters.page} pages={data.pages} onChange={(p) => setFilters((f) => ({ ...f, page: p }))} />
        </>
      ) : (
        <EmptyState icon={IconCampaign} title="No campaigns found" />
      )}
    </div>
  );
}
