import type { Metadata } from "next";
import { MetricCard, MetricCardSkeleton } from "@/components/ui/MetricCard";
import { Card, CardHeader } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Overview",
  description: "FlowSync integration health and activity overview.",
};

/**
 * Overview Dashboard — stub page.
 *
 * Phase 0B: Layout structure and component primitives only.
 * No mocked data — metrics and tables will be connected to real backend APIs in Phase 6.
 */
export default function OverviewPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-[20px] font-semibold text-[#e2e2eb] tracking-tight">
          Overview
        </h1>
        <p className="text-[13px] text-[#6b7280] mt-0.5">
          Integration health and synchronization activity
        </p>
      </div>

      {/* Metric cards — skeleton (will be connected to /api/metrics in Phase 6) */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </div>

      {/* Recent activity placeholder */}
      <Card noPad>
        <CardHeader
          title="Recent Sync Activity"
          description="Latest synchronization jobs across all integrations"
        />
        <div className="p-8 text-center text-[13px] text-[#6b7280]">
          Connect backend API in Phase 6 to display real sync data.
        </div>
      </Card>

      {/* Integration health placeholder */}
      <div className="grid grid-cols-2 gap-4">
        <Card noPad>
          <CardHeader title="Integration Health" />
          <div className="p-8 text-center text-[13px] text-[#6b7280]">
            Health data will be shown when the monitoring API is available.
          </div>
        </Card>
        <Card noPad>
          <CardHeader title="Recent Failures" />
          <div className="p-8 text-center text-[13px] text-[#6b7280]">
            Failure data will be shown when the monitoring API is available.
          </div>
        </Card>
      </div>
    </div>
  );
}
