import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAsync } from '../../hooks/useAsync.js';
import { adminApi } from '../../api/endpoints.js';
import { PageLoader, StatusBadge, EmptyState } from '../../components/ui.jsx';
import { formatDate } from '../../utils/format.js';
import { IconShield } from '../../components/icons.jsx';

const TABS = ['all', 'open', 'reviewing', 'resolved', 'dismissed'];

export default function Complaints() {
  const [tab, setTab] = useState('all');
  const { data, loading, reload } = useAsync(
    () => adminApi.complaints(tab === 'all' ? {} : { status: tab }),
    [tab]
  );

  const resolve = async (c, status) => {
    let resolutionNote = '';
    if (status === 'resolved' || status === 'dismissed') {
      resolutionNote = prompt('Add a resolution note (optional):') || '';
    }
    try {
      await adminApi.resolveComplaint(c._id, { status, resolutionNote });
      toast.success(`Marked ${status}`);
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const ban = async (userId) => {
    if (!userId || !confirm('Ban this user?')) return;
    try {
      await adminApi.setUserStatus(userId, 'banned');
      toast.success('User banned');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Reports & Disputes</h1>
      <div className="flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium capitalize ${
              tab === t ? 'bg-brand-600 text-white' : 'bg-white text-slate-600'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <PageLoader />
      ) : data?.items?.length ? (
        <div className="space-y-3">
          {data.items.map((c) => (
            <div key={c._id} className="card p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="badge bg-slate-100 capitalize text-slate-600">{c.targetType}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="mt-2 font-medium text-slate-800">{c.reason}</div>
                  {c.description && <p className="mt-1 text-sm text-slate-600">{c.description}</p>}
                  <div className="mt-2 text-xs text-slate-400">
                    Reported by {c.reporter?.name} · {formatDate(c.createdAt)}
                    {c.targetUser && ` · against ${c.targetUser.name}`}
                    {c.targetCampaign && ` · campaign: ${c.targetCampaign.title}`}
                  </div>
                  {c.evidence?.length > 0 && (
                    <div className="mt-2 flex gap-2">
                      {c.evidence.map((e, i) => (
                        <a key={i} href={e} target="_blank" rel="noreferrer" className="text-xs text-brand-600 underline">Evidence {i + 1}</a>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 sm:flex-col sm:items-end">
                  {c.status !== 'reviewing' && <button className="chip bg-blue-100 text-blue-700" onClick={() => resolve(c, 'reviewing')}>Reviewing</button>}
                  <button className="chip bg-emerald-100 text-emerald-700" onClick={() => resolve(c, 'resolved')}>Resolve</button>
                  <button className="chip" onClick={() => resolve(c, 'dismissed')}>Dismiss</button>
                  {c.targetUser && <button className="chip bg-rose-100 text-rose-700" onClick={() => ban(c.targetUser._id)}>Ban User</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={IconShield} title="No reports" subtitle="A clean, healthy marketplace." />
      )}
    </div>
  );
}
