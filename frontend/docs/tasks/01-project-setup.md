# Task 01: Project Bootstrap & Initial Setup

## Objective

Set up the Next.js 14 project with App Router, Tailwind CSS, Clerk authentication, and TypeScript configuration.

## Requirements

- [ ] Initialize Next.js 14 project with App Router
- [ ] Configure Tailwind CSS 3
- [ ] Set up TypeScript with proper types
- [ ] Install and configure Clerk authentication
- [ ] Install and configure ESLint with Next.js config
- [ ] Set up Prettier (optional)
- [ ] Install required dependencies

## Dependencies

```json
{
  "next": "^14.0.0",
  "@clerk/nextjs": "^4.29.0",
  "@types/node": "^20",
  "@types/react": "^18",
  "@types/react-dom": "^18",
  "swr": "^2.2.0",
  "tailwindcss": "^3.0.0",
  "@heroicons/react": "^2.0.0",
  "eslint": "^8",
  "eslint-config-next": "^14.0.0",
  "typescript": "^5"
}
```

## Implementation Steps

1. Run `npx create-next-app wc-frontend --ts --tailwind --eslint`
2. Install Clerk and other dependencies: `npm install @clerk/nextjs swr @heroicons/react`
3. Configure Tailwind CSS with custom colors if needed
4. Set up directory structure as per design doc
5. Create `.env.local` with required environment variables
6. Configure Clerk in the application
7. Test build and dev server

## Environment Variables

Create `.env.local` with:

```bash
# Backend API
NEXT_PUBLIC_API=http://localhost:3001

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Optional: For development
NEXT_PUBLIC_DEBUG_MODE=true
```

## Directory Structure to Create

```
/app
  /(public)      # Public routes (landing page)
  /(private)     # Protected routes (dashboard, forms)
/components      # Reusable UI components
/lib            # Utilities and types
/public         # Static assets
```

## Clerk Configuration

Add to `app/layout.tsx`:

```typescript
import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

## Acceptance Criteria

- [x] Project builds without errors
- [x] Development server starts successfully
- [x] Tailwind CSS is working
- [x] TypeScript compilation passes
- [x] ESLint runs without errors
- [x] Clerk authentication is configured
- [x] Environment variables are set up

## Estimated Time

3-5 hours

## Priority

Critical - Blocks all other frontend tasks
