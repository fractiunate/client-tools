import { describe, it, expect } from "vitest";
import {
    validateIPAddress,
    validatePrefixLength,
    validateCIDR,
    validateCIDRAlignment,
    normalizeCIDRInput,
    isIPv6,
    expandIPv6,
    compressIPv6,
    validateIPv6Address,
    validateIPv6CIDR,
    validateUniversalCIDR,
} from "./validation";

describe("CIDR Validation", () => {
    describe("validateIPAddress", () => {
        it("should accept valid IP addresses", () => {
            expect(validateIPAddress("192.168.1.1")).toEqual({ valid: true });
            expect(validateIPAddress("10.0.0.0")).toEqual({ valid: true });
            expect(validateIPAddress("0.0.0.0")).toEqual({ valid: true });
            expect(validateIPAddress("255.255.255.255")).toEqual({ valid: true });
            expect(validateIPAddress("172.16.0.1")).toEqual({ valid: true });
        });

        it("should reject empty or missing input", () => {
            expect(validateIPAddress("").valid).toBe(false);
            expect(validateIPAddress("   ").valid).toBe(false);
            expect(validateIPAddress(null as unknown as string).valid).toBe(false);
            expect(validateIPAddress(undefined as unknown as string).valid).toBe(false);
        });

        it("should reject IP with wrong number of octets", () => {
            expect(validateIPAddress("192.168.1").valid).toBe(false);
            expect(validateIPAddress("192.168.1.1.1").valid).toBe(false);
            expect(validateIPAddress("192.168").valid).toBe(false);
            expect(validateIPAddress("192").valid).toBe(false);
        });

        it("should reject IP with invalid octets", () => {
            expect(validateIPAddress("192.168.1.256").valid).toBe(false);
            expect(validateIPAddress("192.168.1.-1").valid).toBe(false);
            expect(validateIPAddress("192.168.1.abc").valid).toBe(false);
            expect(validateIPAddress("192.168.1.").valid).toBe(false);
            expect(validateIPAddress(".168.1.1").valid).toBe(false);
        });

        it("should reject IP with leading zeros", () => {
            expect(validateIPAddress("192.168.01.1").valid).toBe(false);
            expect(validateIPAddress("192.168.1.001").valid).toBe(false);
            expect(validateIPAddress("092.168.1.1").valid).toBe(false);
        });

        it("should accept single zero octet", () => {
            expect(validateIPAddress("0.0.0.0")).toEqual({ valid: true });
            expect(validateIPAddress("192.168.0.1")).toEqual({ valid: true });
        });
    });

    describe("validatePrefixLength", () => {
        it("should accept valid prefix lengths", () => {
            expect(validatePrefixLength(0)).toEqual({ valid: true });
            expect(validatePrefixLength(8)).toEqual({ valid: true });
            expect(validatePrefixLength(16)).toEqual({ valid: true });
            expect(validatePrefixLength(24)).toEqual({ valid: true });
            expect(validatePrefixLength(32)).toEqual({ valid: true });
        });

        it("should accept string prefix lengths", () => {
            expect(validatePrefixLength("24")).toEqual({ valid: true });
            expect(validatePrefixLength("8")).toEqual({ valid: true });
        });

        it("should reject invalid prefix lengths", () => {
            expect(validatePrefixLength(-1).valid).toBe(false);
            expect(validatePrefixLength(33).valid).toBe(false);
            expect(validatePrefixLength(100).valid).toBe(false);
        });

        it("should reject non-integer values", () => {
            expect(validatePrefixLength(24.5).valid).toBe(false);
            expect(validatePrefixLength("abc").valid).toBe(false);
            expect(validatePrefixLength(NaN).valid).toBe(false);
        });
    });

    describe("validateCIDR", () => {
        it("should accept valid CIDR notation", () => {
            expect(validateCIDR("192.168.1.0/24")).toEqual({ valid: true });
            expect(validateCIDR("10.0.0.0/8")).toEqual({ valid: true });
            expect(validateCIDR("0.0.0.0/0")).toEqual({ valid: true });
            expect(validateCIDR("192.168.1.128/25")).toEqual({ valid: true });
        });

        it("should reject missing or empty input", () => {
            expect(validateCIDR("").valid).toBe(false);
            expect(validateCIDR("   ").valid).toBe(false);
            expect(validateCIDR(null as unknown as string).valid).toBe(false);
        });

        it("should accept IP without prefix as /32 (single IP)", () => {
            expect(validateCIDR("192.168.1.0").valid).toBe(true);
            expect(validateCIDR("10.0.0.1").valid).toBe(true);
        });

        it("should reject empty prefix after slash", () => {
            expect(validateCIDR("192.168.1.0/").valid).toBe(false);
        });

        it("should reject invalid IP in CIDR", () => {
            expect(validateCIDR("192.168.1.256/24").valid).toBe(false);
            expect(validateCIDR("192.168.1/24").valid).toBe(false);
        });

        it("should reject invalid prefix in CIDR", () => {
            expect(validateCIDR("192.168.1.0/33").valid).toBe(false);
            expect(validateCIDR("192.168.1.0/-1").valid).toBe(false);
            expect(validateCIDR("192.168.1.0/abc").valid).toBe(false);
        });
    });

    describe("validateCIDRAlignment", () => {
        it("should accept aligned CIDR", () => {
            expect(validateCIDRAlignment("192.168.1.0/24")).toEqual({ valid: true });
            expect(validateCIDRAlignment("10.0.0.0/8")).toEqual({ valid: true });
            expect(validateCIDRAlignment("192.168.0.0/16")).toEqual({ valid: true });
            expect(validateCIDRAlignment("192.168.1.128/25")).toEqual({ valid: true });
        });

        it("should reject unaligned CIDR with helpful message", () => {
            const result = validateCIDRAlignment("192.168.1.5/24");
            expect(result.valid).toBe(false);
            expect(result.error).toContain("192.168.1.0/24");
        });

        it("should suggest correct network for unaligned CIDR", () => {
            const result = validateCIDRAlignment("10.0.0.100/8");
            expect(result.valid).toBe(false);
            expect(result.error).toContain("10.0.0.0/8");
        });
    });

    describe("normalizeCIDRInput", () => {
        it("should add /32 to IP without prefix", () => {
            expect(normalizeCIDRInput("192.168.1.0")).toBe("192.168.1.0/32");
            expect(normalizeCIDRInput("10.0.0.1")).toBe("10.0.0.1/32");
        });

        it("should preserve existing prefix", () => {
            expect(normalizeCIDRInput("192.168.1.0/24")).toBe("192.168.1.0/24");
            expect(normalizeCIDRInput("10.0.0.0/8")).toBe("10.0.0.0/8");
        });

        it("should trim whitespace", () => {
            expect(normalizeCIDRInput("  192.168.1.0  ")).toBe("192.168.1.0/32");
            expect(normalizeCIDRInput("  10.0.0.0/8  ")).toBe("10.0.0.0/8");
        });
    });

    // ==================== IPv6 Tests ====================

    describe("isIPv6", () => {
        it("should detect IPv6 addresses", () => {
            expect(isIPv6("2001:db8::1")).toBe(true);
            expect(isIPv6("::1")).toBe(true);
            expect(isIPv6("fe80::1")).toBe(true);
        });

        it("should not detect IPv4 addresses as IPv6", () => {
            expect(isIPv6("192.168.1.1")).toBe(false);
            expect(isIPv6("10.0.0.0")).toBe(false);
        });
    });

    describe("expandIPv6", () => {
        it("should expand :: notation", () => {
            expect(expandIPv6("::1")).toBe("0000:0000:0000:0000:0000:0000:0000:0001");
            expect(expandIPv6("::")).toBe("0000:0000:0000:0000:0000:0000:0000:0000");
            expect(expandIPv6("2001:db8::1")).toBe("2001:0db8:0000:0000:0000:0000:0000:0001");
        });

        it("should expand full addresses", () => {
            expect(expandIPv6("2001:db8:0:0:0:0:0:1")).toBe("2001:0db8:0000:0000:0000:0000:0000:0001");
        });

        it("should return null for invalid addresses", () => {
            // Too many groups
            expect(expandIPv6("2001:db8:0:0:0:0:0:0:1")).toBeNull();
        });
    });

    describe("compressIPv6", () => {
        it("should compress consecutive zeros", () => {
            expect(compressIPv6("2001:0db8:0000:0000:0000:0000:0000:0001")).toBe("2001:db8::1");
            expect(compressIPv6("0000:0000:0000:0000:0000:0000:0000:0001")).toBe("::1");
            expect(compressIPv6("0000:0000:0000:0000:0000:0000:0000:0000")).toBe("::");
        });

        it("should preserve non-zero groups", () => {
            expect(compressIPv6("2001:0db8:0001:0002:0003:0004:0005:0006")).toBe("2001:db8:1:2:3:4:5:6");
        });
    });

    describe("validateIPv6Address", () => {
        it("should accept valid IPv6 addresses", () => {
            expect(validateIPv6Address("2001:db8::1").valid).toBe(true);
            expect(validateIPv6Address("::1").valid).toBe(true);
            expect(validateIPv6Address("fe80::1").valid).toBe(true);
            expect(validateIPv6Address("::").valid).toBe(true);
            expect(validateIPv6Address("2001:db8:0:0:0:0:0:1").valid).toBe(true);
        });

        it("should reject invalid IPv6 addresses", () => {
            expect(validateIPv6Address("").valid).toBe(false);
            expect(validateIPv6Address("gggg:db8::1").valid).toBe(false);
            // Too many groups
            expect(validateIPv6Address("2001:db8:0:0:0:0:0:0:1").valid).toBe(false);
        });
    });

    describe("validateIPv6CIDR", () => {
        it("should accept valid IPv6 CIDR", () => {
            expect(validateIPv6CIDR("2001:db8::/32").valid).toBe(true);
            expect(validateIPv6CIDR("::1/128").valid).toBe(true);
            expect(validateIPv6CIDR("fe80::/10").valid).toBe(true);
        });

        it("should accept IPv6 without prefix as /128", () => {
            expect(validateIPv6CIDR("2001:db8::1").valid).toBe(true);
            expect(validateIPv6CIDR("::1").valid).toBe(true);
        });

        it("should reject invalid IPv6 CIDR", () => {
            expect(validateIPv6CIDR("2001:db8::/129").valid).toBe(false);
            expect(validateIPv6CIDR("2001:db8::/-1").valid).toBe(false);
        });
    });

    describe("validateUniversalCIDR", () => {
        it("should validate IPv4 CIDR", () => {
            expect(validateUniversalCIDR("192.168.1.0/24").valid).toBe(true);
            expect(validateUniversalCIDR("10.0.0.0").valid).toBe(true);
        });

        it("should validate IPv6 CIDR", () => {
            expect(validateUniversalCIDR("2001:db8::/32").valid).toBe(true);
            expect(validateUniversalCIDR("::1").valid).toBe(true);
        });
    });
});
