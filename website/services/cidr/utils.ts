// CIDR Calculator Utility Functions

import type { CIDRRange, ParsedCIDR, IPVersion } from "./types";
import { PRIVATE_RANGES, IP_CLASSES, BITS_PER_OCTET, IPV6_PRIVATE_RANGES, IPV6_GROUPS, IPV6_TOTAL_BITS } from "./constants";
import { expandIPv6, compressIPv6, isIPv6 } from "./validation";

/**
 * Parse an IP address string to an array of octets
 */
export function parseIP(ip: string): number[] {
    return ip.split(".").map(Number);
}

/**
 * Convert an array of octets to an IP string
 */
export function octetsToIP(octets: number[]): string {
    return octets.join(".");
}

/**
 * Convert an IP array to a 32-bit integer
 */
export function ipToInt(octets: number[]): number {
    return ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0;
}

/**
 * Convert a 32-bit integer to an IP array
 */
export function intToOctets(int: number): number[] {
    return [
        (int >>> 24) & 255,
        (int >>> 16) & 255,
        (int >>> 8) & 255,
        int & 255,
    ];
}

/**
 * Convert a 32-bit integer to an IP string
 */
export function intToIP(int: number): string {
    return octetsToIP(intToOctets(int));
}

/**
 * Calculate the subnet mask from prefix length
 */
export function prefixToMask(prefix: number): number {
    if (prefix === 0) return 0;
    return (~0 << (32 - prefix)) >>> 0;
}

/**
 * Convert prefix length to dotted decimal subnet mask
 */
export function prefixToSubnetMask(prefix: number): string {
    const mask = prefixToMask(prefix);
    return intToIP(mask);
}

/**
 * Convert prefix length to wildcard mask
 */
export function prefixToWildcardMask(prefix: number): string {
    const mask = prefixToMask(prefix);
    const wildcard = (~mask) >>> 0;
    return intToIP(wildcard);
}

/**
 * Calculate the number of total hosts in a subnet (IPv4)
 */
export function calculateTotalHosts(prefix: number): string {
    if (prefix === 32) return "1";
    return Math.pow(2, 32 - prefix).toString();
}

/**
 * Calculate the number of usable hosts in a subnet (IPv4)
 */
export function calculateUsableHosts(prefix: number): string {
    if (prefix >= 31) return prefix === 32 ? "1" : "2";
    return (Math.pow(2, 32 - prefix) - 2).toString();
}

/**
 * Get the network address from an IP and prefix
 */
export function getNetworkAddress(ipInt: number, prefix: number): number {
    const mask = prefixToMask(prefix);
    return (ipInt & mask) >>> 0;
}

/**
 * Get the broadcast address from an IP and prefix
 */
export function getBroadcastAddress(ipInt: number, prefix: number): number {
    const mask = prefixToMask(prefix);
    const wildcard = (~mask) >>> 0;
    const network = (ipInt & mask) >>> 0;
    return (network | wildcard) >>> 0;
}

/**
 * Get the first usable host address
 */
export function getFirstUsableAddress(networkInt: number, prefix: number): number {
    if (prefix >= 31) return networkInt;
    return networkInt + 1;
}

/**
 * Get the last usable host address
 */
export function getLastUsableAddress(broadcastInt: number, prefix: number): number {
    if (prefix >= 31) return broadcastInt;
    return broadcastInt - 1;
}

/**
 * Convert an IP integer to binary string
 */
export function ipToBinary(ipInt: number): string {
    return ipInt.toString(2).padStart(32, "0");
}

/**
 * Format binary string with dots between octets
 */
export function formatBinaryIP(binary: string): string {
    return [
        binary.slice(0, 8),
        binary.slice(8, 16),
        binary.slice(16, 24),
        binary.slice(24, 32),
    ].join(".");
}

/**
 * Determine the IP class
 */
export function getIPClass(firstOctet: number): string {
    for (const ipClass of IP_CLASSES) {
        if (firstOctet >= ipClass.start && firstOctet <= ipClass.end) {
            return ipClass.class;
        }
    }
    return "Unknown";
}

/**
 * Check if an IP is in a private range
 */
export function isPrivateIP(ipInt: number): boolean {
    for (const range of PRIVATE_RANGES) {
        const startInt = ipToInt(parseIP(range.start));
        const endInt = ipToInt(parseIP(range.end));
        if (ipInt >= startInt && ipInt <= endInt) {
            return true;
        }
    }
    return false;
}

/**
 * Parse a CIDR string into components (IPv4)
 */
export function parseCIDR(cidr: string): ParsedCIDR {
    const [ipStr, prefixStr] = cidr.split("/");
    const ip = parseIP(ipStr);
    const prefixLength = parseInt(prefixStr, 10);
    const networkInt = getNetworkAddress(ipToInt(ip), prefixLength);

    return {
        ip,
        prefixLength,
        networkInt,
        ipVersion: 4,
    };
}

/**
 * Generate a unique ID for a CIDR range
 */
export function generateRangeId(): string {
    return `cidr-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Calculate full CIDR range information (IPv4)
 */
export function calculateCIDRRange(cidr: string): CIDRRange {
    const [ipStr, prefixStr] = cidr.split("/");
    const prefix = parseInt(prefixStr, 10);
    const octets = parseIP(ipStr);
    const ipInt = ipToInt(octets);

    const networkInt = getNetworkAddress(ipInt, prefix);
    const broadcastInt = getBroadcastAddress(ipInt, prefix);
    const firstUsableInt = getFirstUsableAddress(networkInt, prefix);
    const lastUsableInt = getLastUsableAddress(broadcastInt, prefix);

    return {
        id: generateRangeId(),
        cidr: `${intToIP(networkInt)}/${prefix}`,
        networkAddress: intToIP(networkInt),
        broadcastAddress: intToIP(broadcastInt),
        firstUsable: intToIP(firstUsableInt),
        lastUsable: intToIP(lastUsableInt),
        subnetMask: prefixToSubnetMask(prefix),
        wildcardMask: prefixToWildcardMask(prefix),
        totalHosts: calculateTotalHosts(prefix),
        usableHosts: calculateUsableHosts(prefix),
        prefixLength: prefix,
        ipClass: getIPClass(octets[0]),
        isPrivate: isPrivateIP(networkInt),
        binaryNetwork: formatBinaryIP(ipToBinary(networkInt)),
        ipVersion: 4,
    };
}

/**
 * Normalize a CIDR to its network address (IPv4)
 */
export function normalizeCIDR(cidr: string): string {
    const [ipStr, prefixStr] = cidr.split("/");
    const prefix = parseInt(prefixStr, 10);
    const octets = parseIP(ipStr);
    const ipInt = ipToInt(octets);
    const networkInt = getNetworkAddress(ipInt, prefix);
    return `${intToIP(networkInt)}/${prefix}`;
}

// ==================== IPv6 Utility Functions ====================

/**
 * Parse IPv6 address to an array of 16-bit groups
 */
export function parseIPv6(ip: string): number[] {
    const expanded = expandIPv6(ip);
    if (!expanded) return [];
    return expanded.split(":").map((g) => parseInt(g, 16));
}

/**
 * Convert IPv6 groups to a full hex string (32 hex digits)
 */
export function ipv6GroupsToHex(groups: number[]): string {
    return groups.map((g) => g.toString(16).padStart(4, "0")).join("");
}

/**
 * Convert a 32-character hex string to IPv6 groups
 */
export function hexToIPv6Groups(hex: string): number[] {
    const groups: number[] = [];
    for (let i = 0; i < 32; i += 4) {
        groups.push(parseInt(hex.slice(i, i + 4), 16));
    }
    return groups;
}

/**
 * Convert IPv6 groups to compressed string
 */
export function ipv6GroupsToString(groups: number[]): string {
    const fullAddr = groups.map((g) => g.toString(16).padStart(4, "0")).join(":");
    return compressIPv6(fullAddr);
}

/**
 * Calculate IPv6 network address from hex and prefix
 */
export function getIPv6NetworkHex(ipHex: string, prefix: number): string {
    // Convert to binary, mask, and convert back
    const binary = ipHex.split("").map((c) => parseInt(c, 16).toString(2).padStart(4, "0")).join("");
    const networkBits = binary.slice(0, prefix).padEnd(128, "0");

    // Convert binary back to hex
    let result = "";
    for (let i = 0; i < 128; i += 4) {
        result += parseInt(networkBits.slice(i, i + 4), 2).toString(16);
    }
    return result;
}

/**
 * Calculate IPv6 broadcast/last address from hex and prefix
 */
export function getIPv6BroadcastHex(networkHex: string, prefix: number): string {
    // Convert to binary, set host bits to 1
    const binary = networkHex.split("").map((c) => parseInt(c, 16).toString(2).padStart(4, "0")).join("");
    const broadcastBits = binary.slice(0, prefix).padEnd(128, "1");

    // Convert binary back to hex
    let result = "";
    for (let i = 0; i < 128; i += 4) {
        result += parseInt(broadcastBits.slice(i, i + 4), 2).toString(16);
    }
    return result;
}

/**
 * Calculate total hosts for IPv6 prefix (returns string for large numbers)
 */
export function calculateIPv6TotalHosts(prefix: number): string {
    if (prefix === 128) return "1";
    const hostBits = 128 - prefix;
    // Use BigInt for proper large number calculation
    const result = BigInt(1) << BigInt(hostBits);
    return result.toString();
}

/**
 * Calculate usable hosts for IPv6 prefix
 */
export function calculateIPv6UsableHosts(prefix: number): string {
    // In IPv6, typically all addresses are usable (no network/broadcast in traditional sense)
    return calculateIPv6TotalHosts(prefix);
}

/**
 * Convert hex string to binary with colons
 */
export function formatIPv6Binary(hex: string): string {
    const binary = hex.split("").map((c) => parseInt(c, 16).toString(2).padStart(4, "0")).join("");
    // Group by 16 bits (one IPv6 group)
    const groups: string[] = [];
    for (let i = 0; i < 128; i += 16) {
        groups.push(binary.slice(i, i + 16));
    }
    return groups.join(":");
}

/**
 * Check if IPv6 is private/local
 */
export function isPrivateIPv6(hex: string): boolean {
    // ULA (fc00::/7) - starts with fc or fd
    if (hex.startsWith("fc") || hex.startsWith("fd")) return true;
    // Link-local (fe80::/10) - starts with fe8, fe9, fea, feb
    if (hex.startsWith("fe8") || hex.startsWith("fe9") || hex.startsWith("fea") || hex.startsWith("feb")) return true;
    return false;
}

/**
 * Get IPv6 address type
 */
export function getIPv6Type(hex: string): string {
    if (hex === "00000000000000000000000000000000") return "Unspecified";
    if (hex === "00000000000000000000000000000001") return "Loopback";
    if (hex.startsWith("fc") || hex.startsWith("fd")) return "Unique Local (ULA)";
    if (hex.startsWith("fe8") || hex.startsWith("fe9") || hex.startsWith("fea") || hex.startsWith("feb")) return "Link-Local";
    if (hex.startsWith("ff")) return "Multicast";
    if (hex.startsWith("2001") && hex.slice(4, 8) === "0db8") return "Documentation";
    if (hex.startsWith("2")) return "Global Unicast";
    return "Reserved";
}

/**
 * Calculate full IPv6 CIDR range information
 */
export function calculateIPv6CIDRRange(cidr: string): CIDRRange {
    const lastSlash = cidr.lastIndexOf("/");
    const ipStr = cidr.substring(0, lastSlash);
    const prefix = parseInt(cidr.substring(lastSlash + 1), 10);

    const groups = parseIPv6(ipStr);
    const ipHex = ipv6GroupsToHex(groups);

    const networkHex = getIPv6NetworkHex(ipHex, prefix);
    const broadcastHex = getIPv6BroadcastHex(networkHex, prefix);

    const networkGroups = hexToIPv6Groups(networkHex);
    const broadcastGroups = hexToIPv6Groups(broadcastHex);

    // First usable is network + 1 (for /128 it's the same)
    const firstUsableHex = prefix === 128 ? networkHex : incrementIPv6Hex(networkHex);
    const lastUsableHex = prefix === 128 ? broadcastHex : decrementIPv6Hex(broadcastHex);

    return {
        id: generateRangeId(),
        cidr: `${ipv6GroupsToString(networkGroups)}/${prefix}`,
        networkAddress: ipv6GroupsToString(networkGroups),
        broadcastAddress: ipv6GroupsToString(broadcastGroups),
        firstUsable: ipv6GroupsToString(hexToIPv6Groups(firstUsableHex)),
        lastUsable: ipv6GroupsToString(hexToIPv6Groups(lastUsableHex)),
        subnetMask: `/${prefix}`,
        wildcardMask: `/${128 - prefix} host bits`,
        totalHosts: calculateIPv6TotalHosts(prefix),
        usableHosts: calculateIPv6UsableHosts(prefix),
        prefixLength: prefix,
        ipClass: getIPv6Type(networkHex),
        isPrivate: isPrivateIPv6(networkHex),
        binaryNetwork: formatIPv6Binary(networkHex),
        ipVersion: 6,
    };
}

/**
 * Increment IPv6 hex by 1
 */
function incrementIPv6Hex(hex: string): string {
    const groups = hexToIPv6Groups(hex);
    for (let i = groups.length - 1; i >= 0; i--) {
        if (groups[i] < 0xFFFF) {
            groups[i]++;
            break;
        }
        groups[i] = 0;
    }
    return ipv6GroupsToHex(groups);
}

/**
 * Decrement IPv6 hex by 1
 */
function decrementIPv6Hex(hex: string): string {
    const groups = hexToIPv6Groups(hex);
    for (let i = groups.length - 1; i >= 0; i--) {
        if (groups[i] > 0) {
            groups[i]--;
            break;
        }
        groups[i] = 0xFFFF;
    }
    return ipv6GroupsToHex(groups);
}

/**
 * Normalize an IPv6 CIDR to its network address
 */
export function normalizeIPv6CIDR(cidr: string): string {
    const lastSlash = cidr.lastIndexOf("/");
    const ipStr = cidr.substring(0, lastSlash);
    const prefix = parseInt(cidr.substring(lastSlash + 1), 10);

    const groups = parseIPv6(ipStr);
    const ipHex = ipv6GroupsToHex(groups);
    const networkHex = getIPv6NetworkHex(ipHex, prefix);
    const networkGroups = hexToIPv6Groups(networkHex);

    return `${ipv6GroupsToString(networkGroups)}/${prefix}`;
}

/**
 * Universal CIDR calculation (detects IPv4 or IPv6)
 */
export function calculateUniversalCIDRRange(cidr: string): CIDRRange {
    const ipPart = cidr.split("/")[0];
    if (isIPv6(ipPart)) {
        return calculateIPv6CIDRRange(cidr);
    }
    return calculateCIDRRange(cidr);
}

/**
 * Universal CIDR normalization (detects IPv4 or IPv6)
 */
export function normalizeUniversalCIDR(cidr: string): string {
    const ipPart = cidr.split("/")[0];
    if (isIPv6(ipPart)) {
        return normalizeIPv6CIDR(cidr);
    }
    return normalizeCIDR(cidr);
}