export function formatMs(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return `${val.toLocaleString(undefined, { maximumFractionDigits: 1 })} ms`;
}

export function formatCls(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return val.toFixed(3);
}

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || isNaN(bytes)) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatDelta(val: number | null | undefined, unit: string = ''): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  if (val === 0) return '0';
  const prefix = val > 0 ? '-' : '+';
  return `${prefix}${Math.abs(val).toLocaleString(undefined, { maximumFractionDigits: 1 })}${unit ? ` ${unit}` : ''}`;
}

export function formatMetricWithUnit(val: number, unit: string): string {
  if (unit === 's') return `${(val / 1000).toFixed(2)} s`;
  if (unit === 'unitless') return formatCls(val);
  return formatMs(val);
}
