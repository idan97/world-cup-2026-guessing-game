# Task 05: Form Editor

## Objective

Build the prediction form editor with group stage table, knockout bracket, and top scorer selection.

## Requirements

- [ ] Group stage predictions table
- [ ] Knockout bracket picker
- [ ] Top scorer input
- [ ] Auto-save functionality
- [ ] Validation before submission
- [ ] Lock handling (disable when tournament locked)

## Page Structure

### app/(private)/forms/edit/page.tsx

```typescript
import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { clientFetcher } from '@/lib/fetcher';
import GroupTable from '@/components/GroupTable';
import BracketPicker from '@/components/BracketPicker';
import TopScorerInput from '@/components/TopScorerInput';
import FormActions from '@/components/FormActions';

export default function FormEditorPage() {
  const { user, isLoaded } = useUser();
  const { leagueId } = useLeague();
  const { data: formData, mutate } = useSWR(
    user && leagueId ? `/leagues/${leagueId}/forms/me` : null,
    clientFetcher
  );

  const [formState, setFormState] = useState({
    groupPicks: [],
    bracketPicks: [],
    topScorer: '',
    isDirty: false,
    isSaving: false,
    isLocked: false,
  });

  // Auto-save logic with league context
  const saveFormData = async (data: FormState) => {
    try {
      await fetcher(`/leagues/${leagueId}/forms/me/picks`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      setFormState((prev) => ({ ...prev, isDirty: false, isSaving: false }));
    } catch (error) {
      console.error('Failed to save form:', error);
      setFormState((prev) => ({ ...prev, isSaving: false }));
    }
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!leagueId) {
    return <div>Please select a league first</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Edit Your Predictions</h1>
        <div className="text-sm text-gray-500">
          League: <span className="font-medium">{leagueId}</span>
        </div>
      </div>

      <div className="space-y-8">
        <GroupTable
          picks={formState.groupPicks}
          onChange={(picks) =>
            setFormState((prev) => ({
              ...prev,
              groupPicks: picks,
              isDirty: true,
            }))
          }
          disabled={formState.isLocked}
        />

        <BracketPicker
          picks={formState.bracketPicks}
          onChange={(picks) =>
            setFormState((prev) => ({
              ...prev,
              bracketPicks: picks,
              isDirty: true,
            }))
          }
          disabled={formState.isLocked}
        />

        <TopScorerInput
          value={formState.topScorer}
          onChange={(value) =>
            setFormState((prev) => ({
              ...prev,
              topScorer: value,
              isDirty: true,
            }))
          }
          disabled={formState.isLocked}
        />

        <FormActions
          formState={formState}
          onSave={() => {
            /* save logic */
          }}
          onSubmit={() => {
            /* submit logic */
          }}
        />
      </div>
    </div>
  );
}
```

## Core Components

### components/GroupTable.tsx

- Editable table for group stage matches
- Two score inputs per match (0-9 validation)
- W/D/L outcome radio buttons
- Zebra striping for rows
- Team flags and names
- Disabled state when locked

### components/BracketPicker.tsx

- Grid of select dropdowns for knockout stages
- R32, R16, QF, SF, Final slots
- Team options populated from group predictions
- Cascading updates (winner feeds next round)
- Visual bracket layout

### components/TopScorerInput.tsx

- Text input with autocomplete
- Player name validation
- Clear placeholder text

### components/FormActions.tsx

- Save draft button
- Submit final button (with confirmation)
- Lock status indicator
- Progress indicator

## Form Logic

### State Management

```typescript
interface FormState {
  groupPicks: GroupPick[];
  bracketPicks: BracketPick[];
  topScorer: string;
  isDirty: boolean;
  isSaving: boolean;
  isLocked: boolean;
}
```

### Auto-save Implementation

- Debounce changes (1 second)
- Save to `/forms/me/picks`
- Show saving indicator
- Handle save errors gracefully

### Validation Rules

- Scores must be 0-9
- All group matches must be predicted
- Bracket must be consistent with group results
- Top scorer must be valid player name

## API Integration

- `GET /leagues/${leagueId}/forms/me` - Load current user's form data for the league
- `PUT /leagues/${leagueId}/forms/me/picks` - Save draft for the league
- `POST /leagues/${leagueId}/forms/me/submit` - Final submission for the league
- `GET /teams` - Team data for selects
- `GET /players` - Player data for autocomplete
- `GET /leagues/${leagueId}/status` - Check if league form submission is locked

## UI Details

### Group Table Styling

```css
.group-table {
  @apply w-full border-collapse;
}
.match-row {
  @apply border-b border-gray-200;
}
.match-row:nth-child(even) {
  @apply bg-slate-50;
}
.score-input {
  @apply w-16 text-center border rounded p-1;
}
.outcome-radio {
  @apply mr-1;
}
```

### Bracket Layout

- CSS Grid for tournament bracket
- Responsive design (stack on mobile)
- Visual connections between rounds
- Clear labeling for each slot

## Form Submission Flow

1. Validate all required fields
2. Show confirmation modal
3. Call submit API
4. Handle success/error states
5. Redirect or show success message

## Error Handling

- Field-level validation messages
- Network error recovery
- Auto-save failure notifications
- Submit error handling

## Testing Scenarios

- [ ] Load existing form data
- [ ] Score input validation (0-9 only)
- [ ] Outcome selection updates
- [ ] Bracket consistency checking
- [ ] Auto-save functionality
- [ ] Final submission process
- [ ] Lock state disables editing
- [ ] Mobile responsive layout

## Dependencies

- Depends on: Task 02 (Types & Utilities)
- Can work parallel to: Task 04 (Home Dashboard)

## Estimated Time

12-15 hours

## Priority

High - Core functionality for predictions
