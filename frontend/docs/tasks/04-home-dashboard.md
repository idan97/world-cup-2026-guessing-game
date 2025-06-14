# Task 04: Home Dashboard

## Objective

Build the main dashboard page combining leaderboard, next fixtures, rules, and CTA buttons with daily digest banner.

## Requirements

- [ ] Responsive 3-column grid layout
- [ ] Leaderboard card (top 10 + highlight user)
- [ ] Next fixtures card with user's picks
- [ ] Rules accordion
- [ ] CTA buttons strip
- [ ] Daily digest banner integration
- [ ] Mobile-responsive design

## Page Structure

### app/(private)/layout.tsx - Private Layout

```typescript
// Shared layout for all protected pages
// Header navigation
// Daily digest banner
// Children content area
```

### app/(private)/home/page.tsx - Dashboard Page

```typescript
// Fetch dashboard data (leaderboard, fixtures)
// 3-column grid layout
// Error handling and loading states
// SWR for data fetching
```

## Components to Create

### components/Header.tsx

- Navigation links (Home, Leaderboard, Daily)
- User info/logout
- Highlight active route
- `bg-slate-800 text-white` styling

### components/DailyDigestBanner.tsx

- Uses `useDigest()` hook
- Dismissible with localStorage
- `bg-yellow-100 p-3 text-sm` styling
- HTML content rendering

### components/LeaderboardCard.tsx

- Top 10 entries table
- Highlight current user's row
- Rank, Name, Points columns
- "View full leaderboard" link

### components/NextFixturesCard.tsx

- List of upcoming matches
- Show user's predictions if any
- Kickoff time badges
- Lock indicators
- Team flags/names

### components/RulesCard.tsx

- Accordion with rules sections
- Static content (group stage, knockout, scoring)
- Collapsible sections
- Clear typography

### components/CTAButtons.tsx

- "Edit my form" button → `/forms/[id]/edit`
- "Simulate what-if" button → `/forms/[id]/compare#simulate`
- Full-width strip layout
- Primary button styling

## Layout Implementation

```typescript
// Tailwind grid structure
<div className="md:grid md:grid-cols-3 md:gap-4">
  <LeaderboardCard data={leaderboard} currentUserId={session.userId} />
  <NextFixturesCard data={fixtures} />
  <RulesCard />
  <div className="md:col-span-3">
    <CTAButtons formId={userFormId} />
  </div>
</div>
```

## API Integration

- `GET /leaderboard?limit=10` - Top 10 standings
- `GET /matches/next?formId=${userId}&window=2d` - Upcoming fixtures
- `GET /summaries/latest` - Fallback for digest banner
- SSE `/sse/daily` - Real-time digest updates

## Data Fetching Strategy

- Use SWR for caching and revalidation
- Loading skeletons for each card
- Error boundaries for failed requests
- Refresh on window focus

## Responsive Design

- Mobile: stacked single column
- Tablet: 2-column grid
- Desktop: 3-column grid
- CTA buttons always full-width

## Testing

- [ ] All cards load correctly
- [ ] User's row highlighted in leaderboard
- [ ] Fixtures show predictions when available
- [ ] Rules accordion functions properly
- [ ] CTA buttons navigate correctly
- [ ] Daily digest banner displays/dismisses
- [ ] Mobile layout works
- [ ] Loading and error states

## Dependencies

- Depends on: Task 03 (Auth Flow)
- Blocks: None (can work in parallel with forms)

## Estimated Time

8-10 hours

## Priority

High - Primary user interface
