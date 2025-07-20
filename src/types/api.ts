export type RPKIStatus = "VALID" | "INVALID" | "NOT_FOUND";
export type MessageCategory = "success" | "warning" | "danger" | "info";
export type RPKIBatchStatus = "valid" | "invalid" | "unknown";

export interface IRRRoute {
  readonly rpslPk: string;
  readonly asn: number;
  readonly rpslText: string;
  readonly rpkiStatus: RPKIStatus;
  readonly rpkiMaxLength: number | null;
}

export interface RPKIRoute {
  readonly rpslPk: string;
  readonly asn: number;
  readonly rpslText: string;
  readonly rpkiStatus: RPKIStatus;
  readonly rpkiMaxLength: number;
}

export interface Message {
  readonly category: MessageCategory;
  readonly text: string;
}

export interface PrefixData {
  readonly prefixSortKeyReverseNetworklenIp: string;
  readonly messages: readonly Message[];
  readonly rpkiRoutes: readonly RPKIRoute[];
  readonly prefixSortKeyIpPrefix: string;
  readonly categoryOverall: MessageCategory;
  readonly irrRoutes: Readonly<Record<string, readonly IRRRoute[]>>;
  readonly bgpOrigins: readonly number[];
  readonly goodnessOverall: number;
  readonly prefix: string;
  readonly rir: string;
}

export interface ASNResponse {
  readonly directOrigin: readonly PrefixData[];
  readonly overlaps: readonly PrefixData[];
}

export interface PrefixResponse extends ReadonlyArray<PrefixData> {}

export type APIResponse = ASNResponse | PrefixResponse;

export interface BatchResult {
  readonly subnet: string;
  readonly origin: number;
  readonly rpki: RPKIBatchStatus;
}