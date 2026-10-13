import { badRequest, conflict, notFound } from '../lib/errors.js';
import { User } from '../models/User.js';
import { audit } from './shared.js';

export async function listUsers(_db) {
  const users = await User.find({}).sort({ createdAt: 1 });
  return users.map((u) => ({
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    role: u.role,
    isActive: u.isActive,
    createdAt: u.createdAt,
  }));
}

export async function getProfile(_db, id) {
  const user = await User.findOne({ id });
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

export async function createUser(_db, auth, input, { user }) {
  const created = await auth.createUser(input);
  const userDoc = await User.findOne({ id: created.id });
  await audit(_db, user, 'user.create', 'user', created.id, { email: input.email, role: input.role });
  return {
    id: userDoc.id,
    email: userDoc.email,
    fullName: userDoc.fullName,
    role: userDoc.role,
    isActive: userDoc.isActive,
    createdAt: userDoc.createdAt,
  };
}

const dropsAdmin = (changes) =>
  (changes.role !== undefined && changes.role !== 'admin') || changes.isActive === false;

export async function updateUser(_db, id, changes, { user }) {
  if (id === user.id && dropsAdmin(changes)) {
    throw badRequest('You cannot remove your own admin access. Ask another admin.');
  }

  const existing = await User.findOne({ id });
  if (!existing) throw notFound('User not found.');

  if (existing.role === 'admin' && dropsAdmin(changes)) {
    const adminCount = await User.countDocuments({ role: 'admin', isActive: true, id: { $ne: id } });
    if (adminCount === 0) throw conflict('At least one active admin is required.');
  }

  if (changes.fullName !== undefined) existing.fullName = changes.fullName;
  if (changes.role !== undefined) existing.role = changes.role;
  if (changes.isActive !== undefined) existing.isActive = changes.isActive;

  await existing.save();
  await audit(_db, user, 'user.update', 'user', id, changes);

  return {
    id: existing.id,
    email: existing.email,
    fullName: existing.fullName,
    role: existing.role,
    isActive: existing.isActive,
    createdAt: existing.createdAt,
  };
}
