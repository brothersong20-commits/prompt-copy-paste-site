import Papa from 'papaparse';

const SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1FQfystrI-azl5itsm51AviWe1gyIEuOwWfEddTP4qeE/export?format=csv';

const COLUMN_ALIASES = {
  no: ['No.', 'No', 'no', 'ID', '순번'],
  category: ['카테고리', 'Category'],
  name: ['프롬프트 이름', '이름', 'Name', 'Title'],
  description: ['설명', 'Description', 'Desc'],
  ko: ['프롬프트(한글)', '프롬프트 한글', '한글', 'KO'],
  en: ['프롬프트(영문)', '프롬프트 영문', '영문', 'EN'],
  rating: ['평가', 'Rating'],
  memo: ['메모', 'Memo'],
  updatedAt: ['최종 수정일', '수정일', 'Updated']
};

function pick(row, aliases) {
  for (const key of aliases) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).length > 0) {
      return String(row[key]).trim();
    }
  }
  return '';
}

export async function fetchPrompts() {
  const response = await fetch(SHEET_CSV_URL, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} — 스프레드시트를 불러오지 못했습니다.`);
  }
  const csvText = await response.text();
  return parseCsv(csvText);
}

export function parseCsv(csvText) {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim()
  });

  return result.data
    .map((row, index) => ({
      no: pick(row, COLUMN_ALIASES.no) || String(index + 1),
      category: pick(row, COLUMN_ALIASES.category),
      name: pick(row, COLUMN_ALIASES.name),
      description: pick(row, COLUMN_ALIASES.description),
      ko: pick(row, COLUMN_ALIASES.ko),
      en: pick(row, COLUMN_ALIASES.en),
      rating: pick(row, COLUMN_ALIASES.rating),
      memo: pick(row, COLUMN_ALIASES.memo),
      updatedAt: pick(row, COLUMN_ALIASES.updatedAt)
    }))
    .filter((p) => p.name);
}
