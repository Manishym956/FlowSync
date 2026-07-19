"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  GitBranch,
  RefreshCw,
  XCircle,
  Play,
  RotateCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { StatusBadge } from "@/components/ui/StatusBadge";

// Format timestamp helper
function formatTime(isoString: string) {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return isoString;
  }
}

// Chart loading state skeleton
function ChartSkeleton() {
  return (
    <div className="w-full h-[260px] flex items-end justify-between px-4 pb-8 relative animate-pulse">
      <div className="absolute inset-x-0 bottom-8 h-[1px] bg-[#2a2d3e]"></div>
      <div className="absolute inset-x-0 top-1/4 h-[1px] border-t border-dashed border-[#2a2d3e]/50"></div>
      <div className="absolute inset-x-0 top-1/2 h-[1px] border-t border-dashed border-[#2a2d3e]/50"></div>
      <div className="absolute inset-x-0 top-3/4 h-[1px] border-t border-dashed border-[#2a2d3e]/50"></div>
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          <div className="w-8 bg-[#2a2d3e] rounded-t-sm h-[80px]" style={{ height: `${50 + (i * 20) % 100}px` }}></div>
          <div className="h-3 w-8 bg-[#2a2d3e] rounded"></div>
        </div>
      ))}
    </div>
  );
}

export default function OverviewPage() {
  const [range, setRange] = useState<"24h" | "7d" | "30d">("24h");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch metrics data
  const {
    data: metrics,
    isLoading: metricsLoading,
    isError: metricsError,
    refetch: refetchMetrics,
  } = useQuery({
    queryKey: ["metrics"],
    queryFn: api.monitoring.metrics,
  });

  // Fetch time-series data
  const {
    data: timeSeries,
    isLoading: timeSeriesLoading,
    isError: timeSeriesError,
    refetch: refetchTimeSeries,
  } = useQuery({
    queryKey: ["time-series", range],
    queryFn: () => api.monitoring.timeSeries(range),
  });

  // Fetch recent-activity feed
  const {
    data: recentActivity,
    isLoading: activityLoading,
    isError: activityError,
    refetch: refetchActivity,
  } = useQuery({
    queryKey: ["recent-activity"],
    queryFn: api.monitoring.recentActivity,
  });

  // Fetch integrations list
  const {
    data: integrations,
    isLoading: integrationsLoading,
    isError: integrationsError,
    refetch: refetchIntegrations,
  } = useQuery({
    queryKey: ["integrations-list"],
    queryFn: api.integrations.list,
  });

  const handleGlobalRetry = () => {
    refetchMetrics();
    refetchTimeSeries();
    refetchActivity();
    refetchIntegrations();
  };

  // Setup formatting for chart X-Axis
  const formatChartDate = (tickItem: string) => {
    try {
      const date = new Date(tickItem);
      if (range === "24h") {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      }
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    } catch (e) {
      return tickItem;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-[#e2e2eb]">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold text-[#e2e2eb] tracking-tight">Overview</h1>
          <p className="text-[13px] text-[#c7c4d7]/70 mt-0.5">
            Monitor integration health, synchronization performance, and workflow activity.
          </p>
        </div>
        <div className="flex bg-[#1e1f26] rounded-md p-0.5 border border-[#2a2d3e]">
          {(["24h", "7d", "30d"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 text-[12px] font-medium rounded transition-colors ${
                range === r
                  ? "bg-[#33343b] text-[#c0c1ff] border border-[#2a2d3e]/30 shadow-sm"
                  : "text-[#c7c4d7] hover:text-[#e2e2eb]"
              }`}
            >
              {r === "24h" ? "24 Hours" : r === "7d" ? "7 Days" : "30 Days"}
            </button>
          ))}
        </div>
      </section>

      {/* Primary Metrics Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Integrations */}
        {metricsLoading ? (
          <div className="bg-[#1e1f26] border border-[#2a2d3e] p-4 rounded-md h-[110px] animate-pulse" />
        ) : metricsError || !metrics ? (
          <div className="bg-[#1e1f26] border border-[#2a2d3e] p-4 rounded-md h-[110px] flex items-center justify-center text-[12px] text-[#f43f5e]">
            Error loading metrics
          </div>
        ) : (
          <div className="bg-[#1e1f26] border border-[#2a2d3e] p-4 rounded-md flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-[#c7c4d7]">Active Integrations</span>
              <RefreshCw className="text-[#6366f1]" size={16} />
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-[28px] font-mono font-bold leading-none">{metrics.activeIntegrations}</span>
              <span className="text-[10px] text-[#10b981] font-bold px-1.5 py-0.5 bg-[#10b981]/10 rounded">
                100%
              </span>
            </div>
            <div className="mt-3 h-1 w-full bg-[#33343b] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#6366f1]"
                style={{
                  width: `${
                    metrics.activeIntegrations > 0
                      ? (metrics.healthyIntegrations / metrics.activeIntegrations) * 100
                      : 0
                  }%`,
                }}
              ></div>
            </div>
          </div>
        )}

        {/* Card 2: Sync Success Rate */}
        {metricsLoading ? (
          <div className="bg-[#1e1f26] border border-[#2a2d3e] p-4 rounded-md h-[110px] animate-pulse" />
        ) : metricsError || !metrics ? (
          <div className="bg-[#1e1f26] border border-[#2a2d3e] p-4 rounded-md h-[110px] flex items-center justify-center text-[12px] text-[#f43f5e]">
            Error loading metrics
          </div>
        ) : (
          <div className="bg-[#1e1f26] border border-[#2a2d3e] p-4 rounded-md flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-[#c7c4d7]">Sync Success Rate</span>
              <CheckCircle2 className="text-[#10b981]" size={16} />
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-[28px] font-mono font-bold leading-none">
                {metrics.syncSuccessRate}%
              </span>
              <span className="text-[10px] text-[#10b981] font-bold px-1.5 py-0.5 bg-[#10b981]/10 rounded">
                Stable
              </span>
            </div>
            <div className="mt-3 flex gap-1">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 flex-1 rounded-full ${
                    metrics.syncSuccessRate >= 95 || idx < 3
                      ? "bg-[#10b981]"
                      : metrics.syncSuccessRate >= 80
                      ? "bg-amber-400"
                      : "bg-[#f43f5e]"
                  }`}
                ></div>
              ))}
            </div>
          </div>
        )}

        {/* Card 3: Failed Syncs */}
        {metricsLoading ? (
          <div className="bg-[#1e1f26] border border-[#2a2d3e] p-4 rounded-md h-[110px] animate-pulse" />
        ) : metricsError || !metrics ? (
          <div className="bg-[#1e1f26] border border-[#2a2d3e] p-4 rounded-md h-[110px] flex items-center justify-center text-[12px] text-[#f43f5e]">
            Error loading metrics
          </div>
        ) : (
          <div className="bg-[#1e1f26] border border-[#2a2d3e] p-4 rounded-md flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-[#c7c4d7]">Failed Syncs</span>
              <XCircle className={metrics.failedSyncJobs > 0 ? "text-[#f43f5e]" : "text-[#c7c4d7]/40"} size={16} />
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-[28px] font-mono font-bold leading-none">
                {metrics.failedSyncJobs}
              </span>
              {metrics.failedSyncJobs > 0 && (
                <span className="text-[10px] text-[#f43f5e] font-bold px-1.5 py-0.5 bg-[#f43f5e]/10 rounded">
                  Alert
                </span>
              )}
            </div>
            <p className="mt-3 text-[11px] text-[#6b7280] truncate">
              {metrics.failedSyncJobs > 0
                ? "Errors detected in sync processes"
                : "No failed syncs recorded"}
            </p>
          </div>
        )}

        {/* Card 4: Average API Latency */}
        {metricsLoading ? (
          <div className="bg-[#1e1f26] border border-[#2a2d3e] p-4 rounded-md h-[110px] animate-pulse" />
        ) : metricsError || !metrics ? (
          <div className="bg-[#1e1f26] border border-[#2a2d3e] p-4 rounded-md h-[110px] flex items-center justify-center text-[12px] text-[#f43f5e]">
            Error loading metrics
          </div>
        ) : (
          <div className="bg-[#1e1f26] border border-[#2a2d3e] p-4 rounded-md flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-[#c7c4d7]">Average API Latency</span>
              <Clock className="text-[#c0c1ff]" size={16} />
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-[28px] font-mono font-bold leading-none">
                {metrics.averageApiLatency}ms
              </span>
              <span className="text-[10px] text-[#10b981] font-bold px-1.5 py-0.5 bg-[#10b981]/10 rounded">
                Optimal
              </span>
            </div>
            <div className="mt-3 h-5 w-full flex items-end gap-[2px]">
              <div className="bg-[#6366f1]/40 w-full h-[40%] rounded-t-sm"></div>
              <div className="bg-[#6366f1]/60 w-full h-[60%] rounded-t-sm"></div>
              <div className="bg-[#6366f1]/50 w-full h-[50%] rounded-t-sm"></div>
              <div className="bg-[#6366f1]/80 w-full h-[80%] rounded-t-sm"></div>
              <div className="bg-[#6366f1] w-full h-[70%] rounded-t-sm"></div>
            </div>
          </div>
        )}
      </section>

      {/* Main Grid: Left (Wide) & Right (Narrow) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Performance Chart Container */}
          <div className="bg-[#1e1f26] border border-[#2a2d3e] rounded-md overflow-hidden">
            <div className="p-4 border-b border-[#2a2d3e] flex items-center justify-between">
              <h3 className="text-[14px] font-semibold">Sync Performance</h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#6366f1]"></span>
                  <span className="text-[12px] text-[#c7c4d7]">Success</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#f43f5e]"></span>
                  <span className="text-[12px] text-[#c7c4d7]">Failures</span>
                </div>
              </div>
            </div>
            <div className="p-4 h-[300px] bg-[#111319] relative">
              {timeSeriesLoading || !isMounted ? (
                <ChartSkeleton />
              ) : timeSeriesError || !timeSeries ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-[12px] text-[#f43f5e] gap-2">
                  <span>Failed to load chart data</span>
                  <button
                    onClick={() => refetchTimeSeries()}
                    className="px-3 py-1 bg-[#1e1f26] border border-[#2a2d3e] rounded text-[11px] hover:bg-[#33343b] transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : timeSeries.syncJobs.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-[12px] text-[#6b7280]">
                  No synchronization history available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeSeries.syncJobs} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" vertical={false} />
                    <XAxis
                      dataKey="timestamp"
                      stroke="#6b7280"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={formatChartDate}
                    />
                    <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e1f26",
                        borderColor: "#2a2d3e",
                        borderRadius: "6px",
                      }}
                      labelClassName="text-[#c7c4d7] text-[11px] font-mono"
                      itemStyle={{ fontSize: "12px" }}
                    />
                    <Bar dataKey="successCount" fill="#6366f1" radius={[2, 2, 0, 0]} name="Successful" />
                    <Bar dataKey="failedCount" fill="#f43f5e" radius={[2, 2, 0, 0]} name="Failed" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Integration Status Table */}
          <div className="bg-[#1e1f26] border border-[#2a2d3e] rounded-md overflow-hidden">
            <div className="p-4 border-b border-[#2a2d3e]">
              <h3 className="text-[14px] font-semibold">Integration Status</h3>
            </div>
            <div className="overflow-x-auto">
              {integrationsLoading ? (
                <div className="p-6 space-y-4 animate-pulse">
                  <div className="h-4 bg-[#2a2d3e] rounded w-full"></div>
                  <div className="h-4 bg-[#2a2d3e] rounded w-full"></div>
                  <div className="h-4 bg-[#2a2d3e] rounded w-full"></div>
                </div>
              ) : integrationsError || !integrations ? (
                <div className="p-8 text-center text-[12px] text-[#f43f5e]">
                  Failed to load integrations listing.
                </div>
              ) : integrations.length === 0 ? (
                <div className="p-8 text-center text-[13px] text-[#6b7280]">
                  No integrations configured.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-[13px]">
                  <thead className="bg-[#191b22] text-[#c7c4d7] border-b border-[#2a2d3e]">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">NAME</th>
                      <th className="px-4 py-2.5 font-semibold">TYPE</th>
                      <th className="px-4 py-2.5 font-semibold">STATUS</th>
                      <th className="px-4 py-2.5 font-semibold">LAST SYNC STATUS</th>
                      <th className="px-4 py-2.5 font-semibold">SUCCESS RATE</th>
                      <th className="px-4 py-2.5 font-semibold">LATENCY</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2d3e]/50">
                    {integrations.slice(0, 5).map((integration) => (
                      <tr
                        key={integration.id}
                        className="hover:bg-[#191b22] transition-colors h-10"
                      >
                        <td className="px-4 py-2 font-medium text-[#e2e2eb]">
                          {integration.name}
                        </td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-0.5 bg-[#33343b] rounded text-[11px] font-mono">
                            {integration.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                integration.status === "active"
                                  ? "bg-[#10b981]"
                                  : integration.status === "inactive"
                                  ? "bg-[#6b7280]"
                                  : "bg-[#f43f5e]"
                              }`}
                            ></span>
                            <span className="capitalize">{integration.status}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          {integration.lastSyncStatus ? (
                            <StatusBadge
                              status={
                                integration.lastSyncStatus === "COMPLETED"
                                  ? "healthy"
                                  : integration.lastSyncStatus === "PROCESSING"
                                  ? "syncing"
                                  : integration.lastSyncStatus === "PENDING"
                                  ? "pending"
                                  : "failed"
                              }
                            />
                          ) : (
                            <span className="text-[#6b7280]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2 font-mono text-[12px]">
                          {integration.successRate}%
                        </td>
                        <td className="px-4 py-2 font-mono text-[12px]">
                          {integration.averageLatency}ms
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-6">
          {/* System Health */}
          <div className="bg-[#1e1f26] border border-[#2a2d3e] p-4 rounded-md">
            <h3 className="text-[14px] font-semibold mb-4">System Health</h3>
            {metricsLoading ? (
              <div className="grid grid-cols-3 gap-2 animate-pulse">
                <div className="h-12 bg-[#2a2d3e] rounded" />
                <div className="h-12 bg-[#2a2d3e] rounded" />
                <div className="h-12 bg-[#2a2d3e] rounded" />
              </div>
            ) : metricsError || !metrics ? (
              <div className="text-[12px] text-[#f43f5e] text-center">Error</div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#10b981]/5 border border-[#10b981]/20 rounded p-2.5 text-center">
                  <p className="text-[10px] text-[#10b981] font-bold uppercase tracking-tight">Healthy</p>
                  <p className="font-mono text-2xl font-bold mt-1 text-[#10b981]">
                    {metrics.healthyIntegrations}
                  </p>
                </div>
                <div className="bg-amber-400/5 border border-amber-400/20 rounded p-2.5 text-center">
                  <p className="text-[10px] text-amber-400 font-bold uppercase tracking-tight">Degraded</p>
                  <p className="font-mono text-2xl font-bold mt-1 text-amber-400">
                    {metrics.degradedIntegrations}
                  </p>
                </div>
                <div className="bg-[#f43f5e]/5 border border-[#f43f5e]/20 rounded p-2.5 text-center">
                  <p className="text-[10px] text-[#f43f5e] font-bold uppercase tracking-tight">Failed</p>
                  <p className="font-mono text-2xl font-bold mt-1 text-[#f43f5e]">
                    {metrics.failedIntegrations}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Workflow Activity Widget */}
          <div className="bg-[#1e1f26] border border-[#2a2d3e] p-4 rounded-md">
            <h3 className="text-[14px] font-semibold mb-4">Workflow Activity</h3>
            {metricsLoading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-6 bg-[#2a2d3e] rounded" />
                <div className="h-6 bg-[#2a2d3e] rounded" />
              </div>
            ) : metricsError || !metrics ? (
              <div className="text-[12px] text-[#f43f5e] text-center">Error</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5 text-[12px]">
                    <span className="text-[#c7c4d7]">Successful Executions</span>
                    <span className="font-mono font-bold text-[#10b981]">
                      {metrics.successfulWorkflowExecutions}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-[#33343b] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#10b981]"
                      style={{
                        width: `${
                          metrics.totalWorkflowExecutions > 0
                            ? (metrics.successfulWorkflowExecutions / metrics.totalWorkflowExecutions) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5 text-[12px]">
                    <span className="text-[#c7c4d7]">Failed Executions</span>
                    <span className="font-mono font-bold text-[#f43f5e]">
                      {metrics.failedWorkflowExecutions}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-[#33343b] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#f43f5e]"
                      style={{
                        width: `${
                          metrics.totalWorkflowExecutions > 0
                            ? (metrics.failedWorkflowExecutions / metrics.totalWorkflowExecutions) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recent Activity Feed */}
          <div className="bg-[#1e1f26] border border-[#2a2d3e] rounded-md overflow-hidden">
            <div className="p-4 border-b border-[#2a2d3e] flex items-center justify-between">
              <h3 className="text-[14px] font-semibold">Recent Activity</h3>
              <button
                onClick={() => refetchActivity()}
                className="text-[11px] text-[#c0c1ff] hover:text-[#e2e2eb] flex items-center gap-1"
                aria-label="Refresh activity"
              >
                <RotateCw size={11} />
                Refresh
              </button>
            </div>
            <div className="divide-y divide-[#2a2d3e]/50 max-h-[300px] overflow-y-auto custom-scrollbar">
              {activityLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-3 space-y-2 animate-pulse">
                    <div className="h-3 bg-[#2a2d3e] rounded w-1/3"></div>
                    <div className="h-3 bg-[#2a2d3e] rounded w-full"></div>
                  </div>
                ))
              ) : activityError || !recentActivity ? (
                <div className="p-4 text-center text-[12px] text-[#f43f5e]">
                  Failed to load activity feed.
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="p-8 text-center text-[13px] text-[#6b7280]">
                  No recent activities recorded.
                </div>
              ) : (
                recentActivity.slice(0, 6).map((activity) => {
                  let Icon = RefreshCw;
                  let iconColor = "bg-[#10b981]/10 text-[#10b981]";

                  if (activity.type.includes("FAILED")) {
                    iconColor = "bg-[#f43f5e]/10 text-[#f43f5e]";
                    Icon = activity.type.startsWith("WORKFLOW") ? GitBranch : XCircle;
                  } else if (activity.type.startsWith("WORKFLOW")) {
                    iconColor = "bg-[#6366f1]/10 text-[#6366f1]";
                    Icon = GitBranch;
                  } else if (activity.type.startsWith("NOTIFICATION")) {
                    iconColor = "bg-[#c0c1ff]/10 text-[#c0c1ff]";
                    Icon = Send;
                  }

                  return (
                    <div
                      key={activity.id}
                      className="p-3 flex gap-3 items-start hover:bg-[#191b22] transition-colors"
                    >
                      <div className={`mt-0.5 flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full ${iconColor}`}>
                        <Icon size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[12px] font-semibold truncate leading-none">
                            {activity.type}
                          </p>
                          <span className="text-[10px] text-[#6b7280] font-mono flex-shrink-0">
                            {formatTime(activity.timestamp)}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#c7c4d7] mt-1 leading-normal">
                          {activity.summary}
                        </p>
                        {activity.integration && (
                          <span className="inline-block mt-1 px-1.5 py-0.2 bg-[#33343b] text-[9px] text-[#c7c4d7] rounded font-mono">
                            {activity.integration.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Partial API Error State / Retry Trigger */}
      {(metricsError || timeSeriesError || activityError || integrationsError) && (
        <div className="p-3 bg-[#f43f5e]/10 border border-[#f43f5e]/20 rounded-md flex items-center justify-between text-[12px] text-[#f43f5e]">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} />
            <span>Some dashboard widgets failed to fetch fresh data.</span>
          </div>
          <button
            onClick={handleGlobalRetry}
            className="px-2.5 py-1 bg-[#f43f5e]/15 hover:bg-[#f43f5e]/25 text-[#f43f5e] font-semibold rounded border border-[#f43f5e]/30 transition-colors"
          >
            Retry Fetching
          </button>
        </div>
      )}
    </div>
  );
}
