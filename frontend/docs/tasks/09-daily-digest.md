# Task 09: Summaries Archive

## Objective

Build a page to display all historical daily summaries for the active league.

## Requirements

- [ ] Archive page listing all historical summaries
- [ ] Fetch summaries on page load
- [ ] Display in reverse chronological order
- [ ] Pagination or infinite scroll for large archives
- [ ] Responsive design and mobile optimization

## Components to Create

### components/SummaryCard.tsx

- Card-based layout for each summary
- Displays date and HTML content
- Expandable to show full content
- Clean, readable styling

### app/(private)/summaries/page.tsx

```typescript
import { useUser } from '@clerk/nextjs';
import { useState } from 'react';
import useSWR from 'swr';
import { clientFetcher } from '@/lib/fetcher';
import { useLeague } from '@/lib/useLeague';
import SummaryCard from '@/components/SummaryCard';

export default function SummariesPage() {
  const { user, isLoaded } = useUser();
  const { leagueId } = useLeague();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: summaries } = useSWR(
    user ? `/leagues/${leagueId}/messages?type=digest` : null,
    clientFetcher
  );

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  const filteredSummaries =
    summaries?.filter((summary) =>
      searchTerm
        ? summary.html.toLowerCase().includes(searchTerm.toLowerCase())
        : true
    ) || [];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Daily Summaries</h1>

      {/* Optional: Search/Filter */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search summaries..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Timeline of summaries */}
      <div className="space-y-6">
        {filteredSummaries.length > 0 ? (
          filteredSummaries.map((summary) => (
            <SummaryCard key={summary.id} summary={summary} />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            {searchTerm
              ? 'No summaries match your search.'
              : 'No summaries available yet.'}
          </div>
        )}
      </div>
    </div>
  );
}
```

## Page Layout

```typescript
<div className="max-w-4xl mx-auto p-6">
  <h1>Summaries Archive</h1>

  {/* Optional: Search/Filter */}
  <div className="mb-6">
    <input
      type="text"
      placeholder="Search summaries..."
      className="w-full p-3 border rounded-lg"
    />
  </div>

  {/* Timeline of summaries */}
  <div className="space-y-6">
    {summaries.map((summary) => (
      <SummaryCard key={summary.id} summary={summary} />
    ))}
  </div>
</div>
```

## API Integration

- `GET /leagues/:id/messages?type=digest` - Fetch all digest-type summaries for a league.
- `SWR` for data fetching and caching.

## Content Security

- Sanitize HTML content before rendering to prevent XSS attacks.

## Performance Considerations

- Lazy load archive content with pagination or infinite scroll.
- Debounce search input to avoid excessive API calls.

## Mobile Optimization

- Responsive archive layout.
- Readable text sizes and touch-friendly controls.

## Error Handling

- Display user-friendly messages for network or API errors.
- Implement a retry mechanism for failed requests.

## Testing Scenarios

- [ ] Archive page loads correctly.
- [ ] Summaries are displayed in the correct order.
- [ ] Pagination or infinite scroll works as expected.
- [ ] Search functionality filters results correctly.
- [ ] Mobile layout is usable and responsive.
- [ ] Error states are handled gracefully.

## Dependencies

- Depends on: Task 02 (Types & Utilities), Task 04 (Home Dashboard layout)
- Integrates with the `useLeague` hook to get the active league ID.

## Estimated Time

4-6 hours

## Priority

Low - Nice-to-have engagement feature
