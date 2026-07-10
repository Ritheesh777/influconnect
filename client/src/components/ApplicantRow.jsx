import { Link } from 'react-router-dom';
import { Avatar, StatusBadge } from './ui.jsx';
import { timeAgo } from '../utils/format.js';
import { IconVerified, IconArrowRight } from './icons.jsx';

export default function ApplicantRow({ application, onDecide, showCampaign }) {
  const creator = application.creator || {};
  const pending = application.status === 'pending';

  return (
    <div className="card card-hover p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <Avatar src={creator.avatarUrl} name={creator.name} size={44} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Link to={`/company/creators/${creator._id}`} className="font-semibold text-ink-900 hover:text-brand-600">
                {creator.name}
              </Link>
              {creator.isAdminVerified && <IconVerified className="h-4 w-4 text-brand-600" title="Verified" />}
              {application.origin === 'invitation' && <span className="badge bg-brand-50 text-brand-600">Invited</span>}
            </div>
            {showCampaign && application.campaign?.title && (
              <div className="text-xs text-ink-400">for {application.campaign.title}</div>
            )}
            <div className="text-xs text-ink-400">Applied {timeAgo(application.createdAt)}</div>
            {application.message && (
              <p className="mt-2 rounded-lg bg-ink-50 p-2.5 text-sm text-ink-600">{application.message}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 sm:flex-col sm:items-end">
          <StatusBadge status={application.status} />
          {pending && onDecide && (
            <div className="flex gap-2">
              <button className="btn-primary px-3 py-1.5 text-xs" onClick={() => onDecide(application, 'accepted')}>
                Accept
              </button>
              <button className="btn-outline px-3 py-1.5 text-xs" onClick={() => onDecide(application, 'rejected')}>
                Reject
              </button>
            </div>
          )}
          <Link to={`/company/creators/${creator._id}`} className="inline-flex items-center gap-1 text-xs font-medium text-brand-600">
            View profile <IconArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
