export interface ScenarioRow {
  id: string;
  title: string;
  description: string | null;
}

export interface DecisionChoiceOption {
  id: string;
  choice_text: string;
}

export interface CurrentNodeState {
  node_text: string;
  is_final: boolean;
  total_score: number;
  status: 'in_progress' | 'completed';
  choices: DecisionChoiceOption[];
}

export interface ChooseDecisionResponse {
  feedback: string | null;
  score_delta: number;
  total_score: number;
  node_text: string;
  is_final: boolean;
  profile: string | null;
  debrief: string | null;
  choices: DecisionChoiceOption[];
}

export type DecisionPhase =
  | 'loading'
  | 'choosing_scenario'
  | 'playing'
  | 'feedback'
  | 'finished'
  | 'error';

// ============================================================
// Tipuri pentru importul Excel din admin
// ============================================================
export interface DecisionImportRowRaw {
  scenario?: string;
  scenario_description?: string;
  node_code?: string;
  node_text?: string;
  is_root?: string;
  is_final?: string;
  choice_text?: string;
  next_node_code?: string;
  score?: string;
  feedback?: string;
  trait?: string;
}

export interface DecisionImportRowValidated {
  rowNumber: number;
  valid: boolean;
  errors: string[];
  scenario?: string;
  scenarioDescription?: string;
  nodeCode?: string;
  nodeText?: string;
  isRoot?: boolean;
  isFinal?: boolean;
  choiceText?: string;
  nextNodeCode?: string;
  score?: number;
  feedback?: string;
  trait?: string;
}
