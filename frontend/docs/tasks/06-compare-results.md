# Task 06: Compare Results & Scoring

## Objective

Build the results comparison page showing user predictions vs actual results with detailed scoring breakdown.

## Requirements

- [ ] Compare page showing predictions vs reality
- [ ] Detailed scoring breakdown by stage
- [ ] Match-by-match point calculation
- [ ] Stage advancement bonuses
- [ ] Top scorer points
- [ ] Total score and ranking display

## Page Structure

### app/(private)/forms/compare/page.tsx

```typescript
import { useUser } from '@clerk/nextjs';
import useSWR from 'swr';
import { clientFetcher } from '@/lib/fetcher';
import CompareAccordion from '@/components/CompareAccordion';
import ScoringBreakdown from '@/components/ScoringBreakdown';
import SimulatePanel from '@/components/SimulatePanel';

export default function CompareResultsPage() {
  const { user, isLoaded } = useUser();
  const { leagueId } = useLeague();
  const { data: compareData } = useSWR(
    user && leagueId ? `/leagues/${leagueId}/forms/me/compare` : null,
    clientFetcher
  );

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!leagueId) {
    return <div>Please select a league first</div>;
  }

  if (!compareData) {
    return <div>Loading comparison data...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Results Comparison</h1>
        <div className="text-sm text-gray-500">
          League: <span className="font-medium">{leagueId}</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ScoringBreakdown data={compareData} />
          <CompareAccordion
            matches={compareData.matches}
            advance={compareData.advance}
            topScorer={compareData.topScorer}
          />
        </div>

        <div className="lg:col-span-1">
          <SimulatePanel />
        </div>
      </div>
    </div>
  );
}
```

## Core Components

### components/CompareAccordion.tsx

- Accordion sections for each stage (Group, R16, QF, SF, F)
- Match-by-match comparison
- Points earned per match
- Visual indicators (✓/✗) for correct/incorrect
- Expandable detail view

### components/ScoreChip.tsx

- Small badge component
- Green for correct predictions (+points)
- Red for incorrect predictions (0 points)
- Shows point value earned
- Reusable across different match types

### components/ScoringBreakdown.tsx

- Summary of total points
- Breakdown by category:
  - Group stage matches
  - Knockout predictions
  - Stage advancement bonuses
  - Top scorer points
- Current ranking position

### components/MatchComparison.tsx

- Individual match comparison
- Team names and flags
- Predicted score vs actual score
- Outcome prediction (W/D/L)
- Points earned for this match

## Scoring Display Logic

### Match Points

```typescript
interface MatchDisplay {
  matchId: number;
  stage: Stage;
  teams: [string, string];
  myPrediction: { scoreA: number; scoreB: number; outcome: Outcome };
  actualResult: {
    scoreA: number | null;
    scoreB: number | null;
    outcome: Outcome | null;
  };
  pointsEarned: number;
  maxPoints: number;
}
```

### Visual Indicators

- ✓ Green check for correct predictions
- ✗ Red X for incorrect predictions
- ⏳ Clock icon for pending matches
- Point badge showing earned/available points

## API Integration

- `GET /leagues/${leagueId}/forms/me/compare` - Get comparison data for the league
- Handle partial results (ongoing tournament)
- League-specific ranking and points calculation

## Accordion Implementation

```typescript
// Stages with match breakdowns
const stages = [
  { name: 'Group Stage', matches: groupMatches },
  { name: 'Round of 16', matches: r16Matches },
  { name: 'Quarter Finals', matches: qfMatches },
  { name: 'Semi Finals', matches: sfMatches },
  { name: 'Final', matches: finalMatches },
];
```

## Styling & Layout

### Match Row Styling

- Clean table layout
- Team flags inline with names
- Score display: "2-1" format
- Point chips aligned right
- Striped rows for readability

### Accordion Styling

- Smooth expand/collapse animations
- Clear section headers with totals
- Indented content for hierarchy
- Mobile-friendly touch targets

## Special Cases Handling

- Matches not yet played (show as pending)
- Cancelled or postponed matches
- Bracket predictions where team didn't advance
- Top scorer ties or multiple winners

## Summary Statistics

- Total points earned
- Maximum possible points
- Current ranking position
- Points behind leader
- Percentage accuracy

## Error States

- API failures
- Missing comparison data
- Invalid form ID
- Network connectivity issues

## Testing Scenarios

- [ ] All stages display correctly
- [ ] Points calculation is accurate
- [ ] Pending matches show properly
- [ ] Accordion expand/collapse works
- [ ] Mobile layout is usable
- [ ] Error states are handled

## Performance Considerations

- Virtualize long lists if needed
- Lazy load accordion content
- Optimize re-renders
- Cache comparison data

## Dependencies

- Depends on: Task 02 (Types & Utilities)
- Can work parallel to: Task 05 (Form Editor)

## Estimated Time

8-10 hours

## Priority

High - Key feature for user engagement
