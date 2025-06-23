import type { Auth } from '@clerk/express';

declare global {
  namespace Express {
    interface Request {
      auth: Auth;
    }
  }
}
