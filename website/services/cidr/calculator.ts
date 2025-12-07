// CIDR Calculator - Main Calculator Functions

import type { CIDRRange, CIDROverlap, SuggestedRange } from "./types";
import {
    parseCIDR,
    ipToInt,
    intToIP,
    parseIP,
    getNetworkAddress,
    getBroadcastAddress,
    calculateTotalHosts,
    calculateUsableHosts,
    prefixToMask,
    parseIPv6,
    ipv6GroupsToHex,
    getIPv6NetworkHex,
    getIPv6BroadcastHex,
} from "./utils";
import { isIPv6 } from "./validation";

/**
 * Compare two hex strings (for IPv6 comparison)
 */
function compareHex(a: string, b: string): number {
    if (a.length !== b.length) return a.length - b.length;
    return a.localeCompare(b);
}

/**
 * Check if two CIDR ranges overlap (works for both IPv4 and IPv6)
 */
export function checkOverlap(range1: CIDRRange, range2: CIDRRange): CIDROverlap | null {
    // Both ranges must be the same IP version
    if (range1.ipVersion !== range2.ipVersion) {
        return null;
    }

    if (range1.ipVersion === 6) {
        return checkIPv6Overlap(range1, range2);
    }

    return checkIPv4Overlap(range1, range2);
}

/**
 * Check IPv4 overlap
 */
function checkIPv4Overlap(range1: CIDRRange, range2: CIDRRange): CIDROverlap | null {
    const parsed1 = parseCIDR(range1.cidr);
    const parsed2 = parseCIDR(range2.cidr);

    const network1Start = parsed1.networkInt;
    const network1End = getBroadcastAddress(parsed1.networkInt, parsed1.prefixLength);
    const network2Start = parsed2.networkInt;
    const network2End = getBroadcastAddress(parsed2.networkInt, parsed2.prefixLength);

    // Check if range1 contains range2
    if (network1Start <= network2Start && network1End >= network2End) {
        return {
            range1Id: range1.id,
            range2Id: range2.id,
            range1Cidr: range1.cidr,
            range2Cidr: range2.cidr,
            overlapType: "contains",
        };
    }

    // Check if range2 contains range1
    if (network2Start <= network1Start && network2End >= network1End) {
        return {
            range1Id: range1.id,
            range2Id: range2.id,
            range1Cidr: range1.cidr,
            range2Cidr: range2.cidr,
            overlapType: "contained",
        };
    }

    // Check for partial overlap
    if (
        (network1Start <= network2End && network1End >= network2Start) ||
        (network2Start <= network1End && network2End >= network1Start)
    ) {
        return {
            range1Id: range1.id,
            range2Id: range2.id,
            range1Cidr: range1.cidr,
            range2Cidr: range2.cidr,
            overlapType: "partial",
        };
    }

    return null;
}

/**
 * Check IPv6 overlap using hex string comparison
 */
function checkIPv6Overlap(range1: CIDRRange, range2: CIDRRange): CIDROverlap | null {
    const lastSlash1 = range1.cidr.lastIndexOf("/");
    const lastSlash2 = range2.cidr.lastIndexOf("/");
    const ip1 = range1.cidr.substring(0, lastSlash1);
    const ip2 = range2.cidr.substring(0, lastSlash2);
    const prefix1 = parseInt(range1.cidr.substring(lastSlash1 + 1), 10);
    const prefix2 = parseInt(range2.cidr.substring(lastSlash2 + 1), 10);

    const groups1 = parseIPv6(ip1);
    const groups2 = parseIPv6(ip2);
    const hex1 = ipv6GroupsToHex(groups1);
    const hex2 = ipv6GroupsToHex(groups2);

    const network1Start = getIPv6NetworkHex(hex1, prefix1);
    const network1End = getIPv6BroadcastHex(network1Start, prefix1);
    const network2Start = getIPv6NetworkHex(hex2, prefix2);
    const network2End = getIPv6BroadcastHex(network2Start, prefix2);

    // Check if range1 contains range2
    if (compareHex(network1Start, network2Start) <= 0 && compareHex(network1End, network2End) >= 0) {
        return {
            range1Id: range1.id,
            range2Id: range2.id,
            range1Cidr: range1.cidr,
            range2Cidr: range2.cidr,
            overlapType: "contains",
        };
    }

    // Check if range2 contains range1
    if (compareHex(network2Start, network1Start) <= 0 && compareHex(network2End, network1End) >= 0) {
        return {
            range1Id: range1.id,
            range2Id: range2.id,
            range1Cidr: range1.cidr,
            range2Cidr: range2.cidr,
            overlapType: "contained",
        };
    }

    // Check for partial overlap
    if (
        (compareHex(network1Start, network2End) <= 0 && compareHex(network1End, network2Start) >= 0) ||
        (compareHex(network2Start, network1End) <= 0 && compareHex(network2End, network1Start) >= 0)
    ) {
        return {
            range1Id: range1.id,
            range2Id: range2.id,
            range1Cidr: range1.cidr,
            range2Cidr: range2.cidr,
            overlapType: "partial",
        };
    }

    return null;
}

/**
 * Find all overlaps in a list of CIDR ranges
 */
export function findAllOverlaps(ranges: CIDRRange[]): CIDROverlap[] {
    const overlaps: CIDROverlap[] = [];

    for (let i = 0; i < ranges.length; i++) {
        for (let j = i + 1; j < ranges.length; j++) {
            const overlap = checkOverlap(ranges[i], ranges[j]);
            if (overlap) {
                overlaps.push(overlap);
            }
        }
    }

    return overlaps;
}

/**
 * Find the next available CIDR block after a given network
 */
export function findNextAvailableBlock(
    afterNetwork: number,
    prefix: number,
    existingRanges: CIDRRange[]
): string | null {
    const blockSize = Math.pow(2, 32 - prefix);
    let candidate = afterNetwork + blockSize;

    // Align to the block size
    candidate = Math.floor(candidate / blockSize) * blockSize;

    // Maximum iterations to prevent infinite loop
    const maxIterations = 1000;
    let iterations = 0;

    while (iterations < maxIterations && candidate < 0xFFFFFFFF) {
        const candidateEnd = candidate + blockSize - 1;

        // Check if this candidate overlaps with any existing range
        let hasOverlap = false;
        for (const range of existingRanges) {
            const parsed = parseCIDR(range.cidr);
            const rangeStart = parsed.networkInt;
            const rangeEnd = getBroadcastAddress(parsed.networkInt, parsed.prefixLength);

            if (candidate <= rangeEnd && candidateEnd >= rangeStart) {
                hasOverlap = true;
                // Move candidate past this range
                candidate = rangeEnd + 1;
                // Re-align to block size
                candidate = Math.ceil(candidate / blockSize) * blockSize;
                break;
            }
        }

        if (!hasOverlap) {
            return `${intToIP(candidate)}/${prefix}`;
        }

        iterations++;
    }

    return null;
}

/**
 * Suggest non-overlapping ranges based on existing ranges
 */
export function suggestRanges(existingRanges: CIDRRange[], preferPrivate: boolean = true): SuggestedRange[] {
    const suggestions: SuggestedRange[] = [];

    // Common prefix lengths to suggest
    const prefixesToTry = [24, 25, 26, 27, 28];

    // Starting points for suggestions (private ranges)
    const startingPoints = preferPrivate
        ? [
            ipToInt(parseIP("10.0.0.0")),
            ipToInt(parseIP("172.16.0.0")),
            ipToInt(parseIP("192.168.0.0")),
        ]
        : [0];

    for (const startPoint of startingPoints) {
        for (const prefix of prefixesToTry) {
            const suggested = findNextAvailableBlock(startPoint, prefix, existingRanges);
            if (suggested) {
                const totalHosts = calculateTotalHosts(prefix);
                const usableHosts = calculateUsableHosts(prefix);

                // Check if it's in a private range for the reason
                const suggestedInt = ipToInt(parseIP(suggested.split("/")[0]));
                let reason = `Available /${prefix} block`;

                if (suggestedInt >= ipToInt(parseIP("10.0.0.0")) && suggestedInt <= ipToInt(parseIP("10.255.255.255"))) {
                    reason = `Available in 10.0.0.0/8 private range`;
                } else if (suggestedInt >= ipToInt(parseIP("172.16.0.0")) && suggestedInt <= ipToInt(parseIP("172.31.255.255"))) {
                    reason = `Available in 172.16.0.0/12 private range`;
                } else if (suggestedInt >= ipToInt(parseIP("192.168.0.0")) && suggestedInt <= ipToInt(parseIP("192.168.255.255"))) {
                    reason = `Available in 192.168.0.0/16 private range`;
                }

                suggestions.push({
                    cidr: suggested,
                    reason,
                    totalHosts,
                    usableHosts,
                });

                // Only add one suggestion per prefix per starting point
                break;
            }
        }
    }

    return suggestions.slice(0, 5); // Return top 5 suggestions
}

/**
 * Split a CIDR range into smaller subnets
 */
export function splitCIDR(cidr: string, newPrefix: number): string[] {
    const parsed = parseCIDR(cidr);

    if (newPrefix <= parsed.prefixLength) {
        return [cidr]; // Can't split to a larger or equal block
    }

    const numSubnets = Math.pow(2, newPrefix - parsed.prefixLength);
    const subnetSize = Math.pow(2, 32 - newPrefix);
    const subnets: string[] = [];

    for (let i = 0; i < numSubnets; i++) {
        const subnetNetwork = parsed.networkInt + (i * subnetSize);
        subnets.push(`${intToIP(subnetNetwork)}/${newPrefix}`);
    }

    return subnets;
}

/**
 * Merge contiguous CIDR ranges if possible
 */
export function canMergeCIDRs(cidr1: string, cidr2: string): string | null {
    const parsed1 = parseCIDR(cidr1);
    const parsed2 = parseCIDR(cidr2);

    // Must have the same prefix length
    if (parsed1.prefixLength !== parsed2.prefixLength) {
        return null;
    }

    // Must be contiguous
    const broadcast1 = getBroadcastAddress(parsed1.networkInt, parsed1.prefixLength);
    const broadcast2 = getBroadcastAddress(parsed2.networkInt, parsed2.prefixLength);

    // Check if they are adjacent
    const areAdjacent =
        broadcast1 + 1 === parsed2.networkInt ||
        broadcast2 + 1 === parsed1.networkInt;

    if (!areAdjacent) {
        return null;
    }

    // Check if they can form a valid larger block
    const newPrefix = parsed1.prefixLength - 1;
    const lowerNetwork = Math.min(parsed1.networkInt, parsed2.networkInt);
    const mask = prefixToMask(newPrefix);

    // The lower network must be aligned to the new (larger) block boundary
    // For a /24, the network must be on a /24 boundary (last octet = 0)
    // For a /23, the network must be on a /23 boundary
    const alignedNetwork = (lowerNetwork & mask) >>> 0;
    if (alignedNetwork !== lowerNetwork) {
        return null;
    }

    // Also verify the higher network fits within this merged block
    const higherNetwork = Math.max(parsed1.networkInt, parsed2.networkInt);
    const mergedBroadcast = getBroadcastAddress(alignedNetwork, newPrefix);
    const higherBroadcast = getBroadcastAddress(higherNetwork, parsed1.prefixLength);

    if (higherBroadcast > mergedBroadcast) {
        return null;
    }

    return `${intToIP(alignedNetwork)}/${newPrefix}`;
}

/**
 * Calculate summary/supernet for a list of CIDRs
 */
export function calculateSupernet(cidrs: string[]): string | null {
    if (cidrs.length === 0) return null;
    if (cidrs.length === 1) return cidrs[0];

    // Find the range that covers all networks
    let minNetwork = Infinity;
    let maxBroadcast = 0;

    for (const cidr of cidrs) {
        const parsed = parseCIDR(cidr);
        const broadcast = getBroadcastAddress(parsed.networkInt, parsed.prefixLength);

        if (parsed.networkInt < minNetwork) {
            minNetwork = parsed.networkInt;
        }
        if (broadcast > maxBroadcast) {
            maxBroadcast = broadcast;
        }
    }

    // Find the smallest prefix that covers the entire range
    const range = maxBroadcast - minNetwork + 1;
    const bitsNeeded = Math.ceil(Math.log2(range));
    let prefix = 32 - bitsNeeded;

    // Ensure the network address aligns with the prefix
    while (prefix > 0) {
        const mask = prefixToMask(prefix);
        const alignedNetwork = minNetwork & mask;
        const alignedBroadcast = getBroadcastAddress(alignedNetwork, prefix);

        if (alignedNetwork <= minNetwork && alignedBroadcast >= maxBroadcast) {
            return `${intToIP(alignedNetwork)}/${prefix}`;
        }
        prefix--;
    }

    return `0.0.0.0/0`;
}
