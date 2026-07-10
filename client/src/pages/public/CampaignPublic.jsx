import { useParams, Link } from 'react-router-dom';
import { useAsync } from '../../hooks/useAsync.js';
import { campaignApi } from '../../api/endpoints.js';
import { PageLoader, Avatar, EmptyState } from '../../components/ui.jsx';
import { formatDate, daysLeft } from '../../utils/format.js';
import { PLATFORM_LABELS } from '../../utils/constants.js';

export default function CampaignPublic() {
  const { id } = useParams();
  const { data, loading, error } = useAsync(() => campaignApi.get(id), [id]);

  if (loading) return <PageLoader />;
  if (error) return <div className="py-20"><EmptyState title="Campaign not found" /></div>;

  const c = data.campaign;
  const company = c.companyProfile || {};
  const dl = daysLeft(c.deadline);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="card overflow-hidden">
        <div className="h-40 bg-gradient-to-br from-brand-500 to-accent-500">
          {c.bannerUrl && <img src={c.bannerUrl} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge bg-brand-100 text-brand-700">{c.category}</span>
            <span className="badge bg-slate-100 text-slate-600">{c.campaignType}</span>
            {dl != null && dl >= 0 && <span className="badge bg-amber-100 text-amber-700">{dl}d left</span>}
          </div>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">{c.title}</h1>

          <Link to={`/company/${c.company}`} className="mt-3 inline-flex items-center gap-2">
            <Avatar src={company.logoUrl} name={company.companyName} size={32} />
            <span className="text-sm font-medium text-slate-600">{company.companyName}</span>
          </Link>

          <p className="mt-5 whitespace-pre-line text-slate-600">{c.description}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Info label="Followers required" value={c.followerRange} />
            <Info label="Platforms" value={(c.platforms || []).map((p) => PLATFORM_LABELS[p]).join(', ') || '—'} />
            <Info label="Location" value={c.isWorldwide ? 'Worldwide' : [c.city, c.country].filter(Boolean).join(', ') || '—'} />
            <Info label="Deadline" value={formatDate(c.deadline)} />
            <Info label="Creators needed" value={c.creatorsNeeded} />
            <Info label="Min engagement" value={c.minEngagementRate ? `${c.minEngagementRate}%` : '—'} />
          </div>

          {c.terms && (
            <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              <div className="font-semibold text-slate-700">Terms</div>
              <p className="mt-1 whitespace-pre-line">{c.terms}</p>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 rounded-2xl bg-brand-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-slate-700">Want to apply to this campaign?</p>
            <div className="flex gap-2">
              <Link to="/login" className="btn-outline">Login</Link>
              <Link to="/register/creator" className="btn-primary">Join as Creator to Apply</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 p-3">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-sm font-semibold text-slate-700">{value}</div>
    </div>
  );
}
