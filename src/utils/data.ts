import type { PrefixData, BatchResult } from "@/types/api.ts";

export function extractBatchResults(prefixData: readonly PrefixData[]): BatchResult[] {
  const results: BatchResult[] = [];

  for (const data of prefixData) {
    const irrOrigins = new Set<number>();

    for (const routes of Object.values(data.irrRoutes)) {
      for (const route of routes) {
        irrOrigins.add(route.asn);
      }
    }

    if (irrOrigins.size === 0) {
      for (const origin of data.bgpOrigins) {
        irrOrigins.add(origin);
      }
    }

    for (const origin of irrOrigins) {
      const rpkiStatus = determineRPKIStatus(data, origin);
      results.push({
        subnet: data.prefix,
        origin,
        rpki: rpkiStatus,
      });
    }
  }

  return results;
}

import type { RPKIBatchStatus } from "@/types/api.ts";

function determineRPKIStatus(data: PrefixData, origin: number): RPKIBatchStatus {
  const rpkiRoute = data.rpkiRoutes.find((route) => route.asn === origin);

  if (rpkiRoute) {
    return rpkiRoute.rpkiStatus === "VALID" ? "valid" : "invalid";
  }

  for (const routes of Object.values(data.irrRoutes)) {
    const route = routes.find((r) => r.asn === origin);
    if (route) {
      if (route.rpkiStatus === "VALID") {
        return "valid";
      }
      if (route.rpkiStatus === "INVALID") {
        return "invalid";
      }
    }
  }

  return "unknown";
}

export function formatRPKIStatus(status: string): string {
  switch (status.toUpperCase()) {
    case "VALID":
      return "✅ Valid";
    case "INVALID":
      return "❌ Invalid";
    case "NOT_FOUND":
      return "❓ Unknown";
    default:
      return "❓ Unknown";
  }
}
