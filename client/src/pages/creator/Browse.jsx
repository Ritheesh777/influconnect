import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAsync } from '../../hooks/useAsync.js';
import { campaignApi, savedApi } from '../../api/endpoints.js';
import CampaignCard from '../../components/CampaignCard.jsx';
import CampaignFilters from '../../components/CampaignFilters.jsx';
import { PageLoader, EmptyState, Pagination } from '../../components/ui.jsx';
import { IconSearch } from '../../components/icons.jsx';

export default function BrowseCampaigns() {
  const [filters, setFilters] = useState({ page: 1, sort: 'latest' });
  const { data, loading, setData } = useAsync(
    () => campaignApi.browse(Object.fromEntries(Object.entries(filters).filter(([, v]) => v))),
    [filters]
  );

  const toggleSave = async (c) => {
    try {
      const { saved } = await savedApi.toggle(c._id);
      setData((d) => ({
        ...d,
        items: d.items.map((i) => (i._id === c._id ? { ...i, isSaved: saved } : i)),
      }));
      toast.success(saved ? 'Saved' : 'Removed from saved');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold text-slate-900">Browse Campaigns</h1>
        <div className="flex gap-2">
          <input className="input sm:w-56" placeholder="Search…" onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value, page: 1 }))} />
          <select className="input w-auto" value={filters.sort} onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}>
            <option value="latest">Latest</option>
            <option value="popular">Popular</option>
            <option value="deadline">Deadline</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <CampaignFilters filters={filters} onChange={setFilters} onReset={() => setFilters({ page: 1, sort: 'latest' })} />
        </aside>
        <div>
          {loading ? (
            <PageLoader />
          ) : data?.items?.length ? (
            <>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {data.items.map((c) => (
                  <CampaignCard key={c._id} campaign={c} to={`/creator/campaigns/${c._id}`} onToggleSave={toggleSave} />
                ))}
              </div>
              <Pagination page={filters.page} pages={data.pages} onChange={(p) => setFilters((f) => ({ ...f, page: p }))} />
            </>
          ) : (
            <EmptyState icon={IconSearch} title="No campaigns found" subtitle="Try adjusting your filters." />
          )}
        </div>
      </div>
    </div>
  );
}
