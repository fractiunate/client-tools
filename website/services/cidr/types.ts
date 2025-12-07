// CIDR Calculator Types

export type IPVersion = 4 | 6;

export interface CIDRRange {
    id: string;
    cidr: string;
    networkAddress: string;
    broadcastAddress: string;
    firstUsable: string;
    lastUsable: string;
    subnetMask: string;
    wildcardMask: string;
    totalHosts: string;
    usableHosts: string;
    prefixLength: number;
    ipClass: string;
    isPrivate: boolean;
    binaryNetwork: string;
    ipVersion: IPVersion;
}

export interface CIDROverlap {
    range1Id: string;
    range2Id: string;
    range1Cidr: string;
    range2Cidr: string;
    overlapType: "contains" | "contained" | "partial";
}

export interface SuggestedRange {
    cidr: string;
    reason: string;
    totalHosts: string;
    usableHosts: string;
}

export interface CIDRValidationResult {
    valid: boolean;
    error?: string;
}

export interface ParsedCIDR {
    ip: number[];
    prefixLength: number;
    networkInt: number;
    ipVersion: IPVersion;
}

// IPv6 uses string representation for the 128-bit values
export interface ParsedIPv6CIDR {
    groups: number[];
    prefixLength: number;
    networkHex: string;
    ipVersion: 6;
}
