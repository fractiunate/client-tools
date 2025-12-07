// CIDR Validation Functions

import type { CIDRValidationResult, IPVersion } from "./types";
import {
    MAX_IP_VALUE,
    MIN_PREFIX_LENGTH,
    MAX_PREFIX_LENGTH,
    IP_OCTETS,
    IPV6_MAX_PREFIX_LENGTH,
    IPV6_GROUPS,
    IPV6_MAX_GROUP_VALUE,
} from "./constants";

/**
 * Validate an IP address string
 */
export function validateIPAddress(ip: string): CIDRValidationResult {
    if (!ip || typeof ip !== "string") {
        return { valid: false, error: "IP address is required" };
    }

    const trimmed = ip.trim();
    if (!trimmed) {
        return { valid: false, error: "IP address cannot be empty" };
    }

    const octets = trimmed.split(".");
    if (octets.length !== IP_OCTETS) {
        return { valid: false, error: "IP address must have exactly 4 octets" };
    }

    for (let i = 0; i < octets.length; i++) {
        const octet = octets[i];

        // Check for empty octet
        if (!octet) {
            return { valid: false, error: `Octet ${i + 1} is empty` };
        }

        // Check for leading zeros (except for "0" itself)
        if (octet.length > 1 && octet.startsWith("0")) {
            return { valid: false, error: `Octet ${i + 1} has leading zeros` };
        }

        // Check if it's a valid number
        if (!/^\d+$/.test(octet)) {
            return { valid: false, error: `Octet ${i + 1} is not a valid number` };
        }

        const value = parseInt(octet, 10);
        if (isNaN(value) || value < 0 || value > MAX_IP_VALUE) {
            return { valid: false, error: `Octet ${i + 1} must be between 0 and ${MAX_IP_VALUE}` };
        }
    }

    return { valid: true };
}

/**
 * Validate a prefix length
 */
export function validatePrefixLength(prefix: number | string): CIDRValidationResult {
    const prefixNum = typeof prefix === "string" ? parseInt(prefix, 10) : prefix;

    if (isNaN(prefixNum)) {
        return { valid: false, error: "Prefix length must be a number" };
    }

    if (!Number.isInteger(prefixNum)) {
        return { valid: false, error: "Prefix length must be an integer" };
    }

    if (prefixNum < MIN_PREFIX_LENGTH || prefixNum > MAX_PREFIX_LENGTH) {
        return { valid: false, error: `Prefix length must be between ${MIN_PREFIX_LENGTH} and ${MAX_PREFIX_LENGTH}` };
    }

    return { valid: true };
}

/**
 * Validate a CIDR notation string (e.g., "192.168.1.0/24")
 * If no prefix is given, assumes /32 (single IP)
 */
export function validateCIDR(cidr: string): CIDRValidationResult {
    if (!cidr || typeof cidr !== "string") {
        return { valid: false, error: "CIDR notation is required" };
    }

    const trimmed = cidr.trim();
    if (!trimmed) {
        return { valid: false, error: "CIDR notation cannot be empty" };
    }

    const parts = trimmed.split("/");

    // If no prefix given, treat as single IP (/32)
    if (parts.length === 1) {
        const ipValidation = validateIPAddress(parts[0]);
        if (!ipValidation.valid) {
            return ipValidation;
        }
        return { valid: true };
    }

    if (parts.length !== 2) {
        return { valid: false, error: "CIDR must be in format IP/prefix (e.g., 192.168.1.0/24)" };
    }

    const [ip, prefix] = parts;

    const ipValidation = validateIPAddress(ip);
    if (!ipValidation.valid) {
        return ipValidation;
    }

    const prefixValidation = validatePrefixLength(prefix);
    if (!prefixValidation.valid) {
        return prefixValidation;
    }

    return { valid: true };
}

/**
 * Normalize CIDR input - adds /32 if no prefix given
 */
export function normalizeCIDRInput(cidr: string): string {
    const trimmed = cidr.trim();
    if (!trimmed.includes("/")) {
        return `${trimmed}/32`;
    }
    return trimmed;
}

/**
 * Check if a CIDR is properly aligned (network address matches the prefix)
 */
export function validateCIDRAlignment(cidr: string): CIDRValidationResult {
    const basicValidation = validateCIDR(cidr);
    if (!basicValidation.valid) {
        return basicValidation;
    }

    const [ip, prefixStr] = cidr.split("/");
    const prefix = parseInt(prefixStr, 10);
    const octets = ip.split(".").map(Number);

    // Calculate the network address (use >>> 0 to ensure unsigned)
    const ipInt = ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0;
    const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
    const networkInt = (ipInt & mask) >>> 0;

    if (ipInt !== networkInt) {
        // Calculate what the correct network address should be
        const correctOctets = [
            (networkInt >>> 24) & 255,
            (networkInt >>> 16) & 255,
            (networkInt >>> 8) & 255,
            networkInt & 255,
        ];
        const correctNetwork = correctOctets.join(".");
        return {
            valid: false,
            error: `IP address is not aligned with the prefix. Did you mean ${correctNetwork}/${prefix}?`,
        };
    }

    return { valid: true };
}

// ==================== IPv6 Validation Functions ====================

/**
 * Detect if an input string is IPv6
 */
export function isIPv6(input: string): boolean {
    return input.includes(":");
}

/**
 * Detect IP version from string
 */
export function detectIPVersion(input: string): IPVersion {
    return isIPv6(input) ? 6 : 4;
}

/**
 * Expand an IPv6 address to its full form (8 groups, no ::)
 */
export function expandIPv6(ip: string): string | null {
    const trimmed = ip.trim().toLowerCase();

    // Handle :: notation
    if (trimmed.includes("::")) {
        const parts = trimmed.split("::");
        if (parts.length > 2) {
            return null; // Only one :: allowed
        }

        const left = parts[0] ? parts[0].split(":") : [];
        const right = parts[1] ? parts[1].split(":") : [];
        const missing = IPV6_GROUPS - left.length - right.length;

        if (missing < 0) {
            return null;
        }

        const middle = Array(missing).fill("0");
        const groups = [...left, ...middle, ...right];

        // Pad each group to 4 hex digits
        return groups.map((g) => g.padStart(4, "0")).join(":");
    }

    // No :: notation
    const groups = trimmed.split(":");
    if (groups.length !== IPV6_GROUPS) {
        return null;
    }

    // Pad each group to 4 hex digits
    return groups.map((g) => g.padStart(4, "0")).join(":");
}

/**
 * Compress an IPv6 address (apply :: for longest run of zeros)
 */
export function compressIPv6(ip: string): string {
    const expanded = expandIPv6(ip);
    if (!expanded) return ip;

    const groups = expanded.split(":");

    // Remove leading zeros from each group
    const simplified = groups.map((g) => g.replace(/^0+/, "") || "0");

    // Find longest run of zeros
    let longestStart = -1;
    let longestLength = 0;
    let currentStart = -1;
    let currentLength = 0;

    for (let i = 0; i < simplified.length; i++) {
        if (simplified[i] === "0") {
            if (currentStart === -1) {
                currentStart = i;
                currentLength = 1;
            } else {
                currentLength++;
            }
        } else {
            if (currentLength > longestLength) {
                longestStart = currentStart;
                longestLength = currentLength;
            }
            currentStart = -1;
            currentLength = 0;
        }
    }

    // Check end of array
    if (currentLength > longestLength) {
        longestStart = currentStart;
        longestLength = currentLength;
    }

    // Only compress if there's a run of 2 or more zeros
    if (longestLength >= 2) {
        const left = simplified.slice(0, longestStart);
        const right = simplified.slice(longestStart + longestLength);

        if (left.length === 0 && right.length === 0) {
            return "::";
        } else if (left.length === 0) {
            return "::" + right.join(":");
        } else if (right.length === 0) {
            return left.join(":") + "::";
        } else {
            return left.join(":") + "::" + right.join(":");
        }
    }

    return simplified.join(":");
}

/**
 * Validate an IPv6 address string
 */
export function validateIPv6Address(ip: string): CIDRValidationResult {
    if (!ip || typeof ip !== "string") {
        return { valid: false, error: "IPv6 address is required" };
    }

    const trimmed = ip.trim().toLowerCase();
    if (!trimmed) {
        return { valid: false, error: "IPv6 address cannot be empty" };
    }

    // Expand the address
    const expanded = expandIPv6(trimmed);
    if (!expanded) {
        return { valid: false, error: "Invalid IPv6 format" };
    }

    const groups = expanded.split(":");

    for (let i = 0; i < groups.length; i++) {
        const group = groups[i];

        // Check if it's a valid hex number
        if (!/^[0-9a-f]{1,4}$/i.test(group)) {
            return { valid: false, error: `Group ${i + 1} is not valid hexadecimal` };
        }

        const value = parseInt(group, 16);
        if (isNaN(value) || value < 0 || value > IPV6_MAX_GROUP_VALUE) {
            return { valid: false, error: `Group ${i + 1} must be between 0 and ${IPV6_MAX_GROUP_VALUE.toString(16)}` };
        }
    }

    return { valid: true };
}

/**
 * Validate an IPv6 prefix length
 */
export function validateIPv6PrefixLength(prefix: number | string): CIDRValidationResult {
    const prefixNum = typeof prefix === "string" ? parseInt(prefix, 10) : prefix;

    if (isNaN(prefixNum)) {
        return { valid: false, error: "Prefix length must be a number" };
    }

    if (!Number.isInteger(prefixNum)) {
        return { valid: false, error: "Prefix length must be an integer" };
    }

    if (prefixNum < 0 || prefixNum > IPV6_MAX_PREFIX_LENGTH) {
        return { valid: false, error: `IPv6 prefix length must be between 0 and ${IPV6_MAX_PREFIX_LENGTH}` };
    }

    return { valid: true };
}

/**
 * Validate an IPv6 CIDR notation string (e.g., "2001:db8::/32")
 * If no prefix is given, assumes /128 (single IP)
 */
export function validateIPv6CIDR(cidr: string): CIDRValidationResult {
    if (!cidr || typeof cidr !== "string") {
        return { valid: false, error: "IPv6 CIDR notation is required" };
    }

    const trimmed = cidr.trim();
    if (!trimmed) {
        return { valid: false, error: "IPv6 CIDR notation cannot be empty" };
    }

    // Handle IPv6 CIDR with prefix
    const lastSlash = trimmed.lastIndexOf("/");

    if (lastSlash === -1) {
        // No prefix, treat as single IP (/128)
        const ipValidation = validateIPv6Address(trimmed);
        if (!ipValidation.valid) {
            return ipValidation;
        }
        return { valid: true };
    }

    const ip = trimmed.substring(0, lastSlash);
    const prefix = trimmed.substring(lastSlash + 1);

    const ipValidation = validateIPv6Address(ip);
    if (!ipValidation.valid) {
        return ipValidation;
    }

    const prefixValidation = validateIPv6PrefixLength(prefix);
    if (!prefixValidation.valid) {
        return prefixValidation;
    }

    return { valid: true };
}

/**
 * Normalize IPv6 CIDR input - adds /128 if no prefix given
 */
export function normalizeIPv6CIDRInput(cidr: string): string {
    const trimmed = cidr.trim();
    if (!trimmed.includes("/")) {
        return `${trimmed}/128`;
    }
    return trimmed;
}

/**
 * Universal CIDR validation (detects IPv4 or IPv6)
 */
export function validateUniversalCIDR(cidr: string): CIDRValidationResult {
    if (!cidr || typeof cidr !== "string") {
        return { valid: false, error: "CIDR notation is required" };
    }

    const trimmed = cidr.trim();
    if (!trimmed) {
        return { valid: false, error: "CIDR notation cannot be empty" };
    }

    // Detect IP version
    const ipPart = trimmed.split("/")[0];
    if (isIPv6(ipPart)) {
        return validateIPv6CIDR(trimmed);
    } else {
        return validateCIDR(trimmed);
    }
}

/**
 * Universal CIDR input normalization (detects IPv4 or IPv6)
 */
export function normalizeUniversalCIDRInput(cidr: string): string {
    const trimmed = cidr.trim();
    const ipPart = trimmed.split("/")[0];

    if (isIPv6(ipPart)) {
        return normalizeIPv6CIDRInput(trimmed);
    } else {
        return normalizeCIDRInput(trimmed);
    }
}