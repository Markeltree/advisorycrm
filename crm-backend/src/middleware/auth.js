import { forbidden, unauthorized } from '../lib/errors.js';
import { getProfile } from '../services/users.service.js';

// Verifies the Supabase access token and loads the CRM profile (role, active flag).
export async function authenticate(req, _res, next) {
  const match = /^Bearer\s+(\S+)$/i.exec(req.get('authorization') || '');
  if (!match) throw unauthorized();

  const { auth, db } = req.app.locals;
  const payload = await auth.verifyToken(match[1]);
  const profile = await getProfile(db, payload.sub);
  if (!profile) throw forbidden('This account has no CRM profile. Ask an admin to add you.');
  if (!profile.isActive) throw forbidden('This account is deactivated. Ask an admin to restore access.');

  req.user = profile;
  req.accessToken = match[1];
  next();
}

// admin > advisor > staff. Advisors are the licensed people who approve drafts.
export const requireRole =
  (...roles) =>
  (req, _res, next) => {
    if (!roles.includes(req.user?.role)) throw forbidden();
    next();
  };
