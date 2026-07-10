import { verifyToken } from '../utils/token.js';
import { ApiError } from '../utils/apiError.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/** Requires a valid Bearer token; attaches req.user (lean, no password). */
export const protect = asyncHandler(async (req, _res, next) => {
  let token;
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) token = header.split(' ')[1];
  if (!token) throw ApiError.unauthorized('Not authenticated — no token provided');

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired token');
  }

  const user = await User.findById(decoded.id).select('-password');
  if (!user) throw ApiError.unauthorized('User no longer exists');
  if (user.status === 'banned' || user.status === 'suspended')
    throw ApiError.forbidden(`Account ${user.status}. Contact support.`);

  req.user = user;
  next();
});

/** Optional auth — attaches req.user if a valid token exists, else continues. */
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const decoded = verifyToken(header.split(' ')[1]);
      const user = await User.findById(decoded.id).select('-password');
      if (user) req.user = user;
    } catch {
      /* ignore — treat as anonymous */
    }
  }
  next();
});
