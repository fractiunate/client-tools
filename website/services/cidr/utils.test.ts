import { describe, it, expect } from "vitest";
import {
    parseIP,
    octetsToIP,
    ipToInt,
    intToOctets,
    intToIP,
    prefixToMask,
    prefixToSubnetMask,
    prefixToWildcardMask,
    calculateTotalHosts,
    calculateUsableHosts,
    getNetworkAddress,
    getBroadcastAddress,
    getFirstUsableAddress,
    getLastUsableAddress,
    ipToBinary,
    formatBinaryIP,
    getIPClass,
    isPrivateIP,
    parseCIDR,
    calculateCIDRRange,
    normalizeCIDR,
    // IPv6 functions
    parseIPv6,
    calculateIPv6TotalHosts,
    getIPv6Type,
    isPrivateIPv6,
    calculateIPv6CIDRRange,
    normalizeUniversalCIDR,
    calculateUniversalCIDRRange,
} from "./utils";

describe("CIDR Utils", () => {
    describe("IP parsing and conversion", () => {
        it("should parse IP to octets", () => {
            expect(parseIP("192.168.1.1")).toEqual([192, 168, 1, 1]);
            expect(parseIP("0.0.0.0")).toEqual([0, 0, 0, 0]);
            expect(parseIP("255.255.255.255")).toEqual([255, 255, 255, 255]);
        });

        it("should convert octets to IP string", () => {
            expect(octetsToIP([192, 168, 1, 1])).toBe("192.168.1.1");
            expect(octetsToIP([0, 0, 0, 0])).toBe("0.0.0.0");
        });

        it("should convert IP to integer", () => {
            expect(ipToInt([192, 168, 1, 1])).toBe(3232235777);
            expect(ipToInt([0, 0, 0, 0])).toBe(0);
            expect(ipToInt([255, 255, 255, 255])).toBe(4294967295);
        });

        it("should convert integer to octets", () => {
            expect(intToOctets(3232235777)).toEqual([192, 168, 1, 1]);
            expect(intToOctets(0)).toEqual([0, 0, 0, 0]);
        });

        it("should convert integer to IP string", () => {
            expect(intToIP(3232235777)).toBe("192.168.1.1");
            expect(intToIP(0)).toBe("0.0.0.0");
        });
    });

    describe("Subnet mask calculations", () => {
        it("should calculate mask from prefix", () => {
            expect(prefixToMask(24)).toBe(4294967040); // 255.255.255.0
            expect(prefixToMask(8)).toBe(4278190080); // 255.0.0.0
            expect(prefixToMask(0)).toBe(0);
            expect(prefixToMask(32)).toBe(4294967295);
        });

        it("should convert prefix to subnet mask string", () => {
            expect(prefixToSubnetMask(24)).toBe("255.255.255.0");
            expect(prefixToSubnetMask(16)).toBe("255.255.0.0");
            expect(prefixToSubnetMask(8)).toBe("255.0.0.0");
            expect(prefixToSubnetMask(32)).toBe("255.255.255.255");
            expect(prefixToSubnetMask(0)).toBe("0.0.0.0");
        });

        it("should convert prefix to wildcard mask string", () => {
            expect(prefixToWildcardMask(24)).toBe("0.0.0.255");
            expect(prefixToWildcardMask(16)).toBe("0.0.255.255");
            expect(prefixToWildcardMask(8)).toBe("0.255.255.255");
            expect(prefixToWildcardMask(32)).toBe("0.0.0.0");
        });
    });

    describe("Host calculations", () => {
        it("should calculate total hosts", () => {
            expect(calculateTotalHosts(24)).toBe("256");
            expect(calculateTotalHosts(16)).toBe("65536");
            expect(calculateTotalHosts(8)).toBe("16777216");
            expect(calculateTotalHosts(32)).toBe("1");
            expect(calculateTotalHosts(31)).toBe("2");
        });

        it("should calculate usable hosts", () => {
            expect(calculateUsableHosts(24)).toBe("254");
            expect(calculateUsableHosts(16)).toBe("65534");
            expect(calculateUsableHosts(8)).toBe("16777214");
            expect(calculateUsableHosts(32)).toBe("1");
            expect(calculateUsableHosts(31)).toBe("2");
            expect(calculateUsableHosts(30)).toBe("2");
        });
    });

    describe("Network address calculations", () => {
        it("should get network address", () => {
            const ip = ipToInt([192, 168, 1, 100]);
            expect(intToIP(getNetworkAddress(ip, 24))).toBe("192.168.1.0");
            expect(intToIP(getNetworkAddress(ip, 16))).toBe("192.168.0.0");
            expect(intToIP(getNetworkAddress(ip, 8))).toBe("192.0.0.0");
        });

        it("should get broadcast address", () => {
            const ip = ipToInt([192, 168, 1, 0]);
            expect(intToIP(getBroadcastAddress(ip, 24))).toBe("192.168.1.255");
            expect(intToIP(getBroadcastAddress(ip, 16))).toBe("192.168.255.255");
        });

        it("should get first usable address", () => {
            const network = ipToInt([192, 168, 1, 0]);
            expect(intToIP(getFirstUsableAddress(network, 24))).toBe("192.168.1.1");
            expect(intToIP(getFirstUsableAddress(network, 31))).toBe("192.168.1.0");
        });

        it("should get last usable address", () => {
            const broadcast = ipToInt([192, 168, 1, 255]);
            expect(intToIP(getLastUsableAddress(broadcast, 24))).toBe("192.168.1.254");
            expect(intToIP(getLastUsableAddress(broadcast, 31))).toBe("192.168.1.255");
        });
    });

    describe("Binary representation", () => {
        it("should convert IP to binary", () => {
            const ip = ipToInt([192, 168, 1, 1]);
            const binary = ipToBinary(ip);
            expect(binary).toBe("11000000101010000000000100000001");
            expect(binary.length).toBe(32);
        });

        it("should format binary with dots", () => {
            const binary = "11000000101010000000000100000001";
            expect(formatBinaryIP(binary)).toBe("11000000.10101000.00000001.00000001");
        });
    });

    describe("IP classification", () => {
        it("should identify IP class", () => {
            expect(getIPClass(10)).toBe("A");
            expect(getIPClass(127)).toBe("A");
            expect(getIPClass(128)).toBe("B");
            expect(getIPClass(172)).toBe("B");
            expect(getIPClass(192)).toBe("C");
            expect(getIPClass(223)).toBe("C");
            expect(getIPClass(224)).toBe("D");
            expect(getIPClass(240)).toBe("E");
        });

        it("should identify private IPs", () => {
            expect(isPrivateIP(ipToInt([10, 0, 0, 1]))).toBe(true);
            expect(isPrivateIP(ipToInt([10, 255, 255, 255]))).toBe(true);
            expect(isPrivateIP(ipToInt([172, 16, 0, 1]))).toBe(true);
            expect(isPrivateIP(ipToInt([172, 31, 255, 255]))).toBe(true);
            expect(isPrivateIP(ipToInt([192, 168, 0, 1]))).toBe(true);
            expect(isPrivateIP(ipToInt([192, 168, 255, 255]))).toBe(true);
            expect(isPrivateIP(ipToInt([8, 8, 8, 8]))).toBe(false);
            expect(isPrivateIP(ipToInt([1, 1, 1, 1]))).toBe(false);
        });
    });

    describe("CIDR parsing", () => {
        it("should parse CIDR string", () => {
            const parsed = parseCIDR("192.168.1.0/24");
            expect(parsed.ip).toEqual([192, 168, 1, 0]);
            expect(parsed.prefixLength).toBe(24);
            expect(parsed.networkInt).toBe(ipToInt([192, 168, 1, 0]));
        });

        it("should normalize CIDR", () => {
            expect(normalizeCIDR("192.168.1.100/24")).toBe("192.168.1.0/24");
            expect(normalizeCIDR("10.0.0.50/8")).toBe("10.0.0.0/8");
            expect(normalizeCIDR("192.168.1.0/24")).toBe("192.168.1.0/24");
        });
    });

    describe("calculateCIDRRange", () => {
        it("should calculate full range information for /24", () => {
            const range = calculateCIDRRange("192.168.1.0/24");

            expect(range.cidr).toBe("192.168.1.0/24");
            expect(range.networkAddress).toBe("192.168.1.0");
            expect(range.broadcastAddress).toBe("192.168.1.255");
            expect(range.firstUsable).toBe("192.168.1.1");
            expect(range.lastUsable).toBe("192.168.1.254");
            expect(range.subnetMask).toBe("255.255.255.0");
            expect(range.wildcardMask).toBe("0.0.0.255");
            expect(range.totalHosts).toBe("256");
            expect(range.usableHosts).toBe("254");
            expect(range.prefixLength).toBe(24);
            expect(range.ipClass).toBe("C");
            expect(range.isPrivate).toBe(true);
        });

        it("should calculate range for /32 host", () => {
            const range = calculateCIDRRange("192.168.1.1/32");

            expect(range.networkAddress).toBe("192.168.1.1");
            expect(range.broadcastAddress).toBe("192.168.1.1");
            expect(range.firstUsable).toBe("192.168.1.1");
            expect(range.lastUsable).toBe("192.168.1.1");
            expect(range.totalHosts).toBe("1");
            expect(range.usableHosts).toBe("1");
        });

        it("should calculate range for public IP", () => {
            const range = calculateCIDRRange("8.8.8.0/24");
            expect(range.isPrivate).toBe(false);
            expect(range.ipClass).toBe("A");
        });

        it("should include ipVersion for IPv4", () => {
            const range = calculateCIDRRange("192.168.1.0/24");
            expect(range.ipVersion).toBe(4);
        });
    });

    // ==================== IPv6 Tests ====================

    describe("IPv6 Utils", () => {
        it("should parse IPv6 address", () => {
            const groups = parseIPv6("2001:db8::1");
            expect(groups).toHaveLength(8);
            expect(groups[0]).toBe(0x2001);
            expect(groups[1]).toBe(0x0db8);
            expect(groups[7]).toBe(0x0001);
        });

        it("should calculate IPv6 total hosts", () => {
            expect(calculateIPv6TotalHosts(128)).toBe("1");
            expect(calculateIPv6TotalHosts(64)).toBe("18446744073709551616");
            expect(calculateIPv6TotalHosts(127)).toBe("2");
        });

        it("should get IPv6 type", () => {
            expect(getIPv6Type("00000000000000000000000000000001")).toBe("Loopback");
            expect(getIPv6Type("00000000000000000000000000000000")).toBe("Unspecified");
            expect(getIPv6Type("fc000000000000000000000000000001")).toBe("Unique Local (ULA)");
            expect(getIPv6Type("fe800000000000000000000000000001")).toBe("Link-Local");
        });

        it("should check IPv6 private", () => {
            expect(isPrivateIPv6("fc000000000000000000000000000001")).toBe(true);
            expect(isPrivateIPv6("fe800000000000000000000000000001")).toBe(true);
            expect(isPrivateIPv6("20010db8000000000000000000000001")).toBe(false);
        });
    });

    describe("calculateIPv6CIDRRange", () => {
        it("should calculate full IPv6 range for /64", () => {
            const range = calculateIPv6CIDRRange("2001:db8::/64");

            expect(range.networkAddress).toBe("2001:db8::");
            expect(range.prefixLength).toBe(64);
            expect(range.ipVersion).toBe(6);
            expect(range.totalHosts).toBe("18446744073709551616");
            expect(range.ipClass).toBe("Documentation"); // 2001:db8::/32 is documentation space
            expect(range.isPrivate).toBe(false);
        });

        it("should calculate IPv6 range for /128 (single host)", () => {
            const range = calculateIPv6CIDRRange("::1/128");

            expect(range.networkAddress).toBe("::1");
            expect(range.broadcastAddress).toBe("::1");
            expect(range.totalHosts).toBe("1");
            expect(range.ipClass).toBe("Loopback");
        });

        it("should calculate IPv6 range for ULA", () => {
            const range = calculateIPv6CIDRRange("fd00::/8");

            expect(range.isPrivate).toBe(true);
            expect(range.ipClass).toBe("Unique Local (ULA)");
        });
    });

    describe("normalizeUniversalCIDR", () => {
        it("should normalize IPv4 CIDR", () => {
            expect(normalizeUniversalCIDR("192.168.1.5/24")).toBe("192.168.1.0/24");
        });

        it("should normalize IPv6 CIDR", () => {
            expect(normalizeUniversalCIDR("2001:db8::1/64")).toBe("2001:db8::/64");
        });
    });

    describe("calculateUniversalCIDRRange", () => {
        it("should handle IPv4", () => {
            const range = calculateUniversalCIDRRange("192.168.1.0/24");
            expect(range.ipVersion).toBe(4);
        });

        it("should handle IPv6", () => {
            const range = calculateUniversalCIDRRange("2001:db8::/32");
            expect(range.ipVersion).toBe(6);
        });
    });
});
