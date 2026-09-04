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

// ============================================================
// Tipuri pentru interfața de admin
// ============================================================

export interface GameRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  active: boolean;
}

export interface CategoryRow {
  id: string;
  game_id: string;
  title: string;
  tier: Tier;
  items: string[];
  explanation: string | null;
  active: boolean;
  times_used: number;
}

// Un rând citit dintr-un fișier Excel importat, înainte de validare
export interface ImportRowRaw {
  tier?: string;
  title?: string;
  item1?: string;
  item2?: string;
  item3?: string;
  item4?: string;
  explanation?: string;
}

export interface ImportRowValidated {
  rowNumber: number; // rândul din Excel, pentru afișare erori
  valid: boolean;
  errors: string[];
  tier?: Tier;
  title?: string;
  items?: string[];
  explanation?: string | null;
}

