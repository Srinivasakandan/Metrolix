import { MOCK_INSPECTIONS } from "@/lib/mock/inspections";

export interface TrendPoint {
  date: string;
  inspections: number;
}

export interface DistributionSlice {
  name: string;
  value: number;
  status: "PASS" | "POTENTIAL_NON_COMPLIANCE" | "NEEDS_REVIEW";
}

const activeInspections = MOCK_INSPECTIONS.filter(
  (i) => i.stage !== "DRAFT" && i.stage !== "UPLOADING"
);

const trendDateCounts = new Map<string, number>();
const sortedActive = [...activeInspections].sort(
  (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
);

sortedActive.forEach((item) => {
  const d = new Date(item.createdAt);
  const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  trendDateCounts.set(label, (trendDateCounts.get(label) || 0) + 1);
});

export const INSPECTION_TREND: TrendPoint[] = Array.from(trendDateCounts.entries()).map(
  ([date, inspections]) => ({ date, inspections })
);

const passedCount = activeInspections.filter((i) => i.overallStatus === "PASS").length;
const potentialNonComplianceCount = activeInspections.filter((i) => i.overallStatus === "POTENTIAL_NON_COMPLIANCE").length;
const needsReviewCount = activeInspections.filter((i) => i.overallStatus === "NEEDS_REVIEW").length;

export const COMPLIANCE_DISTRIBUTION: DistributionSlice[] = [
  { name: "Pass", value: passedCount, status: "PASS" },
  { name: "Potential Non-Compliance", value: potentialNonComplianceCount, status: "POTENTIAL_NON_COMPLIANCE" },
  { name: "Needs Review", value: needsReviewCount, status: "NEEDS_REVIEW" },
];

export const DASHBOARD_TOTALS = {
  total: activeInspections.length,
  passed: passedCount,
  potentialNonCompliance: potentialNonComplianceCount,
  needsReview: needsReviewCount,
};

