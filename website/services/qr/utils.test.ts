/**
 * QR Generator Utils Unit Tests
 */

import { describe, it, expect } from "vitest";
import {
    buildWifiString,
    getQRContent,
    parseWifiString,
    normalizeHexColor,
    estimateQRVersion,
    getSuggestedFilename,
} from "./utils";
import type { WifiConfig } from "./types";

describe("buildWifiString", () => {
    describe("basic functionality", () => {
        it("should build WPA wifi string", () => {
            const config: WifiConfig = {
                ssid: "MyNetwork",
                password: "password123",
                encryption: "WPA",
            };
            const result = buildWifiString(config);
            expect(result).toBe("WIFI:T:WPA;S:MyNetwork;P:password123;;");
        });

        it("should build WEP wifi string", () => {
            const config: WifiConfig = {
                ssid: "MyNetwork",
                password: "12345",
                encryption: "WEP",
            };
            const result = buildWifiString(config);
            expect(result).toBe("WIFI:T:WEP;S:MyNetwork;P:12345;;");
        });

        it("should build open network wifi string", () => {
            const config: WifiConfig = {
                ssid: "OpenNetwork",
                password: "",
                encryption: "nopass",
            };
            const result = buildWifiString(config);
            expect(result).toBe("WIFI:T:nopass;S:OpenNetwork;P:;;");
        });

        it("should return empty string for empty SSID", () => {
            const config: WifiConfig = {
                ssid: "",
                password: "password",
                encryption: "WPA",
            };
            const result = buildWifiString(config);
            expect(result).toBe("");
        });
    });

    describe("special character escaping", () => {
        it("should escape semicolons in SSID", () => {
            const config: WifiConfig = {
                ssid: "My;Network",
                password: "password",
                encryption: "WPA",
            };
            const result = buildWifiString(config);
            expect(result).toContain("S:My\\;Network");
        });

        it("should escape colons in SSID", () => {
            const config: WifiConfig = {
                ssid: "My:Network",
                password: "password",
                encryption: "WPA",
            };
            const result = buildWifiString(config);
            expect(result).toContain("S:My\\:Network");
        });

        it("should escape backslashes in password", () => {
            const config: WifiConfig = {
                ssid: "MyNetwork",
                password: "pass\\word",
                encryption: "WPA",
            };
            const result = buildWifiString(config);
            expect(result).toContain("P:pass\\\\word");
        });

        it("should escape quotes in password", () => {
            const config: WifiConfig = {
                ssid: "MyNetwork",
                password: 'pass"word',
                encryption: "WPA",
            };
            const result = buildWifiString(config);
            expect(result).toContain('P:pass\\"word');
        });

        it("should escape multiple special characters", () => {
            const config: WifiConfig = {
                ssid: "Net;:work",
                password: "pass;word",
                encryption: "WPA",
            };
            const result = buildWifiString(config);
            expect(result).toContain("S:Net\\;\\:work");
            expect(result).toContain("P:pass\\;word");
        });
    });
});

describe("getQRContent", () => {
    it("should return text content for text type", () => {
        const result = getQRContent("text", "Hello World", "", {
            ssid: "",
            password: "",
            encryption: "WPA",
        });
        expect(result).toBe("Hello World");
    });

    it("should return URL for url type", () => {
        const result = getQRContent("url", "", "https://example.com", {
            ssid: "",
            password: "",
            encryption: "WPA",
        });
        expect(result).toBe("https://example.com");
    });

    it("should return wifi string for wifi type", () => {
        const result = getQRContent("wifi", "", "", {
            ssid: "MyNetwork",
            password: "password123",
            encryption: "WPA",
        });
        expect(result).toBe("WIFI:T:WPA;S:MyNetwork;P:password123;;");
    });

    it("should return empty string for unknown type", () => {
        const result = getQRContent("unknown" as "text", "test", "url", {
            ssid: "ssid",
            password: "pass",
            encryption: "WPA",
        });
        expect(result).toBe("");
    });
});

describe("parseWifiString", () => {
    describe("valid parsing", () => {
        it("should parse WPA wifi string", () => {
            const result = parseWifiString("WIFI:T:WPA;S:MyNetwork;P:password123;;");
            expect(result).toEqual({
                ssid: "MyNetwork",
                password: "password123",
                encryption: "WPA",
            });
        });

        it("should parse WEP wifi string", () => {
            const result = parseWifiString("WIFI:T:WEP;S:MyNetwork;P:12345;;");
            expect(result).toEqual({
                ssid: "MyNetwork",
                password: "12345",
                encryption: "WEP",
            });
        });

        it("should parse open network", () => {
            const result = parseWifiString("WIFI:T:nopass;S:OpenNetwork;P:;;");
            expect(result).toEqual({
                ssid: "OpenNetwork",
                password: "",
                encryption: "nopass",
            });
        });

        it("should unescape special characters", () => {
            // In the WiFi string, backslash-semicolon is escaped semicolon
            // We need to represent \; in the string, which requires \\; in JS
            const result = parseWifiString("WIFI:T:WPA;S:My\\;Network;P:pass\\:word;;");
            expect(result?.ssid).toBe("My;Network");
            expect(result?.password).toBe("pass:word");
        });
    });

    describe("invalid parsing", () => {
        it("should return null for non-WIFI string", () => {
            const result = parseWifiString("https://example.com");
            expect(result).toBeNull();
        });

        it("should return null for empty string", () => {
            const result = parseWifiString("");
            expect(result).toBeNull();
        });

        it("should return null for malformed WIFI string without SSID", () => {
            const result = parseWifiString("WIFI:T:WPA;P:password;;");
            expect(result).toBeNull();
        });
    });
});

describe("normalizeHexColor", () => {
    it("should uppercase lowercase hex", () => {
        const result = normalizeHexColor("#abcdef");
        expect(result).toBe("#ABCDEF");
    });

    it("should add hash prefix if missing", () => {
        const result = normalizeHexColor("ABCDEF");
        expect(result).toBe("#ABCDEF");
    });

    it("should trim whitespace", () => {
        const result = normalizeHexColor("  #abc123  ");
        expect(result).toBe("#ABC123");
    });

    it("should handle already normalized color", () => {
        const result = normalizeHexColor("#FFFFFF");
        expect(result).toBe("#FFFFFF");
    });

    it("should normalize mixed case", () => {
        const result = normalizeHexColor("#AaBbCc");
        expect(result).toBe("#AABBCC");
    });
});

describe("estimateQRVersion", () => {
    it("should return version 1 for very short content with L correction", () => {
        const result = estimateQRVersion(10, "L");
        expect(result).toBe(1);
    });

    it("should return higher version for longer content", () => {
        const result = estimateQRVersion(100, "M");
        expect(result).toBeGreaterThan(1);
    });

    it("should return higher version for H correction vs L", () => {
        const lengthH = estimateQRVersion(50, "H");
        const lengthL = estimateQRVersion(50, "L");
        expect(lengthH).toBeGreaterThanOrEqual(lengthL);
    });

    it("should return max version 40 for very long content", () => {
        const result = estimateQRVersion(10000, "L");
        expect(result).toBe(40);
    });

    it("should handle edge case at capacity boundaries", () => {
        // Version 1 L capacity is 17 bytes
        expect(estimateQRVersion(17, "L")).toBe(1);
        expect(estimateQRVersion(18, "L")).toBe(2);
    });
});

describe("getSuggestedFilename", () => {
    it("should return PNG filename with default prefix", () => {
        const result = getSuggestedFilename("png");
        expect(result).toBe("qrcode.png");
    });

    it("should return SVG filename with default prefix", () => {
        const result = getSuggestedFilename("svg");
        expect(result).toBe("qrcode.svg");
    });

    it("should use custom prefix", () => {
        const result = getSuggestedFilename("png", "my-qr");
        expect(result).toBe("my-qr.png");
    });

    it("should handle empty prefix", () => {
        const result = getSuggestedFilename("svg", "");
        expect(result).toBe(".svg");
    });
});
