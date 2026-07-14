import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAsync } from '../../hooks/useAsync.js';
import { adminApi } from '../../api/endpoints.js';
import { PageLoader, StatusBadge, EmptyState, Pagination, Modal, Avatar, Spinner, StarRating } from '../../components/ui.jsx';
import Linkify from '../../components/Linkify.jsx';
import { formatDate, compactNumber } from '../../utils/format.js';
import { socialUrl } from '../../utils/social.js';
import { PLATFORM_LABELS } from '../../utils/constants.js';
import { IconVerified, IconUsers, IconExternal } from '../../components/icons.jsx';

export default function ManageUsers() {
  const [filters, setFilters] = useState({ page: 1 });
  const [detail, setDetail] = useState(null); // { loading, user, profile }
  const { data, loading, reload } = useAsync(
    () => adminApi.users(Object.fromEntries(Object.entries(filters).filter(([, v]) => v))),
    [filters]
  );

  // Clicking a name opens their full profile
  const openDetail = async (u) => {
    setDetail({ loading: true, user: u, profile: null });
    try {
      const res = await adminApi.user(u._id);
      setDetail({ loading: false, user: res.user, profile: res.profile });
    } catch (err) {
      toast.error(err.message);
      setDetail(null);
    }
  };

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
      <h1 className="text-2xl font-bold text-slate-900">Manage Users</h1>

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
                <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((u) => (
                  <tr key={u._id}>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openDetail(u)}
                        className="flex items-center gap-1 font-medium text-ink-800 hover:text-brand-600 hover:underline"
                        title="View full details"
                      >
                        {u.name} {u.isAdminVerified && <IconVerified className="h-4 w-4 text-brand-600" />}
                      </button>
                      <div className="text-xs text-slate-400">{u.email}</div>
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-500">{u.role}</td>
                    <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                    <td className="px-4 py-3 text-slate-400">{formatDate(u.createdAt)}</td>
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

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title="Full details" wide>
        {detail?.loading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : detail ? (
          <UserDetail user={detail.user} profile={detail.profile} />
        ) : null}
      </Modal>
    </div>
  );
}

/** Full profile panel shown when an admin clicks a user's name. */
function UserDetail({ user, profile }) {
  const isCompany = user.role === 'company';
  const rows = isCompany
    ? [
        ['Company name', profile?.companyName],
        ['Industry', profile?.industry],
        ['Website', profile?.website],
        ['Address', profile?.address],
        ['Location', [profile?.city, profile?.state, profile?.country].filter(Boolean).join(', ')],
        ['Campaigns posted', profile?.campaignsPosted ?? 0],
      ]
    : [
        ['Full name', profile?.fullName],
        ['Username', profile?.username ? `@${profile.username}` : ''],
        ['Location', [profile?.city, profile?.state, profile?.country].filter(Boolean).join(', ')],
        ['Categories', (profile?.categories || []).join(', ')],
        ['Total followers', compactNumber(profile?.totalFollowers || 0)],
        ['Portfolio items', profile?.portfolio?.length ?? 0],
      ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Avatar src={profile?.avatarUrl || profile?.logoUrl} name={user.name} size={60} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-lg font-semibold text-ink-900">{user.name}</h3>
            {user.isAdminVerified && <IconVerified className="h-4 w-4 text-brand-600" />}
          </div>
          <div className="text-sm text-ink-500">
            <a href={`mailto:${user.email}`} className="font-medium text-brand-600 hover:underline">{user.email}</a>
            {user.phone ? ` · ${user.phone}` : ''}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="chip capitalize">{user.role}</span>
            <StatusBadge status={user.status} />
            <span className="chip">{user.isVerified ? 'Email verified' : 'Email unverified'}</span>
            <span className="chip">Joined {formatDate(user.createdAt)}</span>
          </div>
        </div>
      </div>

      {profile?.bio || profile?.description ? (
        <p className="rounded-xl border border-ink-200 bg-ink-50 p-3 text-sm text-ink-700">
          <Linkify text={profile.bio || profile.description} />
        </p>
      ) : null}

      {/* Rating */}
      {profile ? (
        <div className="flex items-center gap-2 text-sm text-ink-600">
          <StarRating value={profile.ratingAvg || 0} /> {(profile.ratingAvg || 0).toFixed(1)} ({profile.ratingCount || 0} reviews)
        </div>
      ) : null}

      {/* Field grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-ink-200 p-3">
            <div className="text-xs text-ink-400">{label}</div>
            <div className="text-sm font-medium text-ink-800 break-words">
              {value ? <Linkify text={String(value)} /> : '—'}
            </div>
          </div>
        ))}
      </div>

      {/* Creator socials, with real profile links */}
      {!isCompany && profile?.socials?.length ? (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-ink-900">Social accounts</h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {profile.socials.map((s) => {
              const url = socialUrl(s.platform, s.username);
              return (
                <div key={s._id || s.platform} className="rounded-xl border border-ink-200 p-3">
                  <div className="text-xs font-semibold text-ink-700">{PLATFORM_LABELS[s.platform] || s.platform}</div>
                  {url ? (
                    <a href={url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">
                      @{String(s.username).replace(/^@/, '')} <IconExternal className="h-3 w-3" />
                    </a>
                  ) : (
                    <div className="text-sm text-ink-600">@{s.username}</div>
                  )}
                  <div className="mt-1 text-xs text-ink-500">
                    {compactNumber(s.followers)} followers · {compactNumber(s.avgViews)} avg views · {s.engagementRate || 0}% eng.
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Creator portfolio preview */}
      {!isCompany && profile?.portfolio?.length ? (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-ink-900">Portfolio</h4>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {profile.portfolio.slice(0, 8).map((p) => (
              <a key={p._id} href={p.url} target="_blank" rel="noreferrer noopener" className="overflow-hidden rounded-lg border border-ink-200">
                {p.type === 'image' ? (
                  <img src={p.url} alt="" className="h-20 w-full object-cover" loading="lazy" />
                ) : (
                  <div className="grid h-20 place-items-center bg-ink-100 text-xs text-ink-500">{p.type}</div>
                )}
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
