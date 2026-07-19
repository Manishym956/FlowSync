"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Link from "next/link";
import { Search, ChevronRight, Activity, Clock, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { StatusBadge, integrationStatusToVariant } from "@/components/ui/StatusBadge";
import { IntegrationTypeBadge } from "@/components/ui/IntegrationTypeBadge";

function formatDate(isoString: string | null) {
  if (!isoString) return "Never";
  try {
    return new Date(isoString).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return isoString;
  }
}

export default function IntegrationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const {
    data: integrations,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["integrations-full-list"],
    queryFn: api.integrations.list,
  });

  const filteredIntegrations = (integrations || []).filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || item.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in text-[#e2e2eb]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold text-[#e2e2eb] tracking-tight">
            Integrations
          </h1>
          <p className="text-[13px] text-[#c7c4d7]/70 mt-0.5">
            Connected data sources, FHIR sandboxes, messaging providers, and webhook endpoints.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]"
            />
            <input
              type="text"
              placeholder="Search integrations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 bg-[#1e1f26] border border-[#2a2d3e] rounded text-[12px] text-[#e2e2eb] placeholder-[#6b7280] focus:outline-none focus:border-[#6366f1] transition-colors"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 px-3 bg-[#1e1f26] border border-[#2a2d3e] rounded text-[12px] text-[#e2e2eb] focus:outline-none focus:border-[#6366f1] transition-colors"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="error">Error</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-[#1e1f26] border border-[#2a2d3e] rounded-md p-5 h-40 animate-pulse space-y-4"
            >
              <div className="h-5 bg-[#33343b] rounded w-1/2"></div>
              <div className="h-4 bg-[#33343b] rounded w-3/4"></div>
              <div className="h-8 bg-[#33343b] rounded w-full"></div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="p-6 bg-[#f43f5e]/10 border border-[#f43f5e]/20 rounded-md flex flex-col items-center justify-center gap-3 text-center">
          <AlertTriangle className="text-[#f43f5e]" size={24} />
          <p className="text-[14px] font-semibold text-[#f43f5e]">
            Failed to load integrations listing
          </p>
          <p className="text-[12px] text-[#c7c4d7]">
            {(error as Error)?.message || "A network or server error occurred."}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-1.5 bg-[#f43f5e] text-white rounded text-[12px] font-medium hover:bg-[#e11d48] transition-colors"
          >
            Retry Fetching
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && filteredIntegrations.length === 0 && (
        <div className="p-12 bg-[#1e1f26] border border-[#2a2d3e] rounded-md text-center space-y-3">
          <RefreshCw className="mx-auto text-[#6b7280]" size={32} />
          <p className="text-[14px] font-semibold text-[#e2e2eb]">No Integrations Found</p>
          <p className="text-[12px] text-[#6b7280]">
            {searchQuery || statusFilter !== "all"
              ? "No integrations match your search or filter criteria."
              : "No integrations are configured in the system."}
          </p>
        </div>
      )}

      {/* Grid of Integration Cards */}
      {!isLoading && !isError && filteredIntegrations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredIntegrations.map((item) => (
            <Link
              key={item.id}
              href={`/integrations/${item.id}`}
              className="bg-[#1e1f26] border border-[#2a2d3e] rounded-md p-5 hover:border-[#6366f1]/50 hover:bg-[#191b22] transition-all group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[15px] font-semibold text-[#e2e2eb] group-hover:text-[#c0c1ff] transition-colors">
                        {item.name}
                      </h3>
                      <IntegrationTypeBadge type={item.type} />
                    </div>
                    <p className="text-[11px] font-mono text-[#6b7280] mt-1">
                      ID: {item.id}
                    </p>
                  </div>

                  <StatusBadge status={integrationStatusToVariant(item.status)} />
                </div>

                {/* Metrics Bar */}
                <div className="grid grid-cols-3 gap-2 py-3 px-3 bg-[#111319] border border-[#2a2d3e]/50 rounded text-center">
                  <div>
                    <span className="text-[10px] text-[#6b7280] block uppercase font-medium">
                      Success Rate
                    </span>
                    <span className="font-mono text-[13px] font-bold text-[#10b981]">
                      {item.successRate}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6b7280] block uppercase font-medium">
                      Avg Latency
                    </span>
                    <span className="font-mono text-[13px] font-bold text-[#c0c1ff]">
                      {item.averageLatency}ms
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6b7280] block uppercase font-medium">
                      Last Sync
                    </span>
                    <span className="font-mono text-[11px] text-[#c7c4d7]">
                      {item.lastSyncStatus || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#2a2d3e]/50 text-[12px]">
                <span className="text-[#6b7280]">
                  Last successful sync:{" "}
                  <span className="text-[#c7c4d7] font-mono">
                    {formatDate(item.lastSuccessfulSync)}
                  </span>
                </span>
                <span className="text-[#6366f1] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 font-medium">
                  View Details <ChevronRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
