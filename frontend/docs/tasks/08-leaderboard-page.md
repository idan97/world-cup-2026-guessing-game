# Task 08: Full Leaderboard Page

## Objective

Build the complete leaderboard page with full rankings, search functionality, and infinite scroll.

## Requirements

- [ ] Full leaderboard table with all participants
- [ ] Tabs or a selector to switch between Global and League leaderboards
- [ ] Search box to filter by nickname
- [ ] Infinite scroll or pagination
- [ ] Highlight current user's position
- [ ] Responsive design for mobile

## Page Structure

### app/(private)/leaderboard/page.tsx

```typescript
import { useUser } from '@clerk/nextjs';
import { useState } from 'react';
import useSWR from 'swr';
import { clientFetcher } from '@/lib/fetcher';
import { useLeague } from '@/lib/useLeague';
import LeaderboardTable from '@/components/LeaderboardTable';
import LeaderboardSearch from '@/components/LeaderboardSearch';

export default function LeaderboardPage() {
  const { user, isLoaded } = useUser();
  const { leagueId } = useLeague();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: leaderboardData } = useSWR(
    user ? `/leaderboard/${leagueId}` : null,
    clientFetcher
  );

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <div className="text-sm text-gray-500">
          League: <span className="font-medium">{leagueId}</span>
        </div>
      </div>

      <div className="space-y-6">
        <LeaderboardSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          resultsCount={leaderboardData?.filtered?.length || 0}
          totalCount={leaderboardData?.total || 0}
        />

        <LeaderboardTable
          data={leaderboardData?.entries || []}
          currentUserId={user?.id}
          searchTerm={searchTerm}
        />
      </div>
    </div>
  );
}
```

## Core Components

### components/LeaderboardTable.tsx

- Sticky header row
- Rank, Nickname, Points columns
- Striped rows for readability
- Highlight current user's row
- Loading skeleton rows
- Empty state handling

### components/LeaderboardSearch.tsx

- Search input with debounced filtering
- Clear search button
- Results count display
- Search state management

### components/LeaderboardRow.tsx

- Individual row component
- Rank number with proper formatting
- User nickname display
- Points with proper formatting
- Highlight styling for current user

## Search Functionality

### Implementation

```typescript
const [searchTerm, setSearchTerm] = useState('');
const [filteredData, setFilteredData] = useState<LeaderboardEntry[]>([]);

// Debounced search effect
useEffect(() => {
  const timer = setTimeout(() => {
    if (searchTerm) {
      // Filter leaderboard data by nickname
      const filtered = leaderboardData.filter((entry) =>
        entry.nickname.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(leaderboardData);
    }
  }, 300);

  return () => clearTimeout(timer);
}, [searchTerm, leaderboardData]);
```

### Search UI

- Input field with search icon
- Placeholder: "Search by nickname..."
- Clear button when text exists
- Results counter: "Showing X of Y participants"

## Pagination Strategy

### Option 1: Infinite Scroll

```typescript
// Load more data as user scrolls
const { data, size, setSize, isLoading } = useSWRInfinite(
  (index) => `/leaderboard/${leagueId}?page=${index + 1}&limit=50`,
  fetcher
);

// Intersection Observer for loading trigger
useEffect(() => {
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !isLoading) {
      setSize(size + 1);
    }
  });
  // ... observer setup
}, []);
```

### Option 2: Traditional Pagination

- Page number controls
- Previous/Next buttons
- Jump to page input
- Items per page selector

## Table Styling

### Desktop Layout

```css
.leaderboard-table {
  @apply w-full border-collapse bg-white shadow-sm rounded-lg overflow-hidden;
}

.table-header {
  @apply bg-slate-50 border-b border-slate-200 sticky top-0;
}

.table-row {
  @apply border-b border-slate-100 hover:bg-slate-50;
}

.current-user-row {
  @apply bg-blue-50 border-blue-200;
}

.rank-cell {
  @apply text-center font-mono text-sm;
}

.nickname-cell {
  @apply font-medium;
}

.points-cell {
  @apply text-right font-mono;
}
```

### Mobile Layout

- Stack rank and points vertically
- Larger touch targets
- Simplified spacing
- Card-like row appearance

## API Integration

- `GET /leagues/${leagueId}/leaderboard` - League-specific leaderboard
- `GET /leagues/${leagueId}/leaderboard?search=${searchTerm}` - Filtered results
- `GET /leagues/${leagueId}/leaderboard?page=${page}&limit=${limit}` - Paginated results
- SWR for caching and revalidation
- Handle large datasets efficiently

## User Experience Features

### Current User Highlighting

- Distinct background color
- Scroll to user's position on load
- "Jump to my position" button
- Visual emphasis (border, shadow)

### Loading States

- Skeleton rows during initial load
- Loading spinner for infinite scroll
- Shimmer effect for better UX
- Progressive loading feedback

### Empty States

- No participants message
- No search results message
- Network error states
- Retry mechanisms

## Performance Optimizations

- Virtual scrolling for large lists (>1000 entries)
- Debounced search to reduce API calls
- Memoized components to prevent re-renders
- Lazy loading of non-visible rows

## Mobile Considerations

- Horizontal scroll for wide tables
- Sticky column headers
- Touch-friendly search input
- Optimized row heights

## Testing Scenarios

- [ ] Full leaderboard loads correctly
- [ ] Search filters results properly
- [ ] Current user row is highlighted
- [ ] Infinite scroll works smoothly
- [ ] Mobile layout is usable
- [ ] Loading states appear correctly
- [ ] Empty states are handled
- [ ] Large datasets perform well

## Accessibility

- Proper table semantics
- Screen reader support
- Keyboard navigation
- Focus management
- ARIA labels for interactive elements

## Dependencies

- Depends on: Task 04 (Home Dashboard) for LeaderboardCard
- Can work parallel to: Other feature tasks

## Estimated Time

6-8 hours

## Priority

Medium - Important for user engagement
