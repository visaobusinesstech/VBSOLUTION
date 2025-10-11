// Tipo básico para status de automações
export type AutomationStatus = 'active' | 'inactive' | 'draft';

// Interface para estatísticas de execução
export interface ExecStats {
  totalRuns: number;        // all-time or trailing window (see query)
  successRuns: number;
  failedRuns: number;
  avgDurationMs: number;    // average of last N runs (server-calculated)
  p50DurationMs?: number;
  p95DurationMs?: number;
  lastRunAt?: string;       // ISO
  lastStatus?: 'success' | 'failed' | 'running' | 'queued' | 'never';
  timeSavedHours?: number;  // optional metric (server supplied)
}

// Interface principal para um item de automação na lista
export interface AutomationListItem {
  id: string;
  name: string;
  tags?: string[];
  owner?: { id: string; name: string; avatarUrl?: string };
  status: AutomationStatus;
  createdAt: string;  // ISO
  updatedAt: string;  // ISO
  schedule?: 'manual' | 'webhook' | 'cron' | 'event';
  stats: ExecStats;
}

// Query parameters para busca e filtros
export interface AutomationsQuery {
  q?: string;                 // search text
  status?: AutomationStatus | 'all';
  sortBy?: 'updatedAt' | 'createdAt' | 'name' | 'runs' | 'avgDuration' | 'failureRate';
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  window?: '7d' | '30d' | 'all';   // time window for stats aggregation
}

// Response da API de listagem
export interface AutomationsListResponse {
  items: AutomationListItem[];
  total: number;
  page: number;
  pageSize: number;
  window: AutomationsQuery['window'];
  // summary for top cards:
  summary: {
    prodExecutions: number;
    failedProdExecutions: number;
    failureRate: number;      // 0..1
    avgRunTimeMs: number;
    timeSavedHours?: number;
  };
}

// Use this for reuse and additions
export * from './AutomationsGrid';
