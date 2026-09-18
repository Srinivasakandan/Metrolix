"use client";

/**
 * Dashboard aggregate endpoints. The dashboard page currently renders its
 * summary cards/trend chart from static mock data
 * (lib/mock/dashboard.ts) rather than through a service call — these
 * wrappers exist so that data can be swapped for the real backend
 * without inventing a new response shape later, matching the endpoints
 * documented in docs/API_CONTRACT.md.
 */
import { COMPLIANCE_DISTRIBUTION, INSPECTION_TREND } from "@/lib/mock/dashboard";
import { inspectionStore } from "@/lib/mock/store";
import { apiGet, isApiConfigured } from "@/lib/api/client";
import type {
  ApiDashboardSummaryResponse,
  ApiDashboardTrendsResponse,
  ApiRecentInspectionsResponse,
} from "@/types/api";
import { mapInspectionSummary } from "@/lib/api/mappers";
import type { Inspection } from "@/types";

function delay<T>(value: T, ms = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/** GET /api/v1/dashboard/summary */
export async function getDashboardSummary(): Promise<ApiDashboardSummaryResponse> {
  if (isApiConfigured()) {
    return apiGet<ApiDashboardSummaryResponse>("/api/v1/dashboard/summary");
  }
  const items = inspectionStore.getAll().filter((i) => i.stage !== "DRAFT" && i.stage !== "UPLOADING");
  return delay({
    total: items.length,
    passed: items.filter((i) => i.overallStatus === "PASS").length,
    potential_non_compliance: items.filter((i) => i.overallStatus === "POTENTIAL_NON_COMPLIANCE").length,
    needs_review: items.filter((i) => i.overallStatus === "NEEDS_REVIEW").length,
  });
}

/** GET /api/v1/dashboard/trends */
export async function getDashboardTrends(days = 30): Promise<ApiDashboardTrendsResponse> {
  if (isApiConfigured()) {
    return apiGet<ApiDashboardTrendsResponse>("/api/v1/dashboard/trends", { days });
  }
  const items = inspectionStore.getAll().filter((i) => i.stage !== "DRAFT" && i.stage !== "UPLOADING");
  const dateCounts = new Map<string, number>();
  const sorted = [...items].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  sorted.forEach((item) => {
    const d = new Date(item.createdAt);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    dateCounts.set(label, (dateCounts.get(label) || 0) + 1);
  });

  const points = Array.from(dateCounts.entries()).map(([date, inspections]) => ({
    date,
    inspections,
  }));

  return delay({ points });
}

/** GET /api/v1/dashboard/recent-inspections */
export async function getRecentInspections(limit = 6): Promise<Inspection[]> {
  if (isApiConfigured()) {
    const result = await apiGet<ApiRecentInspectionsResponse>("/api/v1/dashboard/recent-inspections", {
      limit,
    });
    return result.items.map(mapInspectionSummary);
  }
  return delay([]);
}

export { COMPLIANCE_DISTRIBUTION };
