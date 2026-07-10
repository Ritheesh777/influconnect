import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAsync } from '../../hooks/useAsync.js';
import { applicationApi } from '../../api/endpoints.js';
import { PageLoader, Avatar, StatusBadge, EmptyState } from '../../components/ui.jsx';
import { timeAgo } from '../../utils/format.js';
import { IconSend } from '../../components/icons.jsx';

const TABS = ['all', 'pending', 'accepted', 'rejected', 'withdrawn'];

export default function MyApplications() {
  const [tab, setTab] = useState('all');
  const { data, loading, reload } = useAsync(
    () => applicationApi.mine(tab === 'all' ? {} : { status: tab }),
    [tab]
  );

  const withdraw = async (a) => {
    if (!confirm('Withdraw this application?')) return;
    try {
      await applicationApi.withdraw(a._id);
      toast.success('Application withdrawn');
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const respondInvite = async (a, accept) => {
    try {
      await applicationApi.respondInvite(a._id, accept);
      toast.success(accept ? 'Invitation accepted!' : 'Invitation declined');
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">My Applications</h1>
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
          {data.items.map((a) => {
            const campaign = a.campaign || {};
            const company = campaign.companyProfile || {};
            const isInvite = a.origin === 'invitation' && a.status === 'pending';
            return (
              <div key={a._id} className="card p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar src={company.logoUrl} name={company.companyName} size={40} />
                    <div>
                      <Link to={`/creator/campaigns/${campaign._id}`} className="font-semibold text-slate-800 hover:text-brand-600">
                        {campaign.title || 'Campaign'}
                      </Link>
                      <div className="text-xs text-slate-400">
                        {company.companyName} · {timeAgo(a.createdAt)}
                        {a.origin === 'invitation' && ' · Invited'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={a.status} />
                    {isInvite ? (
                      <>
                        <button className="btn-primary px-3 py-1.5 text-xs" onClick={() => respondInvite(a, true)}>Accept</button>
                        <button className="btn-outline px-3 py-1.5 text-xs" onClick={() => respondInvite(a, false)}>Decline</button>
                      </>
                    ) : a.status === 'pending' ? (
                      <button className="btn-outline px-3 py-1.5 text-xs" onClick={() => withdraw(a)}>Withdraw</button>
                    ) : a.status === 'accepted' ? (
                      <Link to="/messages" className="btn-primary px-3 py-1.5 text-xs">Message</Link>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={IconSend} title="No applications" subtitle="Browse campaigns and apply to see them here." action={<Link to="/creator/browse" className="btn-primary">Browse Campaigns</Link>} />
      )}
    </div>
  );
}
