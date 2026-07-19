"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Filter,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
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

function categoryBadgeColor(category: string) {
  switch (category) {
    case "VALIDATION_ERROR":
      return "bg-amber-400/10 text-amber-400 border-amber-400/20";
    case "EXTERNAL_API_ERROR":
      return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    case "AUTHENTICATION_ERROR":
      return "bg-purple-500/10 text-purple-300 border-purple-500/20";
    default:
      return "bg-[#33343b] text-[#c7c4d7] border-[#2a2d3e]";
  }
}

function sourceTypeBadgeColor(source: string) {
  switch (source) {
    case "SYNC_JOB":
      return "bg-[#6366f1]/10 text-[#c0c1ff] border-[#6366f1]/20";
    case "WORKFLOW":
      return "bg-purple-500/10 text-purple-300 border-purple-500/20";
    case "NOTIFICATION":
      return "bg-amber-400/10 text-amber-300 border-amber-400/20";
    default:
      return "bg-[#33343b] text-[#c7c4d7] border-[#2a2d3e]";
  }
}

function FailuresContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL state params
  const page = parseInt(searchParams.get("page") || "1", 10);
  const sourceType = searchParams.get("sourceType") || "";
  const integration = searchParams.get("integration") || "";

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const limit = 10;

  // Fetch integrations for filter
  const { data: integrations } = useQuery({
    queryKey: ["integrations-list-dropdown-failures"],
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

  // Fetch Unified Failures
  const {
    data: failuresData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["failures-list", page, sourceType, integration],
    queryFn: () =>
      api.monitoring.failures({
        page,
        limit,
        sourceType: sourceType || undefined,
        integration: integration || undefined,
      }),
  });

  const failures = failuresData?.items || [];
  const pagination = failuresData?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };

  return (
    <div className="space-y-6 animate-fade-in text-[#e2e2eb]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold text-[#e2e2eb] tracking-tight flex items-center gap-2">
            <ShieldAlert className="text-[#f43f5e]" size={20} />
            Unified Failures
          </h1>
          <p className="text-[13px] text-[#c7c4d7]/70 mt-0.5">
            Normalized error tracking across sync jobs, workflow executions, and outbound messaging.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Source Type Filter */}
          <select
            value={sourceType}
            onChange={(e) => updateUrlParams({ sourceType: e.target.value, page: 1 })}
            className="h-8 px-3 bg-[#1e1f26] border border-[#2a2d3e] rounded text-[12px] text-[#e2e2eb] focus:outline-none focus:border-[#6366f1] transition-colors"
          >
            <option value="">All Source Types</option>
            <option value="SYNC_JOB">Sync Jobs</option>
            <option value="WORKFLOW">Workflows</option>
            <option value="NOTIFICATION">Notifications</option>
          </select>

          {/* Integration Filter */}
          <select
            value={integration}
            onChange={(e) => updateUrlParams({ integration: e.target.value, page: 1 })}
            className="h-8 px-3 bg-[#1e1f26] border border-[#2a2d3e] rounded text-[12px] text-[#e2e2eb] focus:outline-none focus:border-[#6366f1] transition-colors"
          >
            <option value="">All Integrations</option>
            {integrations?.map((item) => (
              <option key={item.id} value={item.type}>
                {item.name} ({item.type.toUpperCase()})
              </option>
            ))}
          </select>

          {/* Reset Filters */}
          {(sourceType || integration || page !== 1) && (
            <button
              onClick={() => router.push(pathname)}
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
                Failed to load failure events
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
          ) : failures.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <CheckCircle2 className="mx-auto text-[#10b981]" size={36} />
              <p className="text-[15px] font-semibold text-[#e2e2eb]">
                {sourceType || integration
                  ? "No failures match your filter criteria."
                  : "No failures detected."}
              </p>
              <p className="text-[12px] text-[#6b7280]">
                All integration pipelines and workflows are executing cleanly.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-[13px] border-collapse">
              <thead className="bg-[#191b22] text-[#c7c4d7] border-b border-[#2a2d3e]">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">SOURCE TYPE</th>
                  <th className="px-4 py-2.5 font-semibold">INTEGRATION</th>
                  <th className="px-4 py-2.5 font-semibold">OPERATION</th>
                  <th className="px-4 py-2.5 font-semibold">ERROR CATEGORY</th>
                  <th className="px-4 py-2.5 font-semibold">ERROR SUMMARY</th>
                  <th className="px-4 py-2.5 font-semibold">TIMESTAMP</th>
                  <th className="px-4 py-2.5 font-semibold">RETRIES</th>
                  <th className="px-4 py-2.5 font-semibold">DETAILS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2d3e]/50">
                {failures.map((item) => {
                  const isExpanded = expandedId === item.id;
                  return (
                    <tr key={item.id} className="group">
                      <td colSpan={8} className="p-0">
                        <div
                          className={`flex items-center px-4 py-3 h-11 hover:bg-[#191b22] transition-colors cursor-pointer ${
                            isExpanded ? "bg-[#191b22]" : ""
                          }`}
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        >
                          <div className="w-full grid grid-cols-8 gap-2 items-center text-[12px]">
                            {/* Source Type */}
                            <div>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${sourceTypeBadgeColor(
                                  item.sourceType
                                )}`}
                              >
                                {item.sourceType}
                              </span>
                            </div>

                            {/* Integration */}
                            <span className="font-medium text-[#e2e2eb] truncate">
                              {item.integration.toUpperCase()}
                            </span>

                            {/* Operation */}
                            <span>
                              <span className="px-1.5 py-0.5 bg-[#33343b] text-[#c7c4d7] rounded font-mono text-[10px]">
                                {item.operation}
                              </span>
                            </span>

                            {/* Error Category */}
                            <div>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono border ${categoryBadgeColor(
                                  item.errorCategory
                                )}`}
                              >
                                {item.errorCategory}
                              </span>
                            </div>

                            {/* Error Summary */}
                            <span className="font-mono text-[11px] text-[#f43f5e] truncate font-medium">
                              {item.errorSummary}
                            </span>

                            {/* Timestamp */}
                            <span className="font-mono text-[11px] text-[#6b7280] truncate">
                              {formatDate(item.timestamp)}
                            </span>

                            {/* Retries */}
                            <span className="font-mono text-[#6b7280]">{item.retryCount}</span>

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
                                  Failure Event ID
                                </span>
                                <span className="font-mono text-[#c0c1ff]">{item.id}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-[#6b7280] uppercase block">
                                  Related Resource ID
                                </span>
                                <span className="font-mono text-[#c7c4d7]">
                                  {item.relatedResourceId || "N/A"}
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] text-[#6b7280] uppercase block">
                                  Error Category
                                </span>
                                <span className="font-mono text-[#f43f5e] font-bold">
                                  {item.errorCategory}
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] text-[#6b7280] uppercase block">
                                  Cross Navigation
                                </span>
                                {item.sourceType === "SYNC_JOB" ? (
                                  <Link
                                    href={`/sync-jobs?status=FAILED`}
                                    className="text-[11px] text-[#6366f1] hover:underline flex items-center gap-1 font-medium"
                                  >
                                    Inspect Sync Jobs <ExternalLink size={12} />
                                  </Link>
                                ) : (
                                  <Link
                                    href={`/logs?status=FAILED`}
                                    className="text-[11px] text-[#6366f1] hover:underline flex items-center gap-1 font-medium"
                                  >
                                    Inspect Audit Logs <ExternalLink size={12} />
                                  </Link>
                                )}
                              </div>
                            </div>

                            <div className="p-3 bg-[#f43f5e]/10 border border-[#f43f5e]/20 rounded font-mono text-[11px] text-[#f43f5e] space-y-1">
                              <span className="font-bold text-[10px] uppercase block">
                                Diagnostic Summary:
                              </span>
                              <div>{item.errorSummary}</div>
                            </div>
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

export default function FailuresPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 space-y-4 animate-pulse">
          <div className="h-8 bg-[#2a2d3e] rounded w-1/3"></div>
          <div className="h-64 bg-[#2a2d3e] rounded w-full"></div>
        </div>
      }
    >
      <FailuresContent />
    </Suspense>
  );
}
