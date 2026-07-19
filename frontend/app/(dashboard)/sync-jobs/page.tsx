"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { StatusBadge, syncJobStatusToVariant } from "@/components/ui/StatusBadge";
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

function calculateDuration(startedAt?: string | null, completedAt?: string | null) {
  if (!startedAt || !completedAt) return "—";
  try {
    const start = new Date(startedAt).getTime();
    const end = new Date(completedAt).getTime();
    const diff = end - start;
    if (diff < 1000) return `${diff}ms`;
    return `${(diff / 1000).toFixed(2)}s`;
  } catch (e) {
    return "—";
  }
}

function SyncJobsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL state params
  const page = parseInt(searchParams.get("page") || "1", 10);
  const status = searchParams.get("status") || "";
  const integrationId = searchParams.get("integrationId") || "";
  const sort = searchParams.get("sort") || "desc";

  const limit = 10;
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  // Fetch Integrations list for filter dropdown
  const { data: integrations } = useQuery({
    queryKey: ["integrations-list-dropdown"],
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

  // Query Sync Jobs with active filters
  const {
    data: syncJobsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["sync-jobs", page, status, integrationId, sort],
    queryFn: () =>
      api.syncJobs.list({
        page,
        limit,
        status: status || undefined,
        integrationId: integrationId || undefined,
        sort: sort as "asc" | "desc",
      }),
  });

  const jobs = syncJobsData?.items || [];
  const pagination = syncJobsData?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };

  return (
    <div className="space-y-6 animate-fade-in text-[#e2e2eb]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold text-[#e2e2eb] tracking-tight">
            Sync Jobs
          </h1>
          <p className="text-[13px] text-[#c7c4d7]/70 mt-0.5">
            Operational execution log and debugging table for all integration synchronizations.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Integration Dropdown */}
          <select
            value={integrationId}
            onChange={(e) => updateUrlParams({ integrationId: e.target.value, page: 1 })}
            className="h-8 px-3 bg-[#1e1f26] border border-[#2a2d3e] rounded text-[12px] text-[#e2e2eb] focus:outline-none focus:border-[#6366f1] transition-colors"
          >
            <option value="">All Integrations</option>
            {integrations?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.type.toUpperCase()})
              </option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={status}
            onChange={(e) => updateUrlParams({ status: e.target.value, page: 1 })}
            className="h-8 px-3 bg-[#1e1f26] border border-[#2a2d3e] rounded text-[12px] text-[#e2e2eb] focus:outline-none focus:border-[#6366f1] transition-colors"
          >
            <option value="">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="PROCESSING">Processing</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>

          {/* Sort Dropdown */}
          <select
            value={sort}
            onChange={(e) => updateUrlParams({ sort: e.target.value, page: 1 })}
            className="h-8 px-3 bg-[#1e1f26] border border-[#2a2d3e] rounded text-[12px] text-[#e2e2eb] focus:outline-none focus:border-[#6366f1] transition-colors"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>

          {/* Clear Filters Button */}
          {(status || integrationId || sort !== "desc" || page !== 1) && (
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
              <div className="h-6 bg-[#2a2d3e] rounded w-full"></div>
            </div>
          ) : isError ? (
            <div className="p-8 text-center space-y-3">
              <AlertTriangle className="mx-auto text-[#f43f5e]" size={28} />
              <p className="text-[14px] font-semibold text-[#f43f5e]">
                Failed to load sync jobs log
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
          ) : jobs.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <RefreshCw className="mx-auto text-[#6b7280]" size={32} />
              <p className="text-[14px] font-semibold text-[#e2e2eb]">No Sync Jobs Found</p>
              <p className="text-[12px] text-[#6b7280]">
                {status || integrationId
                  ? "No sync jobs match the selected filter criteria."
                  : "No synchronization jobs have been recorded."}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-[13px] border-collapse">
              <thead className="bg-[#191b22] text-[#c7c4d7] border-b border-[#2a2d3e]">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">JOB ID</th>
                  <th className="px-4 py-2.5 font-semibold">INTEGRATION</th>
                  <th className="px-4 py-2.5 font-semibold">RESOURCE</th>
                  <th className="px-4 py-2.5 font-semibold">STATUS</th>
                  <th className="px-4 py-2.5 font-semibold">PROCESSED</th>
                  <th className="px-4 py-2.5 font-semibold">FAILED</th>
                  <th className="px-4 py-2.5 font-semibold">RETRIES</th>
                  <th className="px-4 py-2.5 font-semibold">DURATION</th>
                  <th className="px-4 py-2.5 font-semibold">STARTED AT</th>
                  <th className="px-4 py-2.5 font-semibold">DETAILS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2d3e]/50">
                {jobs.map((job) => {
                  const isExpanded = expandedJobId === job.id;
                  return (
                    <tr key={job.id} className="group">
                      <td colSpan={10} className="p-0">
                        <div
                          className={`flex items-center px-4 py-3 h-11 hover:bg-[#191b22] transition-colors cursor-pointer ${
                            isExpanded ? "bg-[#191b22]" : ""
                          }`}
                          onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                        >
                          <div className="w-full grid grid-cols-10 gap-2 items-center text-[12px]">
                            {/* Job ID */}
                            <span className="font-mono text-[#c0c1ff] font-medium truncate">
                              {job.id.substring(0, 8)}...
                            </span>

                            {/* Integration */}
                            <span className="font-medium text-[#e2e2eb] truncate">
                              {job.integration?.name || "System"}
                            </span>

                            {/* Resource Type */}
                            <span>
                              <span className="px-1.5 py-0.5 bg-[#33343b] text-[#c7c4d7] rounded font-mono text-[10px]">
                                {job.resourceType || "All"}
                              </span>
                            </span>

                            {/* Status */}
                            <div>
                              <StatusBadge status={syncJobStatusToVariant(job.status)} />
                            </div>

                            {/* Processed */}
                            <span className="font-mono text-[#10b981]">{job.recordsProcessed}</span>

                            {/* Failed */}
                            <span
                              className={`font-mono ${
                                job.recordsFailed > 0 ? "text-[#f43f5e] font-bold" : "text-[#6b7280]"
                              }`}
                            >
                              {job.recordsFailed}
                            </span>

                            {/* Retries */}
                            <span className="font-mono text-[#6b7280]">{job.retryCount}</span>

                            {/* Duration */}
                            <span className="font-mono text-[#c7c4d7]">
                              {calculateDuration(job.startedAt, job.completedAt)}
                            </span>

                            {/* Started At */}
                            <span className="font-mono text-[11px] text-[#6b7280] truncate">
                              {formatDate(job.startedAt)}
                            </span>

                            {/* Expand toggle icon */}
                            <div className="flex justify-end pr-2 text-[#6b7280] group-hover:text-[#e2e2eb]">
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                          </div>
                        </div>

                        {/* Expanded Details Drawer */}
                        {isExpanded && (
                          <div className="bg-[#111319] border-t border-[#2a2d3e] p-4 text-[12px] space-y-3 animate-fade-in">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <span className="text-[10px] text-[#6b7280] uppercase block">
                                  Full Job UUID
                                </span>
                                <span className="font-mono text-[#c0c1ff]">{job.id}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-[#6b7280] uppercase block">
                                  Integration ID
                                </span>
                                <span className="font-mono text-[#c7c4d7]">{job.integrationId}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-[#6b7280] uppercase block">
                                  Completed At
                                </span>
                                <span className="font-mono text-[#c7c4d7]">
                                  {formatDate(job.completedAt)}
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] text-[#6b7280] uppercase block">
                                  Retry Attempts
                                </span>
                                <span className="font-mono text-[#c7c4d7]">{job.retryCount} / 3</span>
                              </div>
                            </div>

                            {job.errorMessage ? (
                              <div className="p-3 bg-[#f43f5e]/10 border border-[#f43f5e]/20 rounded font-mono text-[11px] text-[#f43f5e] space-y-1">
                                <span className="font-bold text-[10px] uppercase block">
                                  Execution Failure Message:
                                </span>
                                <div>{job.errorMessage}</div>
                              </div>
                            ) : (
                              <div className="p-2 bg-[#10b981]/5 border border-[#10b981]/10 rounded text-[11px] text-[#10b981]">
                                Execution finished successfully with zero failures recorded.
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

        {/* Pagination Footer */}
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

export default function SyncJobsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 space-y-4 animate-pulse">
          <div className="h-8 bg-[#2a2d3e] rounded w-1/3"></div>
          <div className="h-64 bg-[#2a2d3e] rounded w-full"></div>
        </div>
      }
    >
      <SyncJobsContent />
    </Suspense>
  );
}
