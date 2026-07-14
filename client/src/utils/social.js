/**
 * Turns a handle into a real, clickable profile URL for each platform.
 * Accepts "@name", "name", or a full URL (returned as-is).
 */
export function socialUrl(platform, username = '') {
  const raw = String(username || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw; // already a full link

  const u = raw.replace(/^@/, '');
  switch (platform) {
    case 'instagram':
      return `https://instagram.com/${u}`;
    case 'youtube':
      // Channel IDs start with UC…; everything else is treated as a @handle
      return u.startsWith('UC') ? `https://youtube.com/channel/${u}` : `https://youtube.com/@${u}`;
    case 'tiktok':
      return `https://tiktok.com/@${u}`;
    case 'facebook':
      return `https://facebook.com/${u}`;
    case 'twitter':
      return `https://x.com/${u}`;
    case 'linkedin':
      return `https://linkedin.com/in/${u}`;
    default:
      return '';
  }
}
