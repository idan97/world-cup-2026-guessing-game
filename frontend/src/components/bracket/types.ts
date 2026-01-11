// Re-export types from lib/bracket-types for bracket components
// Note: lib is at root level, not in src, so we use relative path
export type {
  Team,
  Match,
  Round,
  BracketSide,
  BracketData,
  WorldCupBracketProps,
  RoundInfo,
  BracketState,
  MirroredBracketProps,
  RoundConfig,
} from '../../../lib/bracket-types';
