import * as XLSX from 'xlsx';
import { ImportRowRaw, ImportRowValidated, Tier } from '@/types/connections';

const VALID_TIERS: Tier[] = ['yellow', 'green', 'blue', 'purple'];

export async function parseWorkbook(file: File): Promise<ImportRowRaw[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];

  // header: rândul 1 devine cheile obiectului (tier, title, item1...)
  const rows = XLSX.utils.sheet_to_json<ImportRowRaw>(sheet, {
    defval: '',
    raw: false,
  });

  return rows;
}

function normalize(value: unknown): string {
  return String(value ?? '').trim();
}

export function validateRows(raw: ImportRowRaw[]): ImportRowValidated[] {
  return raw.map((row, index) => {
    const rowNumber = index + 2; // +2: rândul 1 e antetul, indexul e 0-based
    const errors: string[] = [];

    const tierRaw = normalize(row.tier).toLowerCase();
    const title = normalize(row.title);
    const items = [row.item1, row.item2, row.item3, row.item4].map(normalize);
    const explanation = normalize(row.explanation);

    // sare peste rânduri complet goale (frecvent la finalul fișierului Excel)
    const isEmptyRow = !tierRaw && !title && items.every((i) => !i);
    if (isEmptyRow) {
      return { rowNumber, valid: false, errors: ['rând gol — ignorat'] };
    }

    if (!VALID_TIERS.includes(tierRaw as Tier)) {
      errors.push(`tier invalid: "${row.tier}" (acceptat: yellow, green, blue, purple)`);
    }
    if (!title) {
      errors.push('title lipsă');
    }
    if (items.some((i) => !i)) {
      errors.push('trebuie completate toate cele 4 iteme (item1-item4)');
    }
    const uniqueItems = new Set(items.map((i) => i.toUpperCase()));
    if (uniqueItems.size !== 4 && items.every((i) => i)) {
      errors.push('cele 4 iteme trebuie să fie distincte');
    }

    if (errors.length > 0) {
      return { rowNumber, valid: false, errors };
    }

    return {
      rowNumber,
      valid: true,
      errors: [],
      tier: tierRaw as Tier,
      title,
      items,
      explanation: explanation || null,
    };
  });
}

// Verifică suprapuneri de iteme ÎNTRE rândurile valide ale lotului importat
// (nu blochează importul, doar avertizează — colecția poate avea intenționat
// iteme reutilizate în categorii diferite, generate în loturi diferite).
export function findCrossRowDuplicates(rows: ImportRowValidated[]): string[] {
  const seen = new Map<string, number[]>();
  for (const row of rows) {
    if (!row.valid || !row.items) continue;
    for (const item of row.items) {
      const key = item.toUpperCase();
      const list = seen.get(key) ?? [];
      list.push(row.rowNumber);
      seen.set(key, list);
    }
  }
  const warnings: string[] = [];
  for (const [item, rowNumbers] of seen.entries()) {
    if (rowNumbers.length > 1) {
      warnings.push(`"${item}" apare în rândurile ${rowNumbers.join(', ')}`);
    }
  }
  return warnings;
}
