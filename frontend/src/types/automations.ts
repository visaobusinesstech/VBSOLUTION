export type AutomationStatus = 'active' | 'inactive' | 'draft';

export interface ExecStats {
  totalRuns: number;        
  successRuns: number;
  failedRuns: number;
  avgDurationMs: number;    
  p50DurationMs?: number;
  p95DurationMs?: number;
  lastRunAt?: string;       
  lastStatus?: 'success' | 'failed' | 'running' | 'queued' | 'never';
  timeSavedHours?: number;  
}

export interface AutomationListItem {
  id: string;
  name: string;
  tags?: string[];
  owner?: { id: string; name: string; avatarUrl?: string };
  status: AutomationStatus;
  createdAt: string;  
  updatedAt: string;  
  schedule?: 'manual' | 'webhook' | 'cron' | 'event';
  stats: ExecStats;
}

export interface AutomationsQuery {
  q?: string;
  status?: AutomationStatus | 'all';
  sortBy?: 'updatedAt' | 'createdAt' | 'name' | 'runs' | 'avgDuration' | 'failureRate';
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  window?: '7d' | '30d' | 'all';
}

export interface AutomationsListResponse {
  items: AutomationListItem[];
  total: number;
  page: number;
  pageSize: number;
  window: AutomationsQuery['window'];
  summary: {
    prodExecutions: number;
    failedProdExecutions: number;
    failureRate: number;
    avgRunTimeMs: number;
    timeSavedHours?: number;
  };
}
