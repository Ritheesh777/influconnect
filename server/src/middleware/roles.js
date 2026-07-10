import { ApiError } from '../utils/apiError.js';

/** Restricts a route to one or more roles: authorize('company'), authorize('admin'). */
export const authorize =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role))
      return next(ApiError.forbidden(`Requires role: ${roles.join(' or ')}`));
    next();
  };
