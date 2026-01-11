import type { AuthObject } from '@clerk/backend';
import type { LeagueMember, Form } from '../types';

declare global {
  namespace Express {
    interface Request {
      auth: AuthObject;
      league?: {
        id: string;
        membership?: LeagueMember;
        isAdmin: boolean;
      };
      form?: {
        id: string;
        data?: Form;
        isOwner: boolean;
      };
    }
  }
}
