"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Activity,
  HeartPulse,
} from "lucide-react";
import { StatusBadge, integrationStatusToVariant, syncJobStatusToVariant } from "@/components/ui/StatusBadge";
import { IntegrationTypeBadge } from "@/components/ui/IntegrationTypeBadge";

function formatDate(isoString: string | null) {
  if (!isoString) return "Never";
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

export default function IntegrationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [syncFeedback, setSyncFeedback] = useState<{
    type: "success" | "error";
    message: string;
    jobId?: string;
  } | null>(null);

  // Fetch Integration Details
  const {
    data: integration,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["integration-detail", id],
    queryFn: () => api.integrations.get(id),
  });

  // Fetch Live Health Check (Stale time: 60s to avoid hammering endpoint)
  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ["integration-health", id],
    queryFn: () => api.integrations.health(id),
    staleTime: 60_000,
  });

  // Trigger Sync Mutation
  const triggerSyncMutation = useMutation({
    mutationFn: () => api.integrations.triggerSync(id),
    onSuccess: (data) => {
      setSyncFeedback({
        type: "success",
        message: `Sync job enqueued successfully! Job ID: ${data.jobId}`,
        jobId: data.jobId,
      });
      queryClient.invalidateQueries({ queryKey: ["integration-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
    },
    onError: (err: Error) => {
      setSyncFeedback({
        type: "error",
        message: err.message || "Failed to trigger synchronization job.",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-6 bg-[#2a2d3e] rounded w-32"></div>
        <div className="h-10 bg-[#2a2d3e] rounded w-1/2"></div>
        <div className="grid grid-cols-4 gap-4">
          <div className="h-24 bg-[#2a2d3e] rounded"></div>
          <div className="h-24 bg-[#2a2d3e] rounded"></div>
          <div className="h-24 bg-[#2a2d3e] rounded"></div>
          <div className="h-24 bg-[#2a2d3e] rounded"></div>
        </div>
      </div>
    );
  }

  if (isError || !integration) {
    return (
      <div className="p-8 bg-[#1e1f26] border border-[#2a2d3e] rounded-md text-center space-y-4">
        <AlertTriangle className="mx-auto text-[#f43f5e]" size={32} />
        <h2 className="text-[16px] font-semibold text-[#e2e2eb]">
          Failed to load integration details
        </h2>
        <p className="text-[13px] text-[#c7c4d7]">
          {(error as Error)?.message || "Integration not found."}
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/integrations"
            className="px-4 py-1.5 bg-[#33343b] text-[#e2e2eb] rounded text-[12px] hover:bg-[#444652] transition-colors"
          >
            Back to Integrations
          </Link>
          <button
            onClick={() => refetch()}
            className="px-4 py-1.5 bg-[#6366f1] text-white rounded text-[12px] hover:bg-[#5558e3] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-[#e2e2eb]">
      {/* Back Link */}
      <Link
        href="/integrations"
        className="inline-flex items-center gap-1.5 text-[12px] text-[#c0c1ff] hover:text-[#e2e2eb] transition-colors"
      >
        <ArrowLeft size={14} /> Back to Integrations
      </Link>

      {/* Header Bar */}
      <div className="bg-[#1e1f26] border border-[#2a2d3e] p-6 rounded-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-semibold text-[#e2e2eb]">
              {integration.name}
            </h1>
            <IntegrationTypeBadge type={integration.type} />
            <StatusBadge status={integrationStatusToVariant(integration.status)} />
          </div>

          <div className="flex items-center gap-4 text-[12px] text-[#c7c4d7]/80">
            {integration.baseUrl && (
              <span>
                Base URL:{" "}
                <span className="font-mono text-[#e2e2eb] bg-[#111319] px-2 py-0.5 rounded border border-[#2a2d3e]">
                  {integration.baseUrl}
                </span>
              </span>
            )}

            {/* Live Health Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-[#111319] border border-[#2a2d3e] rounded">
              <HeartPulse
                size={13}
                className={
                  healthLoading
                    ? "text-[#6b7280] animate-pulse"
                    : healthData?.health.status === "healthy"
                    ? "text-[#10b981]"
                    : healthData?.health.status === "degraded"
                    ? "text-amber-400"
                    : "text-[#f43f5e]"
                }
              />
              <span className="text-[11px] font-medium">
                Live Health:{" "}
                <span
                  className={
                    healthData?.health.status === "healthy"
                      ? "text-[#10b981] capitalize"
                      : "text-amber-400 capitalize"
                  }
                >
                  {healthLoading ? "Checking..." : healthData?.health.status || "Unknown"}
                </span>
                {healthData?.health.latency !== undefined && (
                  <span className="text-[#6b7280] font-mono ml-1">
                    ({healthData.health.latency}ms)
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSyncFeedback(null);
              triggerSyncMutation.mutate();
            }}
            disabled={triggerSyncMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-[#6366f1] text-white text-[13px] font-semibold rounded hover:bg-[#5558e3] disabled:opacity-50 disabled:pointer-events-none active:scale-95 transition-all shadow-sm"
          >
            <Play size={14} className={triggerSyncMutation.isPending ? "animate-spin" : ""} />
            <span>{triggerSyncMutation.isPending ? "Queueing Sync..." : "Sync Now"}</span>
          </button>
        </div>
      </div>

      {/* Sync Mutation Feedback Banner */}
      {syncFeedback && (
        <div
          className={`p-4 rounded-md border flex items-center justify-between text-[13px] ${
            syncFeedback.type === "success"
              ? "bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]"
              : "bg-[#f43f5e]/10 border-[#f43f5e]/30 text-[#f43f5e]"
          }`}
        >
          <div className="flex items-center gap-2">
            {syncFeedback.type === "success" ? (
              <CheckCircle2 size={16} />
            ) : (
              <AlertTriangle size={16} />
            )}
            <span>{syncFeedback.message}</span>
          </div>

          {syncFeedback.jobId && (
            <Link
              href={`/sync-jobs?integrationId=${id}`}
              className="px-3 py-1 bg-[#10b981] text-white rounded text-[12px] font-medium hover:bg-[#059669] transition-colors flex items-center gap-1"
            >
              Observe Job <ExternalLink size={13} />
            </Link>
          )}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1e1f26] border border-[#2a2d3e] p-4 rounded-md space-y-1">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#6b7280]">
            Success Rate
          </span>
          <p className="text-[26px] font-mono font-bold text-[#10b981]">
            {integration.successRate}%
          </p>
        </div>

        <div className="bg-[#1e1f26] border border-[#2a2d3e] p-4 rounded-md space-y-1">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#6b7280]">
            Average Latency
          </span>
          <p className="text-[26px] font-mono font-bold text-[#c0c1ff]">
            {integration.averageLatency}ms
          </p>
        </div>

        <div className="bg-[#1e1f26] border border-[#2a2d3e] p-4 rounded-md space-y-1">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#6b7280]">
            Records Processed
          </span>
          <p className="text-[26px] font-mono font-bold text-[#e2e2eb]">
            {integration.recordsProcessed}
          </p>
        </div>

        <div className="bg-[#1e1f26] border border-[#2a2d3e] p-4 rounded-md space-y-1">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#6b7280]">
            Last Successful Sync
          </span>
          <p className="text-[13px] font-mono text-[#c7c4d7] mt-2">
            {formatDate(integration.lastSuccessfulSync)}
          </p>
        </div>
      </div>

      {/* Recent Sync Jobs Section */}
      <div className="bg-[#1e1f26] border border-[#2a2d3e] rounded-md overflow-hidden">
        <div className="p-4 border-b border-[#2a2d3e] flex items-center justify-between">
          <div>
            <h3 className="text-[14px] font-semibold">Recent Sync Executions</h3>
            <p className="text-[12px] text-[#6b7280]">
              Latest synchronization jobs for this integration connector
            </p>
          </div>
          <Link
            href={`/sync-jobs?integrationId=${id}`}
            className="text-[12px] text-[#6366f1] hover:text-[#5558e3] font-medium flex items-center gap-1"
          >
            View All Jobs <ExternalLink size={13} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          {integration.recentSyncJobs.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-[#6b7280]">
              No sync jobs have been executed yet for this integration.
            </div>
          ) : (
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#191b22] text-[#c7c4d7] border-b border-[#2a2d3e]">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">JOB ID</th>
                  <th className="px-4 py-2.5 font-semibold">STATUS</th>
                  <th className="px-4 py-2.5 font-semibold">PROCESSED</th>
                  <th className="px-4 py-2.5 font-semibold">FAILED</th>
                  <th className="px-4 py-2.5 font-semibold">DURATION</th>
                  <th className="px-4 py-2.5 font-semibold">STARTED AT</th>
                  <th className="px-4 py-2.5 font-semibold">ERROR DETAILS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2d3e]/50">
                {integration.recentSyncJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-[#191b22] transition-colors h-10">
                    <td className="px-4 py-2 font-mono text-[11px] text-[#c0c1ff]">
                      {job.id.substring(0, 8)}...
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge status={syncJobStatusToVariant(job.status)} />
                    </td>
                    <td className="px-4 py-2 font-mono">{job.recordsProcessed}</td>
                    <td className="px-4 py-2 font-mono text-[#f43f5e]">{job.recordsFailed}</td>
                    <td className="px-4 py-2 font-mono text-[12px]">
                      {calculateDuration(job.startedAt, job.completedAt)}
                    </td>
                    <td className="px-4 py-2 font-mono text-[11px] text-[#6b7280]">
                      {formatDate(job.startedAt)}
                    </td>
                    <td className="px-4 py-2 max-w-xs truncate text-[11px] text-[#f43f5e]">
                      {job.errorMessage || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
