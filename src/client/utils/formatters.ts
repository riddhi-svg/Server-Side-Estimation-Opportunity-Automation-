export function formatMs(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return `${val.toLocaleString(undefined, { maximumFractionDigits: 2 })} ms`;
}

export function formatCls(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return Number(val.toFixed(2)).toString();
}

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || isNaN(bytes)) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatDelta(val: number | null | undefined, unit: string = ''): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  if (Math.abs(val) < 0.01) return '0';
  const prefix = val > 0 ? '-' : '+';
  return `${prefix}${Math.abs(val).toLocaleString(undefined, { maximumFractionDigits: 2 })}${unit ? ` ${unit}` : ''}`;
}


export function formatMetricWithUnit(val: number, unit: string): string {
  if (unit === 's') return `${(val / 1000).toFixed(2)} s`;
  if (unit === 'unitless') return formatCls(val);
  return formatMs(val);
}

export function cleanMetricDisplay(val?: string | number | null): string {
  if (val === null || val === undefined || val === '') return '—';
  if (typeof val === 'number') {
    return isNaN(val) ? '—' : Number(val.toFixed(2)).toString();
  }
  let s = String(val);
  if (/^-0(\.0+)?(\s.*)?$/.test(s)) {
    s = s.replace(/^-0(\.0+)?/, '0');
  }
  return s.replace(/-?\d+\.\d+/g, (m) => Number(parseFloat(m).toFixed(2)).toString());
}

