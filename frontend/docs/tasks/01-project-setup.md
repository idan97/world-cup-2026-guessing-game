# Task 01: Project Bootstrap & Initial Setup

## Objective

Set up the Next.js 14 project with App Router, Tailwind CSS, and TypeScript configuration.

## Requirements

- [ ] Initialize Next.js 14 project with App Router
- [ ] Configure Tailwind CSS 3
- [ ] Set up TypeScript with proper types
- [ ] Install and configure ESLint with Next.js config
- [ ] Set up Prettier (optional)
- [ ] Install required dependencies

## Dependencies

```json
{
  "next": "^14.0.0",
  "@types/node": "^20",
  "@types/react": "^18",
  "@types/react-dom": "^18",
  "tailwindcss": "^3.0.0",
  "heroicons": "^2.0.0",
  "eslint": "^8",
  "eslint-config-next": "^14.0.0",
  "typescript": "^5"
}
```

## Implementation Steps

1. Run `npx create-next-app wc-frontend --ts --tailwind --eslint`
2. Install Heroicons for icons
3. Configure Tailwind CSS with custom colors if needed
4. Set up directory structure as per design doc
5. Create basic `.env.local` with `NEXT_PUBLIC_API` placeholder
6. Test build and dev server

## Directory Structure to Create

```
/app
  /(public)
  /(private)
/components
/lib
/public
```

## Acceptance Criteria

- [x] Project builds without errors
- [x] Development server starts successfully
- [x] Tailwind CSS is working
- [x] TypeScript compilation passes
- [x] ESLint runs without errors

## Estimated Time

2-4 hours

## Priority

Critical - Blocks all other frontend tasks
