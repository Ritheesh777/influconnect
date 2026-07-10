import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAsync } from '../../hooks/useAsync.js';
import { campaignApi, applicationApi, savedApi } from '../../api/endpoints.js';
import { PageLoader, Avatar, Modal, EmptyState, StatusBadge } from '../../components/ui.jsx';
import { formatDate, daysLeft } from '../../utils/format.js';
import { PLATFORM_LABELS } from '../../utils/constants.js';
import { IconMessage, IconBookmark, IconArrowLeft, IconCampaign } from '../../components/icons.jsx';

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, reload } = useAsync(() => campaignApi.get(id), [id]);
  const [applyOpen, setApplyOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) return <PageLoader />;
  if (!data?.campaign) return <EmptyState icon={IconCampaign} title="Campaign not found" />;

  const { campaign: c, myApplication, isSaved } = data;
  const company = c.companyProfile || {};
  const dl = daysLeft(c.deadline);

  const apply = async () => {
    setBusy(true);
    try {
      await applicationApi.apply({ campaignId: id, message });
      toast.success('Application submitted! You can now chat with the company.');
      setApplyOpen(false);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleSave = async () => {
    try {
      await savedApi.toggle(id);
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to="/creator/browse" className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-600"><IconArrowLeft className="h-4 w-4" /> Back to browse</Link>

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
          <div className="mt-3 flex items-center gap-2">
            <Avatar src={company.logoUrl} name={company.companyName} size={32} />
            <span className="text-sm font-medium text-slate-600">{company.companyName}</span>
            {company.industry && <span className="chip">{company.industry}</span>}
          </div>

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
        </div>
      </div>

      {/* Sticky action bar */}
      <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-card backdrop-blur safe-bottom">
        {myApplication && myApplication.status !== 'withdrawn' ? (
          <>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              Your application: <StatusBadge status={myApplication.status} />
            </div>
            <Link to="/messages" className="btn-primary"><IconMessage className="h-4 w-4" /> Open Chat</Link>
          </>
        ) : (
          <>
            <button onClick={toggleSave} className="btn-outline">
              <IconBookmark className="h-4 w-4" fill={isSaved ? 'currentColor' : 'none'} /> {isSaved ? 'Saved' : 'Save'}
            </button>
            <button onClick={() => setApplyOpen(true)} className="btn-primary flex-1 sm:flex-none">Apply Now</button>
          </>
        )}
      </div>

      <Modal
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        title="Apply to Campaign"
        footer={
          <>
            <button className="btn-outline" onClick={() => setApplyOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={apply} disabled={busy}>{busy ? 'Submitting…' : 'Submit Application'}</button>
          </>
        }
      >
        <p className="mb-3 text-sm text-slate-500">
          Introduce yourself and explain why you're a great fit. Chat unlocks once you apply.
        </p>
        <textarea
          className="input min-h-[130px]"
          placeholder="Hi! I'd love to collaborate because…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </Modal>
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
