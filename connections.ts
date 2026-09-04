export type Tier = 'yellow' | 'green' | 'blue' | 'purple';

export const TIER_ORDER: Tier[] = ['yellow', 'green', 'blue', 'purple'];

export const TIER_LABELS: Record<Tier, string> = {
  yellow: 'Ușor',
  green: 'Mediu',
  blue: 'Greu',
  purple: 'Tricky',
};

export interface ShuffledItem {
  item: string;
  position: number;
}

export interface PuzzlePublicRow {
  id: string;
  game_id: string;
  shuffled_items: ShuffledItem[];
  is_daily: boolean;
  puzzle_date: string | null;
  created_at: string;
}

export interface SolvedCategory {
  title: string;
  tier: Tier;
  items: string[];
}

export interface RevealedCategory extends SolvedCategory {
  solved: boolean;
}

export type SubmitGuessResponse =
  | {
      result: 'correct';
      category: SolvedCategory;
      solved_count: number;
      won: boolean;
    }
  | { result: 'one_away'; mistakes: number; lost: boolean }
  | { result: 'wrong'; mistakes: number; lost: boolean }
  | { result: 'game_over'; status: 'won' | 'lost' };

export type GamePhase = 'loading' | 'playing' | 'won' | 'lost' | 'error';

export const MAX_MISTAKES = 4;
