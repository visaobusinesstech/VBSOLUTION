import { AutomationsListResponse, AutomationsQuery } from '../../types/automations';
import { fetchWithFallback } from '../../lib/apiHelpers';

export async function fetchAutomations(query: AutomationsQuery): Promise<AutomationsListResponse> {
  const params = new URLSearchParams({
    q: query.q ?? '',
    status: query.status ?? 'all',
    sortBy: query.sortBy ?? 'updatedAt',
    sortDir: query.sortDir ?? 'desc',
    page: String(query.page ?? 1),
    pageSize: String(query.pageSize ?? 20),
    window: query.window ?? '7d',
  });

  // Dados mock para fallback
  const mockData: AutomationsListResponse = {
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    window: '7d',
    summary: {
      prodExecutions: 0,
      failedProdExecutions: 0,
      failureRate: 0,
      avgRunTimeMs: 0,
      timeSavedHours: 0
    }
  };

  return fetchWithFallback(
    `/api/automations?${params.toString()}`,
    { cache: 'no-store' },
    mockData
  );
}
