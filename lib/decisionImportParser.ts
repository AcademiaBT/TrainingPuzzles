import * as XLSX from 'xlsx';
import {
  DecisionImportRowRaw,
  DecisionImportRowValidated,
} from '@/types/decisionLab';

export async function parseDecisionWorkbook(
  file: File
): Promise<DecisionImportRowRaw[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json<DecisionImportRowRaw>(sheet, {
    defval: '',
    raw: false,
  });
}

function normalize(value: unknown): string {
  return String(value ?? '').trim();
}

function toBool(value: unknown): boolean {
  const v = normalize(value).toLowerCase();
  return v === 'true' || v === '1' || v === 'da' || v === 'yes';
}

export function validateDecisionRows(
  raw: DecisionImportRowRaw[]
): DecisionImportRowValidated[] {
  return raw.map((row, index) => {
    const rowNumber = index + 2;
    const errors: string[] = [];

    const scenario = normalize(row.scenario);
    const nodeCode = normalize(row.node_code);
    const nodeText = normalize(row.node_text);
    const isFinal = toBool(row.is_final);
    const isRoot = toBool(row.is_root);
    const choiceText = normalize(row.choice_text);
    const nextNodeCode = normalize(row.next_node_code);
    const scoreRaw = normalize(row.score);
    const feedback = normalize(row.feedback);
    const traitRaw = normalize(row.trait).toLowerCase();
    const validTraits = ['exploration', 'execution', 'analysis', 'diplomacy', 'investigation'];
    if (traitRaw && !validTraits.includes(traitRaw)) {
      errors.push(`trait invalid: "${row.trait}" (acceptat: ${validTraits.join(', ')}, sau gol)`);
    }

    const isEmptyRow = !scenario && !nodeCode && !nodeText;
    if (isEmptyRow) {
      return { rowNumber, valid: false, errors: ['rând gol — ignorat'] };
    }

    if (!scenario) errors.push('scenario lipsă');
    if (!nodeCode) errors.push('node_code lipsă');
    if (!nodeText) errors.push('node_text lipsă');

    if (!isFinal) {
      if (!choiceText) errors.push('choice_text lipsă (obligatoriu dacă nu e nod final)');
      if (!nextNodeCode) errors.push('next_node_code lipsă (obligatoriu dacă nu e nod final)');
    }

    let score = 0;
    if (scoreRaw) {
      score = Number(scoreRaw);
      if (Number.isNaN(score)) errors.push(`score invalid: "${row.score}"`);
    }

    if (errors.length > 0) {
      return { rowNumber, valid: false, errors };
    }

    return {
      rowNumber,
      valid: true,
      errors: [],
      scenario,
      scenarioDescription: normalize(row.scenario_description) || undefined,
      nodeCode,
      nodeText,
      isRoot,
      isFinal,
      choiceText: choiceText || undefined,
      nextNodeCode: nextNodeCode || undefined,
      score,
      feedback: feedback || undefined,
      trait: traitRaw || undefined,
    };
  });
}

// Grupează rândurile valide pe scenariu, ca să poată fi inserate în ordine:
// 1. scenariul, 2. nodurile unice (deduplicate după node_code), 3. opțiunile
export function groupByScenario(rows: DecisionImportRowValidated[]) {
  const scenarios = new Map<
    string,
    {
      description?: string;
      nodes: Map<string, { nodeText: string; isRoot: boolean; isFinal: boolean }>;
      choiceRows: DecisionImportRowValidated[];
    }
  >();
  for (const row of rows) {
    if (!row.valid || !row.scenario || !row.nodeCode) continue;

    if (!scenarios.has(row.scenario)) {
      scenarios.set(row.scenario, {
        description: row.scenarioDescription,
        nodes: new Map(),
        choiceRows: [],
      });
    }
    const s = scenarios.get(row.scenario)!;
    if (!s.description && row.scenarioDescription) s.description = row.scenarioDescription;

    if (!s.nodes.has(row.nodeCode)) {
      s.nodes.set(row.nodeCode, {
        nodeText: row.nodeText!,
        isRoot: !!row.isRoot,
        isFinal: !!row.isFinal,
      });
    }

    if (!row.isFinal) {
      s.choiceRows.push(row);
    }
  }

  return scenarios;
}
