import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAsync } from '../../hooks/useAsync.js';
import { campaignApi, applicationApi } from '../../api/endpoints.js';
import { PageLoader, StatusBadge, StatCard, EmptyState } from '../../components/ui.jsx';
import ApplicantRow from '../../components/ApplicantRow.jsx';
import { formatDate } from '../../utils/format.js';
import { PLATFORM_LABELS } from '../../utils/constants.js';
import {
  IconArrowLeft, IconArrowRight, IconEye, IconInbox, IconHandshake, IconUsers,
  IconPin, IconEdit, IconPause, IconPlay, PLATFORM_ICON,
} from '../../components/icons.jsx';

export default function CampaignManage() {
  const { id } = useParams();
  const { data, loading, reload } = useAsync(() => campaignApi.get(id), [id]);
  const apps = useAsync(() => campaignApi.applications(id), [id]);

  if (loading) return <PageLoader />;
  const c = data.campaign;

  const setStatus = async (status) => {
    try {
      await campaignApi.setStatus(id, status);
      toast.success(`Campaign ${status}`);
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const decide = async (application, decision) => {
    try {
      await applicationApi.decide(application._id, decision);
      toast.success(`Application ${decision}`);
      apps.reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link to="/company/campaigns" className="rounded-lg p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-600">
          <IconArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-ink-950">{c.title}</h1>
        <StatusBadge status={c.status} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Views" value={c.viewsCount} icon={IconEye} accent="brand" />
        <StatCard label="Applications" value={c.applicationsCount} icon={IconInbox} accent="amber" delay={0.05} />
        <StatCard label="Accepted" value={c.acceptedCount} icon={IconHandshake} accent="emerald" delay={0.1} />
      </div>

      <div className="card p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="badge bg-brand-100 text-brand-700">{c.category}</span>
          <span className="badge bg-ink-100 text-ink-600">{c.campaignType}</span>
          <span className="chip"><IconUsers className="h-3.5 w-3.5" /> {c.followerRange}</span>
          {c.platforms?.map((p) => {
            const PIcon = PLATFORM_ICON[p] || PLATFORM_ICON.default;
            return <span key={p} className="chip"><PIcon className="h-3.5 w-3.5" /> {PLATFORM_LABELS[p]}</span>;
          })}
        </div>
        <p className="mt-4 whitespace-pre-line text-ink-600">{c.description}</p>
        <div className="mt-4 flex items-center gap-1.5 text-sm text-ink-500">
          <IconPin className="h-4 w-4" /> {c.isWorldwide ? 'Worldwide' : [c.city, c.country].filter(Boolean).join(', ') || '—'} · Deadline {formatDate(c.deadline)}
        </div>

        <div className="mt-5 flex flex-wrap gap-2 border-t border-ink-100 pt-5">
          <Link to={`/company/campaigns/${id}/edit`} className="btn-outline"><IconEdit className="h-4 w-4" /> Edit</Link>
          {c.status === 'active' ? (
            <button className="btn-outline" onClick={() => setStatus('paused')}><IconPause className="h-4 w-4" /> Pause</button>
          ) : c.status === 'paused' ? (
            <button className="btn-outline" onClick={() => setStatus('active')}><IconPlay className="h-4 w-4" /> Resume</button>
          ) : null}
          {c.status !== 'closed' && <button className="btn-outline" onClick={() => setStatus('closed')}>Close</button>}
          {c.status !== 'completed' && <button className="btn-primary" onClick={() => setStatus('completed')}>Mark Completed</button>}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink-900">Applications</h2>
          <Link to={`/company/campaigns/${id}/applications`} className="inline-flex items-center gap-1 text-sm font-medium text-brand-600">
            Full view <IconArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {apps.loading ? (
          <PageLoader />
        ) : apps.data?.applications?.length ? (
          <div className="space-y-3">
            {apps.data.applications.slice(0, 5).map((a) => (
              <ApplicantRow key={a._id} application={a} onDecide={decide} />
            ))}
          </div>
        ) : (
          <EmptyState icon={IconInbox} title="No applications yet" subtitle="Share your campaign to attract creators." />
        )}
      </div>
    </div>
  );
}
