/**
 * QR Generator Validation Unit Tests
 */

import { describe, it, expect } from "vitest";
import {
    validateContent,
    validateUrl,
    validateWifiConfig,
    validateHexColor,
    validateSize,
    validateMargin,
    validateOptions,
    checkColorContrast,
} from "./validation";
import { DEFAULT_OPTIONS, MAX_CONTENT_LENGTH, MIN_QR_SIZE, MAX_QR_SIZE } from "./constants";

describe("validateContent", () => {
    describe("valid content", () => {
        it("should accept non-empty string", () => {
            const result = validateContent("Hello World");
            expect(result.valid).toBe(true);
        });

        it("should accept URL content", () => {
            const result = validateContent("https://example.com");
            expect(result.valid).toBe(true);
        });

        it("should accept content at max length for L error correction", () => {
            const content = "a".repeat(MAX_CONTENT_LENGTH.L);
            const result = validateContent(content, "L");
            expect(result.valid).toBe(true);
        });

        it("should accept content at max length for H error correction", () => {
            const content = "a".repeat(MAX_CONTENT_LENGTH.H);
            const result = validateContent(content, "H");
            expect(result.valid).toBe(true);
        });

        it("should accept special characters", () => {
            const result = validateContent("Special: @#$%^&*()");
            expect(result.valid).toBe(true);
        });

        it("should accept unicode content", () => {
            const result = validateContent("こんにちは 🌟");
            expect(result.valid).toBe(true);
        });
    });

    describe("invalid content", () => {
        it("should reject empty string", () => {
            const result = validateContent("");
            expect(result.valid).toBe(false);
            expect(result.error).toBe("Content is required");
        });

        it("should reject whitespace-only string", () => {
            const result = validateContent("   ");
            expect(result.valid).toBe(false);
        });

        it("should reject content exceeding max length for M error correction", () => {
            const content = "a".repeat(MAX_CONTENT_LENGTH.M + 1);
            const result = validateContent(content, "M");
            expect(result.valid).toBe(false);
            expect(result.error).toContain("too long");
        });

        it("should reject content exceeding max length for H error correction", () => {
            const content = "a".repeat(MAX_CONTENT_LENGTH.H + 1);
            const result = validateContent(content, "H");
            expect(result.valid).toBe(false);
        });
    });

    describe("default error level", () => {
        it("should default to M error correction level", () => {
            const content = "a".repeat(MAX_CONTENT_LENGTH.M + 1);
            const result = validateContent(content); // No level specified
            expect(result.valid).toBe(false);
        });
    });
});

describe("validateUrl", () => {
    describe("valid URLs", () => {
        it("should accept https URL", () => {
            const result = validateUrl("https://example.com");
            expect(result.valid).toBe(true);
        });

        it("should accept http URL", () => {
            const result = validateUrl("http://example.com");
            expect(result.valid).toBe(true);
        });

        it("should accept URL with path", () => {
            const result = validateUrl("https://example.com/path/to/page");
            expect(result.valid).toBe(true);
        });

        it("should accept URL with query parameters", () => {
            const result = validateUrl("https://example.com?foo=bar&baz=qux");
            expect(result.valid).toBe(true);
        });

        it("should accept URL with port", () => {
            const result = validateUrl("https://example.com:8080");
            expect(result.valid).toBe(true);
        });

        it("should accept URL with fragment", () => {
            const result = validateUrl("https://example.com#section");
            expect(result.valid).toBe(true);
        });

        it("should accept localhost URL", () => {
            const result = validateUrl("http://localhost:3000");
            expect(result.valid).toBe(true);
        });
    });

    describe("invalid URLs", () => {
        it("should reject empty string", () => {
            const result = validateUrl("");
            expect(result.valid).toBe(false);
            expect(result.error).toBe("URL is required");
        });

        it("should reject plain text", () => {
            const result = validateUrl("not a url");
            expect(result.valid).toBe(false);
            expect(result.error).toBe("Invalid URL format");
        });

        it("should reject URL without protocol", () => {
            const result = validateUrl("example.com");
            expect(result.valid).toBe(false);
        });

        it("should reject whitespace-only", () => {
            const result = validateUrl("   ");
            expect(result.valid).toBe(false);
        });
    });
});

describe("validateWifiConfig", () => {
    describe("valid configurations", () => {
        it("should accept valid WPA config", () => {
            const result = validateWifiConfig({
                ssid: "MyNetwork",
                password: "password123",
                encryption: "WPA",
            });
            expect(result.valid).toBe(true);
        });

        it("should accept valid WEP config", () => {
            const result = validateWifiConfig({
                ssid: "MyNetwork",
                password: "12345", // 5 ASCII chars
                encryption: "WEP",
            });
            expect(result.valid).toBe(true);
        });

        it("should accept open network without password", () => {
            const result = validateWifiConfig({
                ssid: "OpenNetwork",
                password: "",
                encryption: "nopass",
            });
            expect(result.valid).toBe(true);
        });

        it("should accept SSID with special characters", () => {
            const result = validateWifiConfig({
                ssid: "My WiFi!@#$",
                password: "password123",
                encryption: "WPA",
            });
            expect(result.valid).toBe(true);
        });

        it("should accept WPA password at minimum length (8 chars)", () => {
            const result = validateWifiConfig({
                ssid: "MyNetwork",
                password: "12345678",
                encryption: "WPA",
            });
            expect(result.valid).toBe(true);
        });

        it("should accept WPA password at maximum length (63 chars)", () => {
            const result = validateWifiConfig({
                ssid: "MyNetwork",
                password: "a".repeat(63),
                encryption: "WPA",
            });
            expect(result.valid).toBe(true);
        });
    });

    describe("invalid configurations", () => {
        it("should reject empty SSID", () => {
            const result = validateWifiConfig({
                ssid: "",
                password: "password123",
                encryption: "WPA",
            });
            expect(result.valid).toBe(false);
            expect(result.error).toContain("SSID");
        });

        it("should reject whitespace-only SSID", () => {
            const result = validateWifiConfig({
                ssid: "   ",
                password: "password123",
                encryption: "WPA",
            });
            expect(result.valid).toBe(false);
        });

        it("should reject missing password for WPA", () => {
            const result = validateWifiConfig({
                ssid: "MyNetwork",
                password: "",
                encryption: "WPA",
            });
            expect(result.valid).toBe(false);
            expect(result.error).toContain("Password is required");
        });

        it("should reject missing password for WEP", () => {
            const result = validateWifiConfig({
                ssid: "MyNetwork",
                password: "",
                encryption: "WEP",
            });
            expect(result.valid).toBe(false);
        });

        it("should reject SSID longer than 32 characters", () => {
            const result = validateWifiConfig({
                ssid: "a".repeat(33),
                password: "password123",
                encryption: "WPA",
            });
            expect(result.valid).toBe(false);
            expect(result.error).toContain("too long");
        });

        it("should reject WPA password shorter than 8 characters", () => {
            const result = validateWifiConfig({
                ssid: "MyNetwork",
                password: "1234567", // 7 chars
                encryption: "WPA",
            });
            expect(result.valid).toBe(false);
            expect(result.error).toContain("at least 8");
        });

        it("should reject WPA password longer than 63 characters", () => {
            const result = validateWifiConfig({
                ssid: "MyNetwork",
                password: "a".repeat(64),
                encryption: "WPA",
            });
            expect(result.valid).toBe(false);
            expect(result.error).toContain("at most 63");
        });

        it("should reject WEP key with invalid length", () => {
            const result = validateWifiConfig({
                ssid: "MyNetwork",
                password: "1234", // 4 chars, invalid
                encryption: "WEP",
            });
            expect(result.valid).toBe(false);
        });
    });
});

describe("validateHexColor", () => {
    describe("valid colors", () => {
        it("should accept black", () => {
            const result = validateHexColor("#000000");
            expect(result.valid).toBe(true);
        });

        it("should accept white", () => {
            const result = validateHexColor("#FFFFFF");
            expect(result.valid).toBe(true);
        });

        it("should accept lowercase hex", () => {
            const result = validateHexColor("#abcdef");
            expect(result.valid).toBe(true);
        });

        it("should accept mixed case hex", () => {
            const result = validateHexColor("#AaBbCc");
            expect(result.valid).toBe(true);
        });

        it("should accept primary colors", () => {
            expect(validateHexColor("#FF0000").valid).toBe(true); // Red
            expect(validateHexColor("#00FF00").valid).toBe(true); // Green
            expect(validateHexColor("#0000FF").valid).toBe(true); // Blue
        });
    });

    describe("invalid colors", () => {
        it("should reject empty string", () => {
            const result = validateHexColor("");
            expect(result.valid).toBe(false);
            expect(result.error).toBe("Color is required");
        });

        it("should reject missing hash", () => {
            const result = validateHexColor("000000");
            expect(result.valid).toBe(false);
        });

        it("should reject short hex (3 digits)", () => {
            const result = validateHexColor("#000");
            expect(result.valid).toBe(false);
        });

        it("should reject invalid hex characters", () => {
            const result = validateHexColor("#GGGGGG");
            expect(result.valid).toBe(false);
        });

        it("should reject too long hex", () => {
            const result = validateHexColor("#0000000");
            expect(result.valid).toBe(false);
        });

        it("should reject RGB notation", () => {
            const result = validateHexColor("rgb(0,0,0)");
            expect(result.valid).toBe(false);
        });

        it("should reject color names", () => {
            const result = validateHexColor("black");
            expect(result.valid).toBe(false);
        });
    });
});

describe("validateSize", () => {
    describe("valid sizes", () => {
        it("should accept minimum size", () => {
            const result = validateSize(MIN_QR_SIZE);
            expect(result.valid).toBe(true);
        });

        it("should accept maximum size", () => {
            const result = validateSize(MAX_QR_SIZE);
            expect(result.valid).toBe(true);
        });

        it("should accept common sizes", () => {
            expect(validateSize(128).valid).toBe(true);
            expect(validateSize(256).valid).toBe(true);
            expect(validateSize(512).valid).toBe(true);
            expect(validateSize(1024).valid).toBe(true);
        });
    });

    describe("invalid sizes", () => {
        it("should reject size below minimum", () => {
            const result = validateSize(MIN_QR_SIZE - 1);
            expect(result.valid).toBe(false);
            expect(result.error).toContain(`at least ${MIN_QR_SIZE}`);
        });

        it("should reject size above maximum", () => {
            const result = validateSize(MAX_QR_SIZE + 1);
            expect(result.valid).toBe(false);
            expect(result.error).toContain(`at most ${MAX_QR_SIZE}`);
        });

        it("should reject zero", () => {
            const result = validateSize(0);
            expect(result.valid).toBe(false);
        });

        it("should reject negative size", () => {
            const result = validateSize(-100);
            expect(result.valid).toBe(false);
        });

        it("should reject NaN", () => {
            const result = validateSize(NaN);
            expect(result.valid).toBe(false);
            expect(result.error).toBe("Size must be a number");
        });

        it("should reject non-number types", () => {
            const result = validateSize("256" as unknown as number);
            expect(result.valid).toBe(false);
        });
    });
});

describe("validateMargin", () => {
    describe("valid margins", () => {
        it("should accept zero margin", () => {
            const result = validateMargin(0);
            expect(result.valid).toBe(true);
        });

        it("should accept default margin", () => {
            const result = validateMargin(2);
            expect(result.valid).toBe(true);
        });

        it("should accept maximum margin", () => {
            const result = validateMargin(10);
            expect(result.valid).toBe(true);
        });
    });

    describe("invalid margins", () => {
        it("should reject negative margin", () => {
            const result = validateMargin(-1);
            expect(result.valid).toBe(false);
            expect(result.error).toContain("cannot be negative");
        });

        it("should reject margin above maximum", () => {
            const result = validateMargin(11);
            expect(result.valid).toBe(false);
            expect(result.error).toContain("too large");
        });

        it("should reject NaN", () => {
            const result = validateMargin(NaN);
            expect(result.valid).toBe(false);
        });
    });
});

describe("validateOptions", () => {
    it("should accept default options", () => {
        const result = validateOptions(DEFAULT_OPTIONS);
        expect(result.valid).toBe(true);
    });

    it("should reject invalid size in options", () => {
        const result = validateOptions({
            ...DEFAULT_OPTIONS,
            size: 10, // Too small
        });
        expect(result.valid).toBe(false);
    });

    it("should reject invalid margin in options", () => {
        const result = validateOptions({
            ...DEFAULT_OPTIONS,
            margin: -1,
        });
        expect(result.valid).toBe(false);
    });

    it("should reject invalid dark color", () => {
        const result = validateOptions({
            ...DEFAULT_OPTIONS,
            darkColor: "black",
        });
        expect(result.valid).toBe(false);
        expect(result.error).toContain("Foreground color");
    });

    it("should reject invalid light color", () => {
        const result = validateOptions({
            ...DEFAULT_OPTIONS,
            lightColor: "white",
        });
        expect(result.valid).toBe(false);
        expect(result.error).toContain("Background color");
    });

    it("should reject invalid error correction level", () => {
        const result = validateOptions({
            ...DEFAULT_OPTIONS,
            errorCorrectionLevel: "X" as "L",
        });
        expect(result.valid).toBe(false);
        expect(result.error).toContain("error correction level");
    });
});

describe("checkColorContrast", () => {
    describe("good contrast", () => {
        it("should pass black on white", () => {
            const result = checkColorContrast("#000000", "#FFFFFF");
            expect(result.valid).toBe(true);
        });

        it("should pass white on black", () => {
            const result = checkColorContrast("#FFFFFF", "#000000");
            expect(result.valid).toBe(true);
        });

        it("should pass dark blue on light yellow", () => {
            const result = checkColorContrast("#000080", "#FFFF00");
            expect(result.valid).toBe(true);
        });
    });

    describe("low contrast", () => {
        it("should fail white on white", () => {
            const result = checkColorContrast("#FFFFFF", "#FFFFFF");
            expect(result.valid).toBe(false);
            expect(result.error).toContain("Low contrast");
        });

        it("should fail black on black", () => {
            const result = checkColorContrast("#000000", "#000000");
            expect(result.valid).toBe(false);
        });

        it("should fail similar grays", () => {
            const result = checkColorContrast("#808080", "#909090");
            expect(result.valid).toBe(false);
        });

        it("should warn about light colors on light background", () => {
            const result = checkColorContrast("#CCCCCC", "#FFFFFF");
            expect(result.valid).toBe(false);
        });
    });
});
