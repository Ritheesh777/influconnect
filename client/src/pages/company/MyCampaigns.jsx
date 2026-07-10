import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAsync } from '../../hooks/useAsync.js';
import { campaignApi } from '../../api/endpoints.js';
import { PageLoader, StatusBadge, EmptyState } from '../../components/ui.jsx';
import { formatDate } from '../../utils/format.js';
import { IconPlus, IconEdit, IconTrash, IconCampaign } from '../../components/icons.jsx';

const TABS = ['all', 'active', 'draft', 'paused', 'closed', 'completed'];

export default function MyCampaigns() {
  const [tab, setTab] = useState('all');
  const { data, loading, reload } = useAsync(
    () => campaignApi.mine(tab === 'all' ? {} : { status: tab }),
    [tab]
  );

  const remove = async (c) => {
    if (!confirm(`Delete "${c.title}"? This cannot be undone.`)) return;
    try {
      await campaignApi.remove(c._id);
      toast.success('Campaign deleted');
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold text-ink-950">My Campaigns</h1>
        <Link to="/company/campaigns/new" className="btn-primary"><IconPlus className="h-4 w-4" /> Create New</Link>
      </div>

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
        <div className="card overflow-hidden">
          <div className="hidden grid-cols-12 gap-2 border-b border-slate-100 px-4 py-3 text-xs font-semibold uppercase text-slate-400 sm:grid">
            <div className="col-span-5">Title</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2">Apps</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1"></div>
          </div>
          <ul className="divide-y divide-slate-100">
            {data.items.map((c) => (
              <li key={c._id} className="grid grid-cols-1 gap-2 px-4 py-3 sm:grid-cols-12 sm:items-center">
                <div className="sm:col-span-5">
                  <Link to={`/company/campaigns/${c._id}`} className="font-medium text-slate-700 hover:text-brand-600">
                    {c.title}
                  </Link>
                  <div className="text-xs text-slate-400">Deadline {formatDate(c.deadline)}</div>
                </div>
                <div className="text-sm text-slate-500 sm:col-span-2">{c.category}</div>
                <div className="text-sm text-slate-500 sm:col-span-2">{c.applicationsCount} applied</div>
                <div className="sm:col-span-2"><StatusBadge status={c.status} /></div>
                <div className="flex gap-2 sm:col-span-1 sm:justify-end">
                  <Link to={`/company/campaigns/${c._id}/edit`} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-brand-600" title="Edit"><IconEdit className="h-4 w-4" /></Link>
                  <button onClick={() => remove(c)} className="rounded-lg p-1.5 text-ink-400 hover:bg-rose-50 hover:text-rose-600" title="Delete"><IconTrash className="h-4 w-4" /></button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <EmptyState icon={IconCampaign} title="No campaigns here" subtitle="Create a campaign to start receiving applications." action={<Link to="/company/campaigns/new" className="btn-primary">Create Campaign</Link>} />
      )}
    </div>
  );
}
