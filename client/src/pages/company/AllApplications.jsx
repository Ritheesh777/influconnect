import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAsync } from '../../hooks/useAsync.js';
import { applicationApi } from '../../api/endpoints.js';
import { PageLoader, EmptyState } from '../../components/ui.jsx';
import ApplicantRow from '../../components/ApplicantRow.jsx';

const TABS = ['all', 'pending', 'accepted', 'rejected'];

export default function AllApplications() {
  const [tab, setTab] = useState('all');
  const { data, loading, reload } = useAsync(
    () => applicationApi.received(tab === 'all' ? {} : { status: tab }),
    [tab]
  );

  const decide = async (application, decision) => {
    try {
      await applicationApi.decide(application._id, decision);
      toast.success(`Application ${decision}`);
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">All Applications</h1>
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize ${
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
          {data.items.map((a) => (
            <ApplicantRow key={a._id} application={a} onDecide={decide} showCampaign />
          ))}
        </div>
      ) : (
        <EmptyState title="No applications yet" subtitle="Applications across all your campaigns appear here." />
      )}
    </div>
  );
}
