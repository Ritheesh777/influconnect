import { Collaboration } from '../models/Collaboration.js';

/**
 * Contact-privacy rules (v1 change request §4, §5, §16, §19).
 *
 * Until a collaboration is mutually accepted, contact details must never leave
 * the API — masking is done server-side, not in the UI, so the raw values are
 * not recoverable from the network response.
 */

/** True once the two users share an accepted collaboration (active or completed). */
export async function hasAcceptedCollaboration(userA, userB) {
  if (!userA || !userB) return false;
  if (String(userA) === String(userB)) return true; // your own data
  return Boolean(
    await Collaboration.exists({
      status: { $in: ['active', 'completed'] },
      $or: [
        { company: userA, creator: userB },
        { company: userB, creator: userA },
      ],
    })
  );
}

export const maskEmail = (v = '') => {
  const s = String(v);
  const at = s.indexOf('@');
  if (at < 1) return s ? '********' : '';
  return `********${s.slice(at)}`; // ********@gmail.com
};

export const maskPhone = (v = '') => {
  const s = String(v).trim();
  if (!s) return '';
  const cc = s.match(/^(\+\d{1,3})/); // keep country code only
  return cc ? `${cc[1]} **********` : '**********';
};

export const maskHandle = (v = '') => (String(v).trim() ? '************' : '');

export const maskUrl = (v = '') => (String(v).trim() ? '************' : '');

/** Strips emails/URLs/phones out of free text (bio, description, address). */
export const scrubText = (v = '') =>
  String(v)
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '********')
    .replace(/(https?:\/\/|www\.)[^\s,]+/gi, '********')
    .replace(/(\+?\d[\d\s-]{7,}\d)/g, '**********');

/**
 * Returns a creator profile safe to send to `viewerId`.
 * Locked → handles/contact masked. Unlocked → full details (§16).
 */
export function sanitizeCreatorProfile(profile, unlocked) {
  const p = { ...profile };
  // Raw subscription details (plan, expiry) are never another user's business —
  // even a collaborating partner only gets the derived `premium` boolean.
  if (p.user) p.user = { ...p.user, subscription: undefined };
  if (unlocked) return p;
  p.socials = (p.socials || []).map((s) => ({
    ...s,
    username: maskHandle(s.username),
    profileUrl: '',
  }));
  p.bio = scrubText(p.bio || '');
  p.city = scrubText(p.city || '');
  p.state = scrubText(p.state || '');
  p.mediaKitUrl = ''; // downloadable contact details (§19)
  if (p.user) p.user = { ...p.user, email: undefined, phone: undefined };
  return p;
}

/** Returns a company profile safe to send to `viewerId`. */
export function sanitizeCompanyProfile(profile, unlocked) {
  const p = { ...profile };
  if (p.user) p.user = { ...p.user, subscription: undefined };
  if (unlocked) return p;
  p.website = maskUrl(p.website);
  p.address = scrubText(p.address || '');
  p.description = scrubText(p.description || '');
  if (p.user) p.user = { ...p.user, email: undefined, phone: undefined };
  return p;
}

/** Masked contact block shown in the locked state. */
export function maskedContact(user = {}) {
  return {
    email: maskEmail(user.email),
    phone: maskPhone(user.phone),
  };
}
