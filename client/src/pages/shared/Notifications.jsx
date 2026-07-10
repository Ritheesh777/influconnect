import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAsync } from '../../hooks/useAsync.js';
import { notificationApi } from '../../api/endpoints.js';
import { PageLoader, EmptyState } from '../../components/ui.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { timeAgo } from '../../utils/format.js';
import {
  IconInbox, IconCheck, IconX, IconSend, IconMessage, IconStar, IconClock,
  IconFlag, IconShield, IconSparkles, IconBell,
} from '../../components/icons.jsx';

const ICONS = {
  application_received: IconInbox,
  application_accepted: IconCheck,
  application_rejected: IconX,
  invitation_received: IconSend,
  new_message: IconMessage,
  review_received: IconStar,
  deadline_reminder: IconClock,
  complaint_update: IconFlag,
  account_status: IconShield,
  campaign_match: IconSparkles,
};

export default function Notifications() {
  const { data, loading, reload } = useAsync(() => notificationApi.list(), []);
  const { setUnreadNotifications } = useSocket();

  useEffect(() => {
    if (data) setUnreadNotifications(data.unread);
  }, [data, setUnreadNotifications]);

  const markAll = async () => {
    await notificationApi.markAllRead();
    setUnreadNotifications(0);
    reload();
  };
  const clearAll = async () => {
    if (!confirm('Clear all notifications?')) return;
    await notificationApi.clearAll();
    setUnreadNotifications(0);
    reload();
  };
  const open = async (n) => {
    if (!n.isRead) {
      await notificationApi.markRead(n._id);
      setUnreadNotifications((c) => Math.max(0, c - 1));
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink-950">Notifications</h1>
        <div className="flex gap-2">
          <button onClick={markAll} className="btn-ghost text-sm">Mark all read</button>
          <button onClick={clearAll} className="btn-ghost text-sm text-rose-600">Clear all</button>
        </div>
      </div>

      {data?.items?.length ? (
        <div className="space-y-2">
          {data.items.map((n) => {
            const Wrapper = n.link ? Link : 'div';
            const Icon = ICONS[n.type] || IconBell;
            return (
              <Wrapper
                key={n._id}
                {...(n.link ? { to: n.link } : {})}
                onClick={() => open(n)}
                className={`card card-hover flex items-start gap-3 p-4 ${!n.isRead ? 'border-l-4 border-l-brand-500' : ''}`}
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-ink-900">{n.title}</div>
                  {n.body && <div className="text-sm text-ink-500">{n.body}</div>}
                  <div className="mt-1 text-xs text-ink-400">{timeAgo(n.createdAt)}</div>
                </div>
                {!n.isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
              </Wrapper>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={IconBell} title="No notifications yet" subtitle="We'll let you know when something happens." />
      )}
    </div>
  );
}
