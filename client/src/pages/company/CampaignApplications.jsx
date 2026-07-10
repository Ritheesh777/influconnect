import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAsync } from '../../hooks/useAsync.js';
import { campaignApi, applicationApi } from '../../api/endpoints.js';
import { PageLoader, EmptyState } from '../../components/ui.jsx';
import ApplicantRow from '../../components/ApplicantRow.jsx';

const TABS = ['all', 'pending', 'accepted', 'rejected'];

export default function CampaignApplications() {
  const { id } = useParams();
  const [tab, setTab] = useState('all');
  const { data, loading, reload } = useAsync(
    () => campaignApi.applications(id, tab === 'all' ? {} : { status: tab }),
    [id, tab]
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
      <div className="flex items-center gap-2">
        <Link to={`/company/campaigns/${id}`} className="text-slate-400 hover:text-slate-600">←</Link>
        <h1 className="text-2xl font-bold text-slate-900">
          Applications {data?.campaign?.title ? `· ${data.campaign.title}` : ''}
        </h1>
      </div>

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
      ) : data?.applications?.length ? (
        <div className="space-y-3">
          {data.applications.map((a) => (
            <ApplicantRow key={a._id} application={a} onDecide={decide} />
          ))}
        </div>
      ) : (
        <EmptyState title="No applications" subtitle="Nothing to show for this filter." />
      )}
    </div>
  );
}
