import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAsync } from '../../hooks/useAsync.js';
import { adminApi } from '../../api/endpoints.js';
import { PageLoader, StatusBadge, EmptyState, Pagination } from '../../components/ui.jsx';
import { formatDate } from '../../utils/format.js';
import { IconVerified, IconUsers } from '../../components/icons.jsx';

export default function ManageUsers() {
  const [filters, setFilters] = useState({ page: 1 });
  const { data, loading, reload } = useAsync(
    () => adminApi.users(Object.fromEntries(Object.entries(filters).filter(([, v]) => v))),
    [filters]
  );

  const act = async (fn, label) => {
    try {
      await fn();
      toast.success(label);
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value, page: 1 }));

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-ink-950">Manage Users</h1>

      <div className="card grid gap-3 p-4 sm:grid-cols-4">
        <input className="input sm:col-span-2" placeholder="Search name or email…" onChange={set('q')} />
        <select className="input" onChange={set('role')} value={filters.role || ''}>
          <option value="">All roles</option>
          <option value="company">Company</option>
          <option value="creator">Creator</option>
        </select>
        <select className="input" onChange={set('status')} value={filters.status || ''}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      {loading ? (
        <PageLoader />
      ) : data?.items?.length ? (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs uppercase text-ink-400">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {data.items.map((u) => (
                  <tr key={u._id}>
                    <td className="px-4 py-3">
                      {/* §29/§30 — the name opens the full relationship view:
                          campaigns, collaborators, ranks, complaints, reviews. */}
                      {u.role === 'admin' ? (
                        <span className="flex items-center gap-1 font-medium text-ink-800">{u.name}</span>
                      ) : (
                        <Link
                          to={`/admin/${u.role}/${u._id}`}
                          className="flex items-center gap-1 font-medium text-ink-800 hover:text-brand-600 hover:underline"
                          title="Open full profile and collaboration history"
                        >
                          {u.name} {u.isAdminVerified && <IconVerified className="h-4 w-4 text-brand-600" />}
                        </Link>
                      )}
                      <div className="text-xs text-ink-400">{u.email}</div>
                    </td>
                    <td className="px-4 py-3 capitalize text-ink-500">{u.role}</td>
                    <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                    <td className="px-4 py-3 text-ink-400">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <button className="chip" onClick={() => act(() => adminApi.verifyUser(u._id, !u.isAdminVerified), 'Updated')}>
                          {u.isAdminVerified ? 'Unverify' : 'Verify'}
                        </button>
                        {u.status === 'active' ? (
                          <button className="chip bg-amber-100 text-amber-700" onClick={() => act(() => adminApi.setUserStatus(u._id, 'suspended'), 'Suspended')}>Suspend</button>
                        ) : (
                          <button className="chip bg-emerald-100 text-emerald-700" onClick={() => act(() => adminApi.setUserStatus(u._id, 'active'), 'Reactivated')}>Activate</button>
                        )}
                        <button className="chip bg-rose-100 text-rose-700" onClick={() => act(() => adminApi.setUserStatus(u._id, 'banned'), 'Banned')}>Ban</button>
                        <button className="chip" onClick={() => confirm(`Delete ${u.name}?`) && act(() => adminApi.deleteUser(u._id), 'Deleted')}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={filters.page} pages={data.pages} onChange={(p) => setFilters((f) => ({ ...f, page: p }))} />
        </>
      ) : (
        <EmptyState icon={IconUsers} title="No users found" />
      )}

    </div>
  );
}
