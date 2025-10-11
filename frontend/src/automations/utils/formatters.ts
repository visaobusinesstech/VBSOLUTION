export const fmtDuration = (ms: number) => {
  if (!ms && ms !== 0) return '—';
  if (ms < 1000) return `${ms} ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(2)} s`;
  const m = Math.floor(s / 60);
  const rem = Math.round(s % 60);
  return `${m}m ${rem}s`;
};

export const fmtPct = (p: number) => `${Math.round((p || 0) * 1000) / 10}%`;

export const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleString() : '—');
