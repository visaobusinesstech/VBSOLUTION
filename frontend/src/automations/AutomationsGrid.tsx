'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AutomationsListResponse, AutomationsQuery, AutomationListItem } from './types';
import { fetchAutomations } from './api/fetchAutomations';
import { fmtDate, fmtDuration, fmtPct } from './utils/formatters';

export default function AutomationsGrid() {
  const navigate = useNavigate();
  
  const [query, setQuery] = useState<AutomationsQuery>({
    q: '',
    status: 'all',
    sortBy: 'updatedAt',
    sortDir: 'desc',
    page: 1,
    pageSize: 20,
    window: '7d',
  });
  const [data, setData] = useState<AutomationsListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    
    fetchAutomations(query)
      .then((res) => { 
        if (alive) { 
          setData(res); 
          setError(null); 
        } 
      })
      .catch((e) => { 
        if (alive) {
          console.warn('Erro ao carregar automações:', e.message);
          setError('Não foi possível carregar as automações. Usando dados mock.');
          // Definir dados mock em caso de erro
          setData({
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
          });
        }
      })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [JSON.stringify(query)]);

  const summary = data?.summary;

  return (
    <div className="mt-[64px] p-4 space-y-4">

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title={`Prod. executions (${query.window})`} value={summary?.prodExecutions ?? 0} />
        <SummaryCard title={`Failed prod. executions (${query.window})`} value={summary?.failedProdExecutions ?? 0} />
        <SummaryCard title="Failure rate" value={fmtPct(summary?.failureRate ?? 0)} />
        <SummaryCard title="Run time (avg)" value={fmtDuration(summary?.avgRunTimeMs ?? 0)} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          className="h-9 px-3 rounded-lg border border-black/10"
          placeholder="Search automations…"
          value={query.q ?? ''}
          onChange={(e) => setQuery((q) => ({ ...q, q: e.target.value, page: 1 }))}
        />
        <Select
          label="Status"
          value={query.status ?? 'all'}
          onChange={(v) => setQuery((q) => ({ ...q, status: v as any, page: 1 }))}
          options={[
            { label: 'All', value: 'all' },
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
            { label: 'Draft', value: 'draft' },
          ]}
        />
        <Select
          label="Window"
          value={query.window ?? '7d'}
          onChange={(v) => setQuery((q) => ({ ...q, window: v as any, page: 1 }))}
          options={[{label:'7 days', value:'7d'},{label:'30 days', value:'30d'},{label:'All time', value:'all'}]}
        />
        <Select
          label="Sort"
          value={`${query.sortBy}:${query.sortDir}`}
          onChange={(v) => {
            const [sortBy, sortDir] = v.split(':') as any;
            setQuery((q) => ({ ...q, sortBy, sortDir }));
          }}
          options={[
            { label: 'Updated desc', value: 'updatedAt:desc' },
            { label: 'Updated asc',  value: 'updatedAt:asc' },
            { label: 'Name A→Z',     value: 'name:asc' },
            { label: 'Most runs',    value: 'runs:desc' },
            { label: 'Avg duration', value: 'avgDuration:desc' },
            { label: 'Failure rate', value: 'failureRate:desc' },
          ]}
        />
        {loading && <span className="text-sm text-gray-500">Loading…</span>}
        {error && <span className="text-sm text-red-600">Error: {error}</span>}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-black/10 bg-white">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <Th>Name</Th>
              <Th>Status</Th>
              <Th className="text-right">Runs</Th>
              <Th className="text-right">Success</Th>
              <Th className="text-right">Failed</Th>
              <Th className="text-right">Failure rate</Th>
              <Th className="text-right">Avg duration</Th>
              <Th>Last run</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((a) => (
              <Row key={a.id} a={a} />
            ))}
            {(!data || data.items.length === 0) && (
              <tr>
                <td colSpan={9} className="p-6 text-center text-gray-500">No automations found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          Page {data?.page ?? 1} of {data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1} • {data?.total ?? 0} total
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 rounded border border-black/10 disabled:opacity-50"
            disabled={(data?.page ?? 1) <= 1}
            onClick={() => setQuery((q) => ({ ...q, page: Math.max(1, (q.page ?? 1) - 1) }))}
          >
            Prev
          </button>
          <button
            className="px-3 py-1 rounded border border-black/10 disabled:opacity-50"
            disabled={!data || (data.page * data.pageSize) >= data.total}
            onClick={() => setQuery((q) => ({ ...q, page: (q.page ?? 1) + 1 }))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value }: { title: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-4">
      <div className="text-xs text-gray-500 mb-1">{title}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function Th(props: React.HTMLAttributes<HTMLTableCellElement>) {
  return <th {...props} className={`px-3 py-2 text-left font-semibold ${props.className ?? ''}`} />;
}

function StatusPill({ status }: { status: 'active' | 'inactive' | 'draft' }) {
  const map = {
    active:  'bg-green-100 text-green-700',
    inactive:'bg-gray-100 text-gray-700',
    draft:   'bg-indigo-100 text-indigo-700',
  } as const;
  return <span className={`px-2 py-1 rounded-full text-xs ${map[status]}`}>{status}</span>;
}

function Dot({ color }: { color: string }) {
  return <span className="inline-block w-2 h-2 rounded-full" style={{ background: color }} />;
}

function Row({ a }: { a: AutomationListItem }) {
  const failureRate = (a.stats.failedRuns || 0) / Math.max(1, a.stats.totalRuns || 0);
  const lastColor =
    a.stats.lastStatus === 'success' ? '#16a34a' :
    a.stats.lastStatus === 'failed'  ? '#dc2626' :
    a.stats.lastStatus === 'running' ? '#2563eb' :
    a.stats.lastStatus === 'queued'  ? '#f59e0b' : '#9ca3af';

  return (
    <tr className="border-t border-black/5 hover:bg-gray-50/50">
      <td className="px-3 py-2">
        <div className="font-medium">{a.name}</div>
        <div className="text-xs text-gray-500">
          {a.schedule ?? 'manual'} • updated {fmtDate(a.updatedAt)}
        </div>
      </td>
      <td className="px-3 py-2"><StatusPill status={a.status} /></td>
      <td className="px-3 py-2 text-right tabular-nums">{a.stats.totalRuns}</td>
      <td className="px-3 py-2 text-right tabular-nums">{a.stats.successRuns}</td>
      <td className="px-3 py-2 text-right tabular-nums">{a.stats.failedRuns}</td>
      <td className="px-3 py-2 text-right tabular-nums">{fmtPct(failureRate)}</td>
      <td className="px-3 py-2 text-right tabular-nums">{fmtDuration(a.stats.avgDurationMs)}</td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <Dot color={lastColor} />
          <span className="text-xs text-gray-600">{fmtDate(a.stats.lastRunAt)}</span>
        </div>
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <button className="px-2 py-1 rounded border border-black/10" onClick={() => navigate(`/automations/${a.id}`)}>Open</button>
          <button className="px-2 py-1 rounded border border-black/10">Execute</button>
          <button className="px-2 py-1 rounded border border-black/10">⋮</button>
        </div>
      </td>
    </tr>
  );
}

function Select({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <label className="text-sm text-gray-700 flex items-center gap-2">
      <span className="text-gray-600">{label}</span>
      <select
        className="h-9 px-2 rounded-lg border border-black/10 bg-white"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
