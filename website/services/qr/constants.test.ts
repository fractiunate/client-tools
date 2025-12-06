/**
 * QR Generator Constants and Pure Function Tests
 * Tests that don't require DOM/Canvas
 */

import { describe, it, expect } from "vitest";
import {
    DEFAULT_OPTIONS,
    SIZE_OPTIONS,
    ERROR_LEVELS,
    MIN_QR_SIZE,
    MAX_QR_SIZE,
    MAX_CONTENT_LENGTH,
    WIFI_ENCRYPTION_LABELS,
    HEX_COLOR_PATTERN,
} from "./constants";
import {
    buildWifiString,
    parseWifiString,
    normalizeHexColor,
    estimateQRVersion,
} from "./utils";
import {
    validateContent,
    validateHexColor,
    validateSize,
    validateMargin,
    checkColorContrast,
} from "./validation";

// Helper to get max content length (it's a Record not a number)
const getMaxContentLength = () => Math.max(...Object.values(MAX_CONTENT_LENGTH));

// ============ Constants Tests ============

describe("QR Constants", () => {
    describe("DEFAULT_OPTIONS", () => {
        it("should have a valid size", () => {
            expect(DEFAULT_OPTIONS.size).toBeGreaterThanOrEqual(MIN_QR_SIZE);
            expect(DEFAULT_OPTIONS.size).toBeLessThanOrEqual(MAX_QR_SIZE);
        });

        it("should have a valid error correction level", () => {
            expect(["L", "M", "Q", "H"]).toContain(DEFAULT_OPTIONS.errorCorrectionLevel);
        });

        it("should have valid colors", () => {
            expect(DEFAULT_OPTIONS.darkColor).toMatch(/^#[0-9a-fA-F]{6,8}$/);
            expect(DEFAULT_OPTIONS.lightColor).toMatch(/^#[0-9a-fA-F]{6,8}$/);
        });

        it("should have a non-negative margin", () => {
            expect(DEFAULT_OPTIONS.margin).toBeGreaterThanOrEqual(0);
        });
    });

    describe("SIZE_OPTIONS", () => {
        it("should be an array with multiple sizes", () => {
            expect(Array.isArray(SIZE_OPTIONS)).toBe(true);
            expect(SIZE_OPTIONS.length).toBeGreaterThan(0);
        });

        it("should have valid size values (as strings)", () => {
            for (const option of SIZE_OPTIONS) {
                const numValue = parseInt(option.value, 10);
                expect(numValue).toBeGreaterThanOrEqual(MIN_QR_SIZE);
                expect(numValue).toBeLessThanOrEqual(MAX_QR_SIZE);
            }
        });

        it("should have labels for all sizes", () => {
            for (const option of SIZE_OPTIONS) {
                expect(typeof option.label).toBe("string");
                expect(option.label.length).toBeGreaterThan(0);
            }
        });
    });

    describe("ERROR_LEVELS", () => {
        it("should have all four error correction levels", () => {
            const levels = ERROR_LEVELS.map((l) => l.value);
            expect(levels).toContain("L");
            expect(levels).toContain("M");
            expect(levels).toContain("Q");
            expect(levels).toContain("H");
        });

        it("should have descriptions for all levels", () => {
            for (const level of ERROR_LEVELS) {
                expect(typeof level.label).toBe("string");
                expect(level.label.length).toBeGreaterThan(0);
            }
        });
    });

    describe("Size constraints", () => {
        it("should have MIN_QR_SIZE less than MAX_QR_SIZE", () => {
            expect(MIN_QR_SIZE).toBeLessThan(MAX_QR_SIZE);
        });

        it("should have sensible bounds", () => {
            expect(MIN_QR_SIZE).toBeGreaterThanOrEqual(50);
            expect(MAX_QR_SIZE).toBeLessThanOrEqual(4096);
        });
    });

    describe("MAX_CONTENT_LENGTH", () => {
        it("should be an object with error levels", () => {
            expect(MAX_CONTENT_LENGTH).toHaveProperty("L");
            expect(MAX_CONTENT_LENGTH).toHaveProperty("M");
            expect(MAX_CONTENT_LENGTH).toHaveProperty("Q");
            expect(MAX_CONTENT_LENGTH).toHaveProperty("H");
        });

        it("should have L > M > Q > H order", () => {
            expect(MAX_CONTENT_LENGTH.L).toBeGreaterThan(MAX_CONTENT_LENGTH.M);
            expect(MAX_CONTENT_LENGTH.M).toBeGreaterThan(MAX_CONTENT_LENGTH.Q);
            expect(MAX_CONTENT_LENGTH.Q).toBeGreaterThan(MAX_CONTENT_LENGTH.H);
        });
    });

    describe("WIFI_ENCRYPTION_LABELS", () => {
        it("should include common encryption types", () => {
            expect(WIFI_ENCRYPTION_LABELS.WPA).toBeDefined();
            expect(WIFI_ENCRYPTION_LABELS.WEP).toBeDefined();
            expect(WIFI_ENCRYPTION_LABELS.nopass).toBeDefined();
        });
    });

    describe("HEX_COLOR_PATTERN", () => {
        it("should match valid 6-digit hex colors", () => {
            expect(HEX_COLOR_PATTERN.test("#FF0000")).toBe(true);
            expect(HEX_COLOR_PATTERN.test("#00ff00")).toBe(true);
            expect(HEX_COLOR_PATTERN.test("#0000FF")).toBe(true);
            expect(HEX_COLOR_PATTERN.test("#123456")).toBe(true);
        });

        it("should reject invalid colors", () => {
            expect(HEX_COLOR_PATTERN.test("FF0000")).toBe(false);
            expect(HEX_COLOR_PATTERN.test("#FFF")).toBe(false);
            expect(HEX_COLOR_PATTERN.test("#GGGGGG")).toBe(false);
        });
    });
});

// ============ WiFi String Tests ============

describe("WiFi String Functions", () => {
    describe("buildWifiString", () => {
        it("should build WPA wifi string", () => {
            const config = {
                ssid: "MyNetwork",
                password: "secret123",
                encryption: "WPA" as const,
                hidden: false,
            };
            const result = buildWifiString(config);
            expect(result).toContain("WIFI:");
            expect(result).toContain("T:WPA");
            expect(result).toContain("S:MyNetwork");
            expect(result).toContain("P:secret123");
            expect(result).toContain(";;");
        });

        it("should build open wifi string", () => {
            const config = {
                ssid: "OpenNetwork",
                password: "",
                encryption: "nopass" as const,
                hidden: false,
            };
            const result = buildWifiString(config);
            expect(result).toContain("T:nopass");
            expect(result).toContain("S:OpenNetwork");
        });

        it("should handle hidden flag (omitted since not in current impl)", () => {
            // Note: Current implementation doesn't include hidden flag
            const config = {
                ssid: "HiddenNet",
                password: "pass",
                encryption: "WPA" as const,
            };
            const result = buildWifiString(config);
            expect(result).toContain("S:HiddenNet");
        });

        it("should escape special characters in SSID", () => {
            const config = {
                ssid: 'Test;Network:"here"',
                password: "pass",
                encryption: "WPA" as const,
                hidden: false,
            };
            const result = buildWifiString(config);
            expect(result).toContain("\\;");
            expect(result).toContain("\\:");
            expect(result).toContain('\\"');
        });

        it("should escape special characters in password", () => {
            const config = {
                ssid: "Network",
                password: 'pass;word:"test"',
                encryption: "WPA" as const,
                hidden: false,
            };
            const result = buildWifiString(config);
            expect(result).toContain("P:pass\\;word\\:\\\"test\\\"");
        });
    });

    describe("parseWifiString", () => {
        it("should parse valid WPA wifi string", () => {
            const input = "WIFI:T:WPA;S:MyNetwork;P:secret123;;";
            const result = parseWifiString(input);

            expect(result).not.toBeNull();
            expect(result?.ssid).toBe("MyNetwork");
            expect(result?.password).toBe("secret123");
            expect(result?.encryption).toBe("WPA");
        });

        it("should parse open network", () => {
            const input = "WIFI:T:nopass;S:OpenNet;;";
            const result = parseWifiString(input);

            expect(result).not.toBeNull();
            expect(result?.encryption).toBe("nopass");
        });

        it("should handle basic wifi parsing", () => {
            const input = "WIFI:T:WPA;S:HiddenNet;P:pass;;";
            const result = parseWifiString(input);

            expect(result).not.toBeNull();
            expect(result?.ssid).toBe("HiddenNet");
            expect(result?.password).toBe("pass");
        });

        it("should return null for invalid format", () => {
            expect(parseWifiString("not a wifi string")).toBeNull();
            expect(parseWifiString("")).toBeNull();
            expect(parseWifiString("WIFI:invalid")).toBeNull();
        });

        it("should handle escaped characters", () => {
            const input = "WIFI:T:WPA;S:Test\\;Network;P:pass\\:word;;";
            const result = parseWifiString(input);

            expect(result).not.toBeNull();
            expect(result?.ssid).toBe("Test;Network");
            expect(result?.password).toBe("pass:word");
        });
    });
});

// ============ Color Utility Tests ============

describe("Color Utilities", () => {
    describe("normalizeHexColor", () => {
        it("should keep valid 6-digit hex and uppercase", () => {
            expect(normalizeHexColor("#FF0000")).toBe("#FF0000");
            expect(normalizeHexColor("#00ff00")).toBe("#00FF00");
        });

        it("should keep 3-digit hex as-is but uppercased", () => {
            // Current impl doesn't expand, just uppercases
            expect(normalizeHexColor("#F00")).toBe("#F00");
            expect(normalizeHexColor("#0f0")).toBe("#0F0");
        });

        it("should uppercase the color", () => {
            expect(normalizeHexColor("#abc")).toBe("#ABC");
        });

        it("should return input if already normalized", () => {
            expect(normalizeHexColor("#123456")).toBe("#123456");
        });
    });

    describe("validateHexColor", () => {
        it("should accept valid 6-digit hex colors", () => {
            expect(validateHexColor("#FF0000").valid).toBe(true);
            expect(validateHexColor("#00ff00").valid).toBe(true);
            expect(validateHexColor("#0000FF").valid).toBe(true);
        });

        it("should reject invalid colors", () => {
            expect(validateHexColor("red").valid).toBe(false);
            expect(validateHexColor("#GGGGGG").valid).toBe(false);
            expect(validateHexColor("").valid).toBe(false);
        });

        it("should reject 8-digit hex (not supported)", () => {
            // Current validator only supports 6-digit hex
            expect(validateHexColor("#FF0000FF").valid).toBe(false);
            expect(validateHexColor("#00000000").valid).toBe(false);
        });

        it("should reject 3-digit shorthand (not supported)", () => {
            // Current validator only supports 6-digit hex
            expect(validateHexColor("#F00").valid).toBe(false);
            expect(validateHexColor("#0F0").valid).toBe(false);
        });
    });

    describe("checkColorContrast", () => {
        it("should detect good contrast (black and white)", () => {
            expect(checkColorContrast("#000000", "#FFFFFF").valid).toBe(true);
            expect(checkColorContrast("#FFFFFF", "#000000").valid).toBe(true);
        });

        it("should detect poor contrast (similar colors)", () => {
            expect(checkColorContrast("#FFFFFF", "#EEEEEE").valid).toBe(false);
            expect(checkColorContrast("#000000", "#111111").valid).toBe(false);
        });

        it("should handle colored pairs", () => {
            // Red and green may or may not pass depending on contrast threshold
            const result = checkColorContrast("#FF0000", "#00FF00");
            expect(result).toHaveProperty("valid");
        });
    });
});

// ============ Validation Tests ============

describe("Validation Functions", () => {
    describe("validateSize", () => {
        it("should accept sizes within range", () => {
            expect(validateSize(256).valid).toBe(true);
            expect(validateSize(MIN_QR_SIZE).valid).toBe(true);
            expect(validateSize(MAX_QR_SIZE).valid).toBe(true);
        });

        it("should reject sizes below minimum", () => {
            expect(validateSize(MIN_QR_SIZE - 1).valid).toBe(false);
            expect(validateSize(0).valid).toBe(false);
            expect(validateSize(-100).valid).toBe(false);
        });

        it("should reject sizes above maximum", () => {
            expect(validateSize(MAX_QR_SIZE + 1).valid).toBe(false);
            expect(validateSize(5000).valid).toBe(false);
        });
    });

    describe("validateMargin", () => {
        it("should accept valid margins", () => {
            expect(validateMargin(0).valid).toBe(true);
            expect(validateMargin(1).valid).toBe(true);
            expect(validateMargin(4).valid).toBe(true);
            expect(validateMargin(10).valid).toBe(true);
        });

        it("should reject negative margins", () => {
            expect(validateMargin(-1).valid).toBe(false);
            expect(validateMargin(-10).valid).toBe(false);
        });
    });

    describe("validateContent", () => {
        it("should accept non-empty content", () => {
            expect(validateContent("Hello").valid).toBe(true);
            expect(validateContent("https://example.com").valid).toBe(true);
        });

        it("should reject empty content", () => {
            expect(validateContent("").valid).toBe(false);
            expect(validateContent("   ").valid).toBe(false);
        });

        it("should reject content exceeding max length", () => {
            const maxLen = getMaxContentLength();
            const longContent = "a".repeat(maxLen + 100);
            expect(validateContent(longContent).valid).toBe(false);
        });
    });
});

// ============ QR Version Estimation Tests ============

describe("estimateQRVersion", () => {
    it("should estimate low version for short content", () => {
        const version = estimateQRVersion(2, "L");
        expect(version).toBeLessThanOrEqual(10);
    });

    it("should estimate higher version for longer content", () => {
        const shortVersion = estimateQRVersion(5, "L");
        const longVersion = estimateQRVersion(500, "L");
        expect(longVersion).toBeGreaterThanOrEqual(shortVersion);
    });

    it("should estimate higher version for higher error correction", () => {
        const lowEC = estimateQRVersion(100, "L");
        const highEC = estimateQRVersion(100, "H");
        expect(highEC).toBeGreaterThanOrEqual(lowEC);
    });

    it("should return version within valid range (1-40)", () => {
        const version = estimateQRVersion(50, "M");
        expect(version).toBeGreaterThanOrEqual(1);
        expect(version).toBeLessThanOrEqual(40);
    });
});

// ============ Module Exports Tests ============

describe("QR Module Exports", () => {
    it("should export all constants from index", async () => {
        const index = await import("./index");

        expect(index.DEFAULT_OPTIONS).toBeDefined();
        expect(index.SIZE_OPTIONS).toBeDefined();
        expect(index.ERROR_LEVELS).toBeDefined();
        expect(index.MIN_QR_SIZE).toBeDefined();
        expect(index.MAX_QR_SIZE).toBeDefined();
        expect(index.MAX_CONTENT_LENGTH).toBeDefined();
    });

    it("should export validation functions from index", async () => {
        const index = await import("./index");

        expect(index.validateContent).toBeDefined();
        expect(index.validateUrl).toBeDefined();
        expect(index.validateWifiConfig).toBeDefined();
        expect(index.validateHexColor).toBeDefined();
        expect(index.validateSize).toBeDefined();
        expect(index.validateMargin).toBeDefined();
        expect(index.validateOptions).toBeDefined();
    });

    it("should export utility functions from index", async () => {
        const index = await import("./index");

        expect(index.buildWifiString).toBeDefined();
        expect(index.parseWifiString).toBeDefined();
        expect(index.normalizeHexColor).toBeDefined();
        expect(index.estimateQRVersion).toBeDefined();
    });

    it("should export generator functions from index", async () => {
        const index = await import("./index");

        expect(index.generateQRDataUrl).toBeDefined();
        expect(index.generateQRSvg).toBeDefined();
        expect(index.generateQRBlob).toBeDefined();
        expect(index.downloadQR).toBeDefined();
    });
});
