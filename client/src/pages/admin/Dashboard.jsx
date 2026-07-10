import { Link } from 'react-router-dom';
import { useAsync } from '../../hooks/useAsync.js';
import { adminApi } from '../../api/endpoints.js';
import { PageLoader, StatCard, StatusBadge } from '../../components/ui.jsx';
import { formatDate } from '../../utils/format.js';
import { IconUsers, IconCompany, IconUser, IconCampaign, IconHandshake, IconFlag } from '../../components/icons.jsx';

export default function AdminDashboard() {
  const { data, loading } = useAsync(() => adminApi.dashboard(), []);
  if (loading) return <PageLoader />;
  const { stats, recentUsers = [] } = data || {};

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink-950">Admin Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Users" value={stats?.totalUsers} icon={IconUsers} accent="brand" delay={0} />
        <StatCard label="Companies" value={stats?.companies} icon={IconCompany} accent="emerald" delay={0.05} />
        <StatCard label="Creators" value={stats?.creators} icon={IconUser} accent="rose" delay={0.1} />
        <StatCard label="Campaigns" value={stats?.campaigns} icon={IconCampaign} accent="brand" delay={0.15} />
        <StatCard label="Collaborations" value={stats?.collaborations} icon={IconHandshake} accent="emerald" delay={0.2} />
        <StatCard label="Open Reports" value={stats?.openComplaints} icon={IconFlag} accent="amber" delay={0.25} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to="/admin/users" className="btn-outline">Manage Users</Link>
        <Link to="/admin/campaigns" className="btn-outline">Manage Campaigns</Link>
        <Link to="/admin/complaints" className="btn-outline">Review Reports</Link>
      </div>

      <div className="card p-5">
        <h2 className="mb-4 font-semibold text-ink-900">Recent Signups</h2>
        <ul className="divide-y divide-ink-100">
          {recentUsers.map((u) => (
            <li key={u._id} className="flex items-center justify-between py-3">
              <div>
                <div className="font-medium text-ink-800">{u.name}</div>
                <div className="text-xs text-ink-400">{u.email} · {formatDate(u.createdAt)}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="chip capitalize">{u.role}</span>
                <StatusBadge status={u.status} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
