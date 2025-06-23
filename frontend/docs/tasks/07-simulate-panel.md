# Task 07: What-If Simulation Panel

## Objective

Build the simulation panel allowing users to modify future match outcomes and see how it affects their ranking.

## Requirements

- [ ] Panel on compare page for future matches
- [ ] Editable score inputs for upcoming matches
- [ ] Real-time ranking simulation
- [ ] Local state (not saved to backend)
- [ ] Debounced API calls
- [ ] Reset functionality

## Integration Point

- Appears on `/forms/compare#simulate` page
- Anchor link from home page CTA buttons
- Panel below the main comparison view

## Core Component

### components/SimulatePanel.tsx

```typescript
// Sidebar or bottom panel design
// List of future/pending matches
// Score input fields for each match
// "Simulate" button with loading state
// Results display with ranking changes
// Reset button to clear all overrides
```

## Panel Layout

```typescript
<div className="bg-gray-50 p-4 rounded-lg">
  <h3>What-If Simulator</h3>
  <p className="text-sm text-gray-600">
    Modify future match results to see how your ranking would change
  </p>

  {/* Future matches list */}
  <div className="space-y-3">
    {futureMatches.map((match) => (
      <FutureMatchInput key={match.id} match={match} />
    ))}
  </div>

  {/* Actions */}
  <div className="flex gap-2 mt-4">
    <button onClick={runSimulation}>Calculate Ranking</button>
    <button onClick={resetSimulation}>Reset</button>
  </div>

  {/* Results */}
  {simulationResult && <SimulationResults data={simulationResult} />}
</div>
```

## Future Match Input Component

```typescript
interface FutureMatchInputProps {
  match: {
    matchId: number;
    teams: [string, string];
    stage: Stage;
    kickoff: string;
  };
  onChange: (matchId: number, scoreA: number, scoreB: number) => void;
}
```

## Simulation Logic

### State Management

```typescript
interface SimulationState {
  overrides: Record<number, { scoreA: number; scoreB: number }>;
  isSimulating: boolean;
  lastResult: SimulateResponse | null;
  error: string | null;
}
```

### API Integration

- `POST /leagues/${leagueId}/simulate` with overrides payload
- Debounce calls (300ms after last change)
- Handle loading states
- Error recovery
- League-specific simulation results

### Request Format

```typescript
interface SimulateRequest {
  overrides: Record<
    number,
    {
      scoreA: number;
      scoreB: number;
      winnerTeamId: string; // derived from scores
    }
  >;
}
```

## Results Display

### components/SimulationResults.tsx

```typescript
// Shows new projected ranking
// Highlights rank change (+/- positions)
// Points difference from current
// Table of top 10 with changes highlighted
```

### Results Format

```typescript
interface SimulationResults {
  leagueId: string;
  myNewRank: number;
  myCurrentRank: number;
  rankChange: number; // positive = better
  newPoints: number;
  pointsGained: number;
  leaderboard: SimulatedStanding[];
  totalParticipants: number;
}
```

## UI Features

### Match Input Styling

- Team flags and names
- Score inputs (0-9 validation)
- Clear visual separation
- Compact layout for mobile

### Results Styling

- Rank change indicators (↑/↓ with colors)
- Points difference badges
- Mini leaderboard table
- Smooth transitions

### Interactive Elements

- Score inputs with arrow keys support
- Real-time validation
- Clear feedback on changes
- Loading indicators during simulation

## Performance Optimizations

- Debounce API calls
- Cancel previous requests
- Local state management
- Minimal re-renders

## Error Handling

- Network failures
- Invalid simulation data
- Validation errors
- Timeout handling

## Mobile Considerations

- Responsive panel layout
- Touch-friendly inputs
- Collapsible sections
- Scroll behavior

## Testing Scenarios

- [ ] Score inputs accept valid values (0-9)
- [ ] Simulation API calls are debounced
- [ ] Results display rank changes correctly
- [ ] Reset functionality clears all overrides
- [ ] Error states are handled gracefully
- [ ] Mobile layout works properly
- [ ] Loading states are shown during API calls

## Integration with Compare Page

- Smooth scrolling to #simulate anchor
- Panel appears below comparison data
- Consistent styling with page theme
- Does not interfere with main content

## Dependencies

- Depends on: Task 06 (Compare Results)
- Integrates with: Backend simulation API

## Estimated Time

6-8 hours

## Priority

Medium - Nice-to-have feature for engagement
