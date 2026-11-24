// CSV export (RFC 4180) with a UTF-8 byte order mark so Excel opens units such as "m/s²" correctly.
// Filename: <id>-<yyyymmdd-hhmm>.csv in local time. Pure except downloadCSV().

const NEEDS_QUOTES = /[",\r\n]|^\s|\s$/;
const FORMULA_START = /^[=+\-@\t\r]/;

function cell(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return '';
    // 12 significant figures: keeps data honest and removes float noise like 0.30000000000000004.
    return String(Number(value.toPrecision(12)));
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  let s = String(value);
  // Guard against spreadsheet formula injection for text cells (numbers are written above, unquoted).
  if (FORMULA_START.test(s) && !/^[-+]?(\d|\.\d)/.test(s)) s = `'${s}`;
  return NEEDS_QUOTES.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * @param {{ columns: string[], rows: any[][] }} data
 * @param {{ bom?: boolean }} [opts]
 */
export function toCSV({ columns, rows }, { bom = true } = {}) {
  const lines = [columns.map(cell).join(',')];
  for (const row of rows) lines.push(row.map(cell).join(','));
  return (bom ? '﻿' : '') + lines.join('\r\n') + '\r\n';
}

const pad = (n) => String(n).padStart(2, '0');

export function csvFilename(id, date = new Date()) {
  const stamp = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
  return `${id}-${stamp}.csv`;
}

/** Browser only: download `data` as a CSV file. */
export function downloadCSV(id, data) {
  const blob = new Blob([toCSV(data)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = csvFilename(id);
  a.style.display = 'none';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return a.download;
}
