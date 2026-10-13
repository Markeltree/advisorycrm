import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { conflict, unauthorized, HttpError } from '../lib/errors.js';
import { User } from '../models/User.js';

const ACCESS_TOKEN_EXPIRY_SEC = 24 * 60 * 60; // 24 hours
const REFRESH_TOKEN_EXPIRY_SEC = 7 * 24 * 60 * 60; // 7 days

export function createMongoAuth(config) {
  const secretKey = new TextEncoder().encode(config.JWT_SECRET || 'advisory-crm-fallback-jwt-secret-key-32b-min');

  async function generateTokens(user) {
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + ACCESS_TOKEN_EXPIRY_SEC;

    const accessToken = await new SignJWT({
      sub: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(now)
      .setExpirationTime(expiresAt)
      .sign(secretKey);

    const refreshToken = await new SignJWT({
      sub: user.id,
      type: 'refresh',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(now)
      .setExpirationTime(now + REFRESH_TOKEN_EXPIRY_SEC)
      .sign(secretKey);

    return {
      accessToken,
      refreshToken,
      expiresAt,
      userId: user.id,
    };
  }

  return {
    async verifyToken(token) {
      try {
        const { payload } = await jwtVerify(token, secretKey, {
          algorithms: ['HS256'],
        });
        if (!payload.sub) {
          throw unauthorized('Invalid token payload.');
        }
        return payload;
      } catch (err) {
        if (err.code === 'ERR_JWT_EXPIRED') {
          throw unauthorized('Your session expired. Sign in again.');
        }
        throw unauthorized('Your session is not valid. Sign in again.');
      }
    },

    async signIn(email, password) {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        throw unauthorized('Email or password is incorrect.');
      }

      if (!user.isActive) {
        throw unauthorized('This account has been deactivated. Please contact an administrator.');
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        throw unauthorized('Email or password is incorrect.');
      }

      return generateTokens(user);
    },

    async refresh(refreshToken) {
      try {
        const { payload } = await jwtVerify(refreshToken, secretKey, {
          algorithms: ['HS256'],
        });

        if (payload.type !== 'refresh' || !payload.sub) {
          throw unauthorized('Invalid refresh token.');
        }

        const user = await User.findOne({ id: payload.sub });
        if (!user || !user.isActive) {
          throw unauthorized('User account not found or deactivated.');
        }

        return generateTokens(user);
      } catch (err) {
        throw unauthorized('Your session expired. Sign in again.');
      }
    },

    async signOut(_accessToken) {
      // Stateless JWT sign-out; client clears token from storage
      return true;
    },

    async createUser({ email, password, fullName, role = 'advisor' }) {
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        throw conflict('A user with this email already exists.');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        email: email.toLowerCase(),
        password: hashedPassword,
        fullName: fullName || '',
        role: role || 'advisor',
        isActive: true,
      });

      return { id: user.id };
    },
  };
}
