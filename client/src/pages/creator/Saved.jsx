import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAsync } from '../../hooks/useAsync.js';
import { savedApi } from '../../api/endpoints.js';
import CampaignCard from '../../components/CampaignCard.jsx';
import { PageLoader, EmptyState } from '../../components/ui.jsx';
import { IconBookmark } from '../../components/icons.jsx';

export default function SavedCampaigns() {
  const { data, loading, reload } = useAsync(() => savedApi.list(), []);

  const remove = async (c) => {
    try {
      await savedApi.toggle(c._id);
      toast.success('Removed');
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Saved Campaigns</h1>
      {loading ? (
        <PageLoader />
      ) : data?.items?.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((s) => (
            <CampaignCard
              key={s._id}
              campaign={{ ...s.campaign, isSaved: true }}
              to={`/creator/campaigns/${s.campaign._id}`}
              onToggleSave={remove}
            />
          ))}
        </div>
      ) : (
        <EmptyState icon={IconBookmark} title="No saved campaigns" subtitle="Tap the bookmark on any campaign to save it for later." action={<Link to="/creator/browse" className="btn-primary">Browse Campaigns</Link>} />
      )}
    </div>
  );
}
