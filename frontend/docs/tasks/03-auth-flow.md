# Task 03: Authentication Flow

## Objective

Implement complete authentication flow with smart magic link login, callback handling, and middleware protection.

## Requirements

- [ ] Landing page with email input and smart form handling
- [ ] Registration form for new users (triggered by API response)
- [ ] Magic link callback handler
- [ ] Middleware for route protection
- [ ] Pending approval page
- [ ] Session state management

## Pages to Create

### app/(public)/page.tsx - Landing Page

```typescript
// Initial email input form
// POST /auth/login with { email } on submit
// Handle 400 response with NEW_USER_REGISTRATION_REQUIRED
// Show registration form when needed
// Loading states and error handling
// Clean, minimal design
```

### Registration Form Flow

```typescript
// Step 1: Email only
// If user exists: Magic link sent → success
// If new user: Show registration form

// Step 2: Registration form (triggered by 400 response)
// Email (pre-filled), displayName, colboNumber inputs
// POST /auth/login with full registration data
// Account creation + magic link sending
```

### app/(public)/callback/page.tsx - Magic Link Handler

```typescript
// Read ?token= from URL
// Call backend to exchange for session cookie
// Redirect to /home or /pending based on approval status
// Handle invalid/expired tokens
```

### app/(public)/pending/page.tsx - Awaiting Approval

```typescript
// Message: "Thanks! An admin must approve you."
// Sign out button
// Simple centered card design
```

### app/middleware.ts - Route Protection

```typescript
// Edge middleware for /home, /forms, /leaderboard, /daily routes
// Check wc_session cookie
// Decode JWT and verify approval status
// Redirect logic for unauthenticated/unapproved users
```

## UI Components

### components/LoginForm.tsx

- Email input with validation
- Submit button with loading state
- Error message display
- Handles both login and registration flow
- Tailwind styling: centered card, shadow, rounded

### components/RegistrationForm.tsx

- Email (pre-filled), displayName, colboNumber inputs
- Form validation and submission
- Clear messaging about account creation
- Consistent styling with login form

### components/AwaitApprovalCard.tsx

- Checkmark icon
- Clear messaging
- Sign out button
- Centered layout

## Implementation Details

### Smart Login Flow

```typescript
const handleEmailSubmit = async (email: string) => {
  try {
    await api.post('/auth/login', { email });
    // Success: magic link sent
    setStep('magic-link-sent');
  } catch (error) {
    if (error.code === 'NEW_USER_REGISTRATION_REQUIRED') {
      // Show registration form
      setStep('registration');
      setRegistrationEmail(email);
    } else {
      // Handle other errors
      setError(error.message);
    }
  }
};
```

### Form States

- `email-input`: Initial email entry
- `registration`: New user registration form
- `magic-link-sent`: Success message
- `error`: Error state with retry option

## API Integration

- `POST /auth/login` with `{ email }` - Initial attempt
- `POST /auth/login` with `{ email, displayName, colboNumber }` - Registration
- `GET /auth/callback?token=...` - Exchange token for session

## Testing Scenarios

- [ ] Returning user login (email only)
- [ ] New user gets registration form
- [ ] Registration form submission
- [ ] Magic link with valid token
- [ ] Magic link with expired/invalid token
- [ ] Middleware redirects work correctly
- [ ] Pending page shows for unapproved users
- [ ] Approved users redirect to home
- [ ] Error handling for network failures

## Dependencies

- Depends on: Task 02 (Types & Utilities)
- Blocks: Task 04 (Home Dashboard)

## Estimated Time

8-10 hours (increased due to smart form flow)

## Priority

Critical - Required for all protected features
