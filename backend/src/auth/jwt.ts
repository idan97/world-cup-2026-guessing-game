import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { config } from '../config';

export interface JwtPayload {
  userId: string;
  email: string;
  isApproved: boolean;
  role: 'USER' | 'ADMIN';
}

export interface MagicLinkPayload {
  email: string;
  type: 'magic-link';
  expires: number;
}

export const generateJWT = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: '7d', // 7 days
    issuer: 'world-cup-predictor',
  });
};

export const verifyJWT = (token: string): JwtPayload => {
  try {
    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
    return payload;
  } catch {
    throw new Error('Invalid or expired token');
  }
};

export const generateMagicLinkToken = (email: string): string => {
  const payload: MagicLinkPayload = {
    email,
    type: 'magic-link',
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
  };

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: '15m',
    issuer: 'world-cup-predictor',
  });
};

export const verifyMagicLinkToken = (token: string): string => {
  try {
    const payload = jwt.verify(token, config.jwtSecret) as MagicLinkPayload;

    if (payload.type !== 'magic-link') {
      throw new Error('Invalid token type');
    }

    if (payload.expires < Date.now()) {
      throw new Error('Token expired');
    }

    return payload.email;
  } catch {
    throw new Error('Invalid or expired magic link token');
  }
};

export const generateSecureToken = (): string => {
  return randomBytes(32).toString('hex');
};
