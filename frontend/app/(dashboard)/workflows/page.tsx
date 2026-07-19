"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  GitBranch,
  Filter,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  XCircle,
  PlayCircle,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Pagination } from "@/components/ui/Pagination";
import type { StatusVariant } from "@/lib/types";

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

function workflowStatusToVariant(status: string): StatusVariant {
  switch (status?.toUpperCase()) {
    case "COMPLETED":
      return "healthy";
    case "RUNNING":
      return "syncing";
    case "PENDING":
      return "pending";
    case "FAILED":
      return "failed";
    default:
      return "pending";
  }
}

function WorkflowsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL state params
  const page = parseInt(searchParams.get("page") || "1", 10);
  const status = searchParams.get("status") || "";
  const eventType = searchParams.get("eventType") || "";

  const limit = 10;
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  // Fetch Workflow Executions
  const {
    data: workflowsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["workflow-executions", page, status, eventType],
    queryFn: () =>
      api.monitoring.workflows({
        page,
        limit,
        status: status || undefined,
        eventType: eventType || undefined,
      }),
  });

  const executions = workflowsData?.items || [];
  const pagination = workflowsData?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };

  return (
    <div className="space-y-6 animate-fade-in text-[#e2e2eb]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold text-[#e2e2eb] tracking-tight flex items-center gap-2">
            <GitBranch className="text-[#6366f1]" size={20} />
            Workflows
          </h1>
          <p className="text-[13px] text-[#c7c4d7]/70 mt-0.5">
            Execution observability for event-driven automation workflows.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => updateUrlParams({ status: e.target.value, page: 1 })}
            className="h-8 px-3 bg-[#1e1f26] border border-[#2a2d3e] rounded text-[12px] text-[#e2e2eb] focus:outline-none focus:border-[#6366f1] transition-colors"
          >
            <option value="">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="RUNNING">Running</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>

          {/* Event Type Filter */}
          <select
            value={eventType}
            onChange={(e) => updateUrlParams({ eventType: e.target.value, page: 1 })}
            className="h-8 px-3 bg-[#1e1f26] border border-[#2a2d3e] rounded text-[12px] text-[#e2e2eb] focus:outline-none focus:border-[#6366f1] transition-colors"
          >
            <option value="">All Event Triggers</option>
            <option value="appointment.created">appointment.created</option>
            <option value="user.created">user.created</option>
            <option value="mock.event">mock.event</option>
          </select>

          {/* Reset Filters */}
          {(status || eventType || page !== 1) && (
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
                Failed to load workflow executions
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
          ) : executions.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <GitBranch className="mx-auto text-[#6b7280]" size={32} />
              <p className="text-[14px] font-semibold text-[#e2e2eb]">
                {status || eventType
                  ? "No workflow executions match these filters."
                  : "No workflow executions recorded."}
              </p>
              <p className="text-[12px] text-[#6b7280]">
                Workflows trigger automatically when inbound webhooks arrive.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-[13px] border-collapse">
              <thead className="bg-[#191b22] text-[#c7c4d7] border-b border-[#2a2d3e]">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">EXECUTION ID</th>
                  <th className="px-4 py-2.5 font-semibold">WORKFLOW NAME</th>
                  <th className="px-4 py-2.5 font-semibold">TRIGGER EVENT</th>
                  <th className="px-4 py-2.5 font-semibold">STATUS</th>
                  <th className="px-4 py-2.5 font-semibold">DURATION</th>
                  <th className="px-4 py-2.5 font-semibold">STARTED AT</th>
                  <th className="px-4 py-2.5 font-semibold">COMPLETED AT</th>
                  <th className="px-4 py-2.5 font-semibold">DETAILS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2d3e]/50">
                {executions.map((exec) => {
                  const isExpanded = expandedId === exec.id;
                  return (
                    <tr key={exec.id} className="group">
                      <td colSpan={8} className="p-0">
                        <div
                          className={`flex items-center px-4 py-3 h-11 hover:bg-[#191b22] transition-colors cursor-pointer ${
                            isExpanded ? "bg-[#191b22]" : ""
                          }`}
                          onClick={() => setExpandedId(isExpanded ? null : exec.id)}
                        >
                          <div className="w-full grid grid-cols-8 gap-2 items-center text-[12px]">
                            {/* Execution ID */}
                            <span className="font-mono text-[#c0c1ff] font-medium truncate">
                              {exec.id.substring(0, 8)}...
                            </span>

                            {/* Workflow Name */}
                            <span className="font-medium text-[#e2e2eb] truncate">
                              {exec.workflowName}
                            </span>

                            {/* Trigger Event */}
                            <span>
                              <span className="px-1.5 py-0.5 bg-[#33343b] text-[#c7c4d7] rounded font-mono text-[10px]">
                                {exec.triggerEvent}
                              </span>
                            </span>

                            {/* Status */}
                            <div>
                              <StatusBadge status={workflowStatusToVariant(exec.status)} />
                            </div>

                            {/* Duration */}
                            <span className="font-mono text-[#c0c1ff]">
                              {exec.duration !== null && exec.duration !== undefined
                                ? `${exec.duration}ms`
                                : "—"}
                            </span>

                            {/* Started At */}
                            <span className="font-mono text-[11px] text-[#6b7280] truncate">
                              {formatDate(exec.startedAt)}
                            </span>

                            {/* Completed At */}
                            <span className="font-mono text-[11px] text-[#6b7280] truncate">
                              {formatDate(exec.completedAt)}
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
                                  Full Execution UUID
                                </span>
                                <span className="font-mono text-[#c0c1ff]">{exec.id}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-[#6b7280] uppercase block">
                                  Trigger Event
                                </span>
                                <span className="font-mono text-[#c7c4d7]">{exec.triggerEvent}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-[#6b7280] uppercase block">
                                  Execution Status
                                </span>
                                <span className="font-mono uppercase font-bold text-[#e2e2eb]">
                                  {exec.status}
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] text-[#6b7280] uppercase block">
                                  Execution Latency
                                </span>
                                <span className="font-mono text-[#c0c1ff]">
                                  {exec.duration !== null ? `${exec.duration}ms` : "In Progress"}
                                </span>
                              </div>
                            </div>

                            {exec.errorMessage ? (
                              <div className="p-3 bg-[#f43f5e]/10 border border-[#f43f5e]/20 rounded font-mono text-[11px] text-[#f43f5e] space-y-1">
                                <span className="font-bold text-[10px] uppercase block">
                                  Workflow Execution Failure Details:
                                </span>
                                <div>{exec.errorMessage}</div>
                              </div>
                            ) : (
                              <div className="p-2 bg-[#10b981]/5 border border-[#10b981]/10 rounded text-[11px] text-[#10b981]">
                                Workflow execution completed successfully with zero step errors.
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

export default function WorkflowsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 space-y-4 animate-pulse">
          <div className="h-8 bg-[#2a2d3e] rounded w-1/3"></div>
          <div className="h-64 bg-[#2a2d3e] rounded w-full"></div>
        </div>
      }
    >
      <WorkflowsContent />
    </Suspense>
  );
}
