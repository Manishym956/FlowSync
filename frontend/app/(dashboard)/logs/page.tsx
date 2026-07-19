"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  ScrollText,
  Search,
  Filter,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { StatusBadge, logStatusToVariant } from "@/components/ui/StatusBadge";
import { IntegrationTypeBadge } from "@/components/ui/IntegrationTypeBadge";
import { Pagination } from "@/components/ui/Pagination";

function formatDate(isoString?: string | null) {
  if (!isoString) return "—";
  try {
    return new Date(isoString).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch (e) {
    return isoString;
  }
}

function LogsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL search params
  const page = parseInt(searchParams.get("page") || "1", 10);
  const status = searchParams.get("status") || "";
  const operation = searchParams.get("operation") || "";
  const integrationId = searchParams.get("integrationId") || "";
  const search = searchParams.get("search") || "";

  const [searchInput, setSearchInput] = useState(search);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const limit = 10;

  // Sync internal search input with URL search param
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Fetch integrations list for dropdown
  const { data: integrations } = useQuery({
    queryKey: ["integrations-list-dropdown-logs"],
    queryFn: api.integrations.list,
  });

  // Helper to update URL params
  const updateUrlParams = (updates: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "" || value === undefined) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  // Handle search submit / keydown
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrlParams({ search: searchInput, page: 1 });
  };

  // Fetch Audit Logs
  const {
    data: logsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["audit-logs", page, status, operation, integrationId, search],
    queryFn: () =>
      api.monitoring.logs({
        page,
        limit,
        status: status || undefined,
        operation: operation || undefined,
        integrationId: integrationId || undefined,
        search: search || undefined,
      }),
  });

  const logs = logsData?.items || [];
  const pagination = logsData?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };

  return (
    <div className="space-y-6 animate-fade-in text-[#e2e2eb]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold text-[#e2e2eb] tracking-tight flex items-center gap-2">
            <ScrollText className="text-[#6366f1]" size={20} />
            Audit Logs
          </h1>
          <p className="text-[13px] text-[#c7c4d7]/70 mt-0.5">
            Structured audit trail and technical log explorer across integrations and operations.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative w-56">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]"
            />
            <input
              type="text"
              placeholder="Search errors/logs..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full h-8 pl-8 pr-3 bg-[#1e1f26] border border-[#2a2d3e] rounded text-[12px] text-[#e2e2eb] placeholder-[#6b7280] focus:outline-none focus:border-[#6366f1] transition-colors"
            />
          </form>

          {/* Integration Filter */}
          <select
            value={integrationId}
            onChange={(e) => updateUrlParams({ integrationId: e.target.value, page: 1 })}
            className="h-8 px-3 bg-[#1e1f26] border border-[#2a2d3e] rounded text-[12px] text-[#e2e2eb] focus:outline-none focus:border-[#6366f1] transition-colors"
          >
            <option value="">All Integrations</option>
            {integrations?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          {/* Operation Filter */}
          <select
            value={operation}
            onChange={(e) => updateUrlParams({ operation: e.target.value, page: 1 })}
            className="h-8 px-3 bg-[#1e1f26] border border-[#2a2d3e] rounded text-[12px] text-[#e2e2eb] focus:outline-none focus:border-[#6366f1] transition-colors"
          >
            <option value="">All Operations</option>
            <option value="SYNC">SYNC</option>
            <option value="WEBHOOK">WEBHOOK</option>
            <option value="NOTIFICATION">NOTIFICATION</option>
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => updateUrlParams({ status: e.target.value, page: 1 })}
            className="h-8 px-3 bg-[#1e1f26] border border-[#2a2d3e] rounded text-[12px] text-[#e2e2eb] focus:outline-none focus:border-[#6366f1] transition-colors"
          >
            <option value="">All Statuses</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="RETRYING">RETRYING</option>
            <option value="FAILED">FAILED</option>
          </select>

          {/* Reset Filters */}
          {(status || operation || integrationId || search || page !== 1) && (
            <button
              onClick={() => {
                setSearchInput("");
                router.push(pathname);
              }}
              className="h-8 px-2.5 bg-[#33343b] text-[#c7c4d7] hover:text-[#e2e2eb] rounded text-[11px] font-medium transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-[#1e1f26] border border-[#2a2d3e] rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 space-y-4 animate-pulse">
              <div className="h-6 bg-[#2a2d3e] rounded w-full"></div>
              <div className="h-6 bg-[#2a2d3e] rounded w-full"></div>
              <div className="h-6 bg-[#2a2d3e] rounded w-full"></div>
            </div>
          ) : isError ? (
            <div className="p-8 text-center space-y-3">
              <AlertTriangle className="mx-auto text-[#f43f5e]" size={28} />
              <p className="text-[14px] font-semibold text-[#f43f5e]">
                Failed to load audit logs
              </p>
              <p className="text-[12px] text-[#c7c4d7]">
                {(error as Error)?.message || "A network error occurred."}
              </p>
              <button
                onClick={() => refetch()}
                className="px-4 py-1.5 bg-[#6366f1] text-white rounded text-[12px] font-medium hover:bg-[#5558e3] transition-colors"
              >
                Retry
              </button>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <ScrollText className="mx-auto text-[#6b7280]" size={32} />
              <p className="text-[14px] font-semibold text-[#e2e2eb]">
                {status || operation || integrationId || search
                  ? "No audit logs match these filters."
                  : "No audit logs recorded."}
              </p>
              <p className="text-[12px] text-[#6b7280]">
                Audit entries are generated automatically as operations execute.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-[13px] border-collapse">
              <thead className="bg-[#191b22] text-[#c7c4d7] border-b border-[#2a2d3e]">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">TIMESTAMP</th>
                  <th className="px-4 py-2.5 font-semibold">INTEGRATION</th>
                  <th className="px-4 py-2.5 font-semibold">OPERATION</th>
                  <th className="px-4 py-2.5 font-semibold">STATUS</th>
                  <th className="px-4 py-2.5 font-semibold">LATENCY</th>
                  <th className="px-4 py-2.5 font-semibold">RETRIES</th>
                  <th className="px-4 py-2.5 font-semibold">ERROR / SUMMARY</th>
                  <th className="px-4 py-2.5 font-semibold">DETAILS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2d3e]/50">
                {logs.map((log) => {
                  const isExpanded = expandedId === log.id;
                  return (
                    <tr key={log.id} className="group">
                      <td colSpan={8} className="p-0">
                        <div
                          className={`flex items-center px-4 py-3 h-11 hover:bg-[#191b22] transition-colors cursor-pointer ${
                            isExpanded ? "bg-[#191b22]" : ""
                          }`}
                          onClick={() => setExpandedId(isExpanded ? null : log.id)}
                        >
                          <div className="w-full grid grid-cols-8 gap-2 items-center text-[12px]">
                            {/* Timestamp */}
                            <span className="font-mono text-[11px] text-[#6b7280] truncate">
                              {formatDate(log.createdAt)}
                            </span>

                            {/* Integration */}
                            <span className="font-medium text-[#e2e2eb] truncate">
                              {log.integration?.name || "System"}
                            </span>

                            {/* Operation */}
                            <span>
                              <span className="px-1.5 py-0.5 bg-[#33343b] text-[#c7c4d7] rounded font-mono text-[10px]">
                                {log.operation}
                              </span>
                            </span>

                            {/* Status */}
                            <div>
                              <StatusBadge status={logStatusToVariant(log.status)} />
                            </div>

                            {/* Latency */}
                            <span className="font-mono text-[#c0c1ff]">
                              {log.latency !== null && log.latency !== undefined
                                ? `${log.latency}ms`
                                : "—"}
                            </span>

                            {/* Retries */}
                            <span className="font-mono text-[#6b7280]">{log.retryCount}</span>

                            {/* Error Summary */}
                            <span
                              className={`truncate font-mono text-[11px] ${
                                log.errorMessage ? "text-[#f43f5e]" : "text-[#6b7280]"
                              }`}
                            >
                              {log.errorMessage || "Operation successful"}
                            </span>

                            {/* Expand icon */}
                            <div className="flex justify-end pr-2 text-[#6b7280] group-hover:text-[#e2e2eb]">
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                          </div>
                        </div>

                        {/* Expanded Drawer */}
                        {isExpanded && (
                          <div className="bg-[#111319] border-t border-[#2a2d3e] p-4 text-[12px] space-y-3 animate-fade-in">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <span className="text-[10px] text-[#6b7280] uppercase block">
                                  Log Entry UUID
                                </span>
                                <span className="font-mono text-[#c0c1ff]">{log.id}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-[#6b7280] uppercase block">
                                  Integration ID
                                </span>
                                <span className="font-mono text-[#c7c4d7]">{log.integrationId}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-[#6b7280] uppercase block">
                                  Operation
                                </span>
                                <span className="font-mono text-[#e2e2eb]">{log.operation}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-[#6b7280] uppercase block">
                                  Latency
                                </span>
                                <span className="font-mono text-[#c0c1ff]">
                                  {log.latency !== null ? `${log.latency}ms` : "N/A"}
                                </span>
                              </div>
                            </div>

                            {log.errorMessage ? (
                              <div className="p-3 bg-[#f43f5e]/10 border border-[#f43f5e]/20 rounded font-mono text-[11px] text-[#f43f5e] space-y-1">
                                <span className="font-bold text-[10px] uppercase block">
                                  Error Message / Diagnostic Summary:
                                </span>
                                <div>{log.errorMessage}</div>
                              </div>
                            ) : (
                              <div className="p-2 bg-[#10b981]/5 border border-[#10b981]/10 rounded text-[11px] text-[#10b981]">
                                Audit entry recorded cleanly with zero errors.
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && !isError && pagination.totalPages > 0 && (
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={(newPage) => updateUrlParams({ page: newPage })}
          />
        )}
      </div>
    </div>
  );
}

export default function LogsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 space-y-4 animate-pulse">
          <div className="h-8 bg-[#2a2d3e] rounded w-1/3"></div>
          <div className="h-64 bg-[#2a2d3e] rounded w-full"></div>
        </div>
      }
    >
      <LogsContent />
    </Suspense>
  );
}
