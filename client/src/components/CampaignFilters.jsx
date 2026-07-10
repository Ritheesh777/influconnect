import {
  CAMPAIGN_CATEGORIES,
  CAMPAIGN_TYPES,
  FOLLOWER_RANGES,
  PLATFORMS,
  PLATFORM_LABELS,
} from '../utils/constants.js';

export default function CampaignFilters({ filters, onChange, onReset }) {
  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value, page: 1 });

  return (
    <div className="card space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">Filters</h3>
        <button onClick={onReset} className="text-xs font-medium text-brand-600">
          Reset
        </button>
      </div>

      <Select label="Category" value={filters.category} onChange={set('category')} options={CAMPAIGN_CATEGORIES} />
      <Select label="Campaign Type" value={filters.campaignType} onChange={set('campaignType')} options={CAMPAIGN_TYPES} />
      <Select
        label="Platform"
        value={filters.platform}
        onChange={set('platform')}
        options={PLATFORMS}
        labels={PLATFORM_LABELS}
      />
      <Select label="Followers Required" value={filters.followerRange} onChange={set('followerRange')} options={FOLLOWER_RANGES} />

      <div>
        <label className="label">Location (city)</label>
        <input className="input" placeholder="e.g. Mumbai" value={filters.city || ''} onChange={set('city')} />
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options, labels }) {
  return (
    <div>
      <label className="label">{label}</label>
      <select className="input" value={value || ''} onChange={onChange}>
        <option value="">All</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {labels?.[o] || o}
          </option>
        ))}
      </select>
    </div>
  );
}
