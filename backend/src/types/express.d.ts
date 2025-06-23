import type { Auth } from '@clerk/express';
import type { LeagueMember } from '../types';

declare global {
  namespace Express {
    interface Request {
      auth: Auth;
      league?: {
        id: string;
        membership?: LeagueMember;
        isAdmin: boolean;
      };
    }
  }
}
