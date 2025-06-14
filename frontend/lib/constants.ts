import { Stage, Team } from './types';

/**
 * Tournament stages in order
 */
export const STAGES: Stage[] = ['GROUP', 'R32', 'R16', 'QF', 'SF', 'F'];

/**
 * Stage display names
 */
export const STAGE_NAMES: Record<Stage, string> = {
  GROUP: 'Group Stage',
  R32: 'Round of 32',
  R16: 'Round of 16',
  QF: 'Quarter Finals',
  SF: 'Semi Finals',
  F: 'Final',
};

/**
 * World Cup 2024 teams
 */
export const TEAMS: Team[] = [
  { id: 'ARG', name: 'Argentina', flag: '🇦🇷' },
  { id: 'BRA', name: 'Brazil', flag: '🇧🇷' },
  { id: 'FRA', name: 'France', flag: '🇫🇷' },
  { id: 'GER', name: 'Germany', flag: '🇩🇪' },
  { id: 'ESP', name: 'Spain', flag: '🇪🇸' },
  { id: 'ENG', name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 'ITA', name: 'Italy', flag: '🇮🇹' },
  { id: 'POR', name: 'Portugal', flag: '🇵🇹' },
  { id: 'NED', name: 'Netherlands', flag: '🇳🇱' },
  { id: 'BEL', name: 'Belgium', flag: '🇧🇪' },
  { id: 'CRO', name: 'Croatia', flag: '🇭🇷' },
  { id: 'URU', name: 'Uruguay', flag: '🇺🇾' },
  { id: 'COL', name: 'Colombia', flag: '🇨🇴' },
  { id: 'MEX', name: 'Mexico', flag: '🇲🇽' },
  { id: 'USA', name: 'United States', flag: '🇺🇸' },
  { id: 'CAN', name: 'Canada', flag: '🇨🇦' },
  { id: 'JPN', name: 'Japan', flag: '🇯🇵' },
  { id: 'KOR', name: 'South Korea', flag: '🇰🇷' },
  { id: 'AUS', name: 'Australia', flag: '🇦🇺' },
  { id: 'MAR', name: 'Morocco', flag: '🇲🇦' },
  { id: 'SEN', name: 'Senegal', flag: '🇸🇳' },
  { id: 'DEN', name: 'Denmark', flag: '🇩🇰' },
  { id: 'SUI', name: 'Switzerland', flag: '🇨🇭' },
  { id: 'POL', name: 'Poland', flag: '🇵🇱' },
  { id: 'SVK', name: 'Slovakia', flag: '🇸🇰' },
  { id: 'CZE', name: 'Czech Republic', flag: '🇨🇿' },
  { id: 'AUT', name: 'Austria', flag: '🇦🇹' },
  { id: 'SWE', name: 'Sweden', flag: '🇸🇪' },
  { id: 'NOR', name: 'Norway', flag: '🇳🇴' },
  { id: 'TUR', name: 'Turkey', flag: '🇹🇷' },
  { id: 'UKR', name: 'Ukraine', flag: '🇺🇦' },
  { id: 'SRB', name: 'Serbia', flag: '🇷🇸' },
];

/**
 * Team lookup by ID
 */
export const TEAM_BY_ID = TEAMS.reduce(
  (acc, team) => {
    acc[team.id] = team;
    return acc;
  },
  {} as Record<string, Team>
);

/**
 * Scoring rules
 */
export const SCORING = {
  GROUP_STAGE: {
    EXACT_SCORE: 3,
    CORRECT_OUTCOME: 1,
    WRONG: 0,
  },
  KNOCKOUT: {
    EXACT_SCORE: 5,
    CORRECT_OUTCOME: 2,
    WRONG: 0,
  },
  ADVANCEMENT: {
    R16: 2,
    QF: 3,
    SF: 5,
    F: 8,
  },
  TOP_SCORER: {
    CORRECT: 10,
    WRONG: 0,
  },
} as const;

/**
 * Group stage groups
 */
export const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;

/**
 * Knockout bracket slots
 */
export const BRACKET_SLOTS = [
  // Round of 32
  'R32-A1', 'R32-A2', 'R32-B1', 'R32-B2', 'R32-C1', 'R32-C2', 'R32-D1', 'R32-D2',
  'R32-E1', 'R32-E2', 'R32-F1', 'R32-F2', 'R32-G1', 'R32-G2', 'R32-H1', 'R32-H2',
  // Round of 16
  'R16-1', 'R16-2', 'R16-3', 'R16-4', 'R16-5', 'R16-6', 'R16-7', 'R16-8',
  // Quarter Finals
  'QF-1', 'QF-2', 'QF-3', 'QF-4',
  // Semi Finals
  'SF-1', 'SF-2',
  // Final
  'F-1',
] as const;

/**
 * Default form values
 */
export const DEFAULT_FORM = {
  groupPicks: [],
  bracketPicks: [],
  topScorer: '',
  isFinal: false,
};

/**
 * Application routes
 */
export const ROUTES = {
  HOME: '/',
  CALLBACK: '/callback',
  PENDING: '/pending',
  DASHBOARD: '/home',
  FORMS: '/forms',
  LEADERBOARD: '/leaderboard',
  DAILY: '/daily',
} as const;

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',           // POST: { email } OR { email, displayName, colboNumber }
    CALLBACK: '/auth/callback',     // GET: ?token=... returns { jwt, approved, user }
    ME: '/me',                      // GET: returns user profile
  },
  LEADERBOARD: '/leaderboard',
  MATCHES: '/matches',
  FORMS: '/forms',
  SIMULATE: '/simulate',
  SUMMARIES: '/summaries',
  SSE: {
    DAILY: '/sse/daily',
  },
} as const;

/**
 * Auth error codes from backend
 */
export const AUTH_ERROR_CODES = {
  NEW_USER_REGISTRATION_REQUIRED: 'NEW_USER_REGISTRATION_REQUIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
} as const;

export type AuthErrorCode = typeof AUTH_ERROR_CODES[keyof typeof AUTH_ERROR_CODES];

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  DIGEST_DISMISSED: 'digest-dismissed',
  FORM_DRAFT: 'form-draft',
  REGISTRATION_EMAIL: 'registration-email',  // Store email during registration flow
} as const; 