# Task 09: Daily Digest & Archive

## Objective

Implement daily digest banner with SSE updates and archive page for historical summaries.

## Requirements

- [ ] Daily digest banner with real-time updates
- [ ] SSE connection for push notifications
- [ ] Dismissible banner with localStorage
- [ ] Archive page for historical digests
- [ ] Responsive design and mobile optimization

## Components to Create

### components/DailyDigestBanner.tsx

- Top banner on all private pages
- Uses `useDigest()` hook for SSE updates
- Dismissible with "X" button
- localStorage to remember dismissal
- HTML content rendering (sanitized)
- Auto-dismiss after reading

### components/DigestArchive.tsx

- Timeline view of daily summaries
- Date-based organization
- Expandable content sections
- Search/filter functionality
- Pagination for large archives

## SSE Implementation

### lib/useDigest.ts Enhancement

```typescript
export const useDigest = () => {
  const [digest, setDigest] = useState<DailyDigest | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const eventSource = new EventSource(
      `${process.env.NEXT_PUBLIC_API}/sse/daily`,
      { withCredentials: true }
    );

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setDigest(data);
      } catch (err) {
        console.error('Failed to parse digest data:', err);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      setError('Connection lost');
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return { digest, isConnected, error };
};
```

## Banner Implementation

### Banner Component

```typescript
export const DailyDigestBanner = () => {
  const { digest, isConnected } = useDigest();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check localStorage for dismissal
    const dismissed = localStorage.getItem('digest-dismissed');
    if (dismissed === digest?.date) {
      setIsDismissed(true);
    }
  }, [digest]);

  const handleDismiss = () => {
    if (digest) {
      localStorage.setItem('digest-dismissed', digest.date);
      setIsDismissed(true);
    }
  };

  if (!digest || isDismissed) return null;

  return (
    <div className="bg-yellow-100 border-b border-yellow-200 p-3">
      <div className="max-w-7xl mx-auto flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-yellow-800">
              Daily Digest
            </span>
            {!isConnected && (
              <span className="text-xs text-yellow-600">(Offline)</span>
            )}
          </div>
          <div
            className="text-sm text-yellow-700"
            dangerouslySetInnerHTML={{ __html: digest.html }}
          />
        </div>
        <button
          onClick={handleDismiss}
          className="text-yellow-600 hover:text-yellow-800"
        >
          ×
        </button>
      </div>
    </div>
  );
};
```

## Archive Page

### app/(private)/daily/page.tsx

```typescript
// Fetch historical digests
// Display in chronological order
// Search and filter functionality
// Pagination or infinite scroll
// Empty states for no digests
```

### Archive Layout

```typescript
<div className="max-w-4xl mx-auto p-6">
  <h1>Daily Digest Archive</h1>

  {/* Search/Filter */}
  <div className="mb-6">
    <input
      type="text"
      placeholder="Search digests..."
      className="w-full p-3 border rounded-lg"
    />
  </div>

  {/* Timeline */}
  <div className="space-y-6">
    {digests.map((digest) => (
      <DigestCard key={digest.date} digest={digest} />
    ))}
  </div>
</div>
```

## Digest Card Component

```typescript
interface DigestCardProps {
  digest: DailyDigest;
}

export const DigestCard = ({ digest }: DigestCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="font-medium text-gray-900">
            {formatDate(digest.date)}
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          {isExpanded ? 'Collapse' : 'Read More'}
        </button>
      </div>

      <div className={`text-gray-700 ${isExpanded ? '' : 'truncate'}`}>
        <div dangerouslySetInnerHTML={{ __html: digest.html }} />
      </div>
    </div>
  );
};
```

## API Integration

- SSE endpoint: `/sse/daily`
- Fallback: `GET /summaries/latest`
- Archive: `GET /summaries?page=${page}&limit=20`
- Search: `GET /summaries?search=${term}`

## Content Security

- HTML sanitization for digest content
- XSS protection
- Safe rendering of user-generated content
- Content validation

## Performance Considerations

- Efficient SSE connection management
- Lazy loading for archive content
- Debounced search in archive
- Memory cleanup for old digests

## Mobile Optimization

- Responsive banner design
- Touch-friendly dismiss button
- Optimized archive layout
- Readable text sizes

## Error Handling

- SSE connection failures
- Retry mechanisms
- Graceful degradation to polling
- User-friendly error messages

## Testing Scenarios

- [ ] Banner appears with new digest
- [ ] Dismiss functionality works
- [ ] localStorage persistence
- [ ] SSE connection establishment
- [ ] Archive page loads correctly
- [ ] Search functionality works
- [ ] Mobile layout is usable
- [ ] Error states are handled

## Integration Points

- Banner appears in private layout
- Archive linked from navigation
- Consistent styling with app theme
- Accessibility considerations

## Dependencies

- Depends on: Task 02 (Types & Utilities)
- Integrates with: Task 04 (Home Dashboard layout)

## Estimated Time

6-8 hours

## Priority

Low - Nice-to-have engagement feature
