/**
 * Renders plain text, turning any email address or URL inside it into a real
 * clickable link (mailto: / https:). Used wherever users type free text that
 * may contain contact details.
 */
const PATTERN = /((?:https?:\/\/|www\.)[^\s,]+)|([\w.+-]+@[\w-]+\.[\w.-]+)/gi;

export default function Linkify({ text = '', className = '' }) {
  const str = String(text || '');
  if (!str) return null;

  const parts = [];
  let last = 0;
  let m;
  PATTERN.lastIndex = 0;
  while ((m = PATTERN.exec(str)) !== null) {
    if (m.index > last) parts.push(str.slice(last, m.index));
    const [match, url, email] = m;
    if (url) {
      const href = url.startsWith('http') ? url : `https://${url}`;
      parts.push(
        <a key={m.index} href={href} target="_blank" rel="noreferrer noopener" className="font-medium text-brand-600 hover:underline">
          {url}
        </a>
      );
    } else if (email) {
      parts.push(
        <a key={m.index} href={`mailto:${email}`} className="font-medium text-brand-600 hover:underline">
          {email}
        </a>
      );
    }
    last = m.index + match.length;
  }
  if (last < str.length) parts.push(str.slice(last));

  return <span className={className}>{parts}</span>;
}
