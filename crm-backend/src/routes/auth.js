import { Router } from 'express';
import { forbidden, notFound } from '../lib/errors.js';
import { createUserSchema, idParam, loginSchema, refreshSchema, updateUserSchema } from '../lib/schemas.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { createUser, getProfile, listUsers, updateUser } from '../services/users.service.js';

// Sign-in goes through the API so the browser never needs Supabase keys.
export function authRouter({ loginLimiter }) {
  const router = Router();

  async function sessionResponse(req, session) {
    const user = await getProfile(req.app.locals.db, session.userId);
    if (!user) throw forbidden('This account has no CRM profile. Ask an admin to add you.');
    if (!user.isActive) throw forbidden('This account is deactivated. Ask an admin to restore access.');
    return { accessToken: session.accessToken, refreshToken: session.refreshToken, expiresAt: session.expiresAt, user };
  }

  router.post('/login', loginLimiter, async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const session = await req.app.locals.auth.signIn(email, password);
    res.json(await sessionResponse(req, session));
  });

  router.post('/refresh', loginLimiter, async (req, res) => {
    const { refreshToken } = refreshSchema.parse(req.body);
    const session = await req.app.locals.auth.refresh(refreshToken);
    res.json(await sessionResponse(req, session));
  });

  router.post('/logout', authenticate, async (req, res) => {
    try {
      await req.app.locals.auth.signOut(req.accessToken);
    } catch (err) {
      req.log?.warn({ err }, 'Supabase sign-out failed; the access token will still expire on its own');
    }
    res.status(204).end();
  });

  router.get('/me', authenticate, (req, res) => {
    res.json(req.user);
  });

  return router;
}

export const usersRouter = Router();

usersRouter.use(requireRole('admin'));

usersRouter.get('/', async (req, res) => {
  res.json(await listUsers(req.app.locals.db));
});

usersRouter.post('/', async (req, res) => {
  const { db, auth } = req.app.locals;
  res.status(201).json(await createUser(db, auth, createUserSchema.parse(req.body), { user: req.user }));
});

usersRouter.patch('/:id', async (req, res) => {
  const parsed = idParam.safeParse(req.params);
  if (!parsed.success) throw notFound('User not found.');
  const { id } = parsed.data;
  res.json(await updateUser(req.app.locals.db, id, updateUserSchema.parse(req.body), { user: req.user }));
});
