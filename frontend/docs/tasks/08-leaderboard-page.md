# Task 08: Full Leaderboard Page

## Objective

Build the complete leaderboard page with full rankings, search functionality, and infinite scroll.

## Requirements

- [ ] Full leaderboard table with all participants
- [ ] Search box to filter by nickname
- [ ] Infinite scroll or pagination
- [ ] Highlight current user's position
- [ ] Responsive design for mobile
- [ ] Real-time updates (optional)

## Page Structure

### app/(private)/leaderboard/page.tsx

```typescript
// Full leaderboard data fetching
// Search state management
// Pagination/infinite scroll logic
// Real-time updates via SWR
// Mobile-responsive table
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
  (index) => `/leaderboard?page=${index + 1}&limit=50`,
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

- `GET /leaderboard?limit=500` - Full leaderboard
- `GET /leaderboard?search=${term}` - Filtered results
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

## Real-time Updates (Optional)

- WebSocket connection for live updates
- Background refresh with SWR
- Visual indicators for rank changes
- Smooth animations for updates

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
