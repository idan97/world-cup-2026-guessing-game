# Task 02: TypeScript Types & Utility Functions

## Objective

Create all TypeScript interfaces and utility functions for data fetching, session management, and SSE.

## Requirements

- [ ] Implement all TypeScript interfaces from design doc
- [ ] Create fetcher utility with cookie handling
- [ ] Build session management utility
- [ ] Implement SSE hook for daily digest
- [ ] Add constants file with enums and static data

## Files to Create

### lib/types.ts

```typescript
// All interfaces from section 4 of design doc:
// - Session, LeaderboardEntry, NextMatch, DailyDigest
// - GroupPick, BracketPick, FormDraft
// - MatchBreakdown, CompareResponse, SimulateRequest, etc.
```

### lib/fetcher.ts

```typescript
// Wrapped fetch with credentials and API base URL
export const fetcher = <T = unknown>(url: string, init: RequestInit = {}) =>
  fetch(`${process.env.NEXT_PUBLIC_API}${url}`, {
    credentials: 'include',
    ...init,
  }).then((r) => (r.ok ? (r.json() as Promise<T>) : Promise.reject(r)));
```

### lib/useSession.ts

```typescript
// JWT decode helper for session cookie
export const useSession = (): Session | null => {
  // Cookie parsing and JWT decode logic
};
```

### lib/useDigest.ts

```typescript
// SSE hook for daily digest banner
export const useDigest = () => {
  // EventSource implementation for real-time updates
};
```

### lib/constants.ts

```typescript
// Static data: team lists, stage names, scoring rules, etc.
```

## Implementation Details

- Use proper TypeScript strict mode
- Handle cookie parsing edge cases
- Implement proper SSE cleanup
- Add error handling for all utilities
- Export all types for component usage

## Testing

- [ ] Type checking passes
- [ ] Fetcher handles errors correctly
- [ ] Session parsing works with valid/invalid cookies
- [ ] SSE connection establishes and cleans up properly

## Dependencies

- Depends on: Task 01 (Project Setup)
- Blocks: All component tasks

## Estimated Time

4-6 hours

## Priority

High - Required for all data operations
