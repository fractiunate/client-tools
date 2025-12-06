/**
 * QR Generator Validation Functions
 */

import type {
    QRValidationResult,
    QROptions,
    WifiConfig,
    ErrorCorrectionLevel
} from "./types";
import {
    MIN_QR_SIZE,
    MAX_QR_SIZE,
    MAX_CONTENT_LENGTH,
    HEX_COLOR_PATTERN
} from "./constants";

/**
 * Validate QR content is not empty and within length limits
 * @param content - Content to encode
 * @param errorLevel - Error correction level (affects max length)
 * @returns Validation result
 */
export function validateContent(
    content: string,
    errorLevel: ErrorCorrectionLevel = "M"
): QRValidationResult {
    if (!content || content.trim().length === 0) {
        return {
            valid: false,
            error: "Content is required",
        };
    }

    const maxLength = MAX_CONTENT_LENGTH[errorLevel];
    if (content.length > maxLength) {
        return {
            valid: false,
            error: `Content too long. Maximum ${maxLength} characters for ${errorLevel} error correction.`,
        };
    }

    return { valid: true };
}

/**
 * Validate URL format
 * @param url - URL string to validate
 * @returns Validation result
 */
export function validateUrl(url: string): QRValidationResult {
    if (!url || url.trim().length === 0) {
        return {
            valid: false,
            error: "URL is required",
        };
    }

    try {
        new URL(url);
        return { valid: true };
    } catch {
        return {
            valid: false,
            error: "Invalid URL format",
        };
    }
}

/**
 * Validate WiFi configuration
 * @param config - WiFi configuration
 * @returns Validation result
 */
export function validateWifiConfig(config: WifiConfig): QRValidationResult {
    if (!config.ssid || config.ssid.trim().length === 0) {
        return {
            valid: false,
            error: "Network name (SSID) is required",
        };
    }

    // Password required for encrypted networks
    if (config.encryption !== "nopass" && !config.password) {
        return {
            valid: false,
            error: "Password is required for encrypted networks",
        };
    }

    // SSID length limit (typically 32 bytes)
    if (config.ssid.length > 32) {
        return {
            valid: false,
            error: "Network name too long (max 32 characters)",
        };
    }

    // WPA password length (8-63 characters)
    if (config.encryption === "WPA" && config.password) {
        if (config.password.length < 8) {
            return {
                valid: false,
                error: "WPA password must be at least 8 characters",
            };
        }
        if (config.password.length > 63) {
            return {
                valid: false,
                error: "WPA password must be at most 63 characters",
            };
        }
    }

    // WEP key length (5 or 13 ASCII characters, or 10 or 26 hex characters)
    if (config.encryption === "WEP" && config.password) {
        const len = config.password.length;
        const validLengths = [5, 13, 10, 26];
        if (!validLengths.includes(len)) {
            return {
                valid: false,
                error: "WEP key must be 5 or 13 ASCII characters, or 10 or 26 hex characters",
            };
        }
    }

    return { valid: true };
}

/**
 * Validate hex color format
 * @param color - Color string to validate
 * @returns Validation result
 */
export function validateHexColor(color: string): QRValidationResult {
    if (!color) {
        return {
            valid: false,
            error: "Color is required",
        };
    }

    if (!HEX_COLOR_PATTERN.test(color)) {
        return {
            valid: false,
            error: "Invalid hex color format. Use #RRGGBB",
        };
    }

    return { valid: true };
}

/**
 * Validate QR size
 * @param size - Size in pixels
 * @returns Validation result
 */
export function validateSize(size: number): QRValidationResult {
    if (typeof size !== "number" || isNaN(size)) {
        return {
            valid: false,
            error: "Size must be a number",
        };
    }

    if (size < MIN_QR_SIZE) {
        return {
            valid: false,
            error: `Size must be at least ${MIN_QR_SIZE} pixels`,
        };
    }

    if (size > MAX_QR_SIZE) {
        return {
            valid: false,
            error: `Size must be at most ${MAX_QR_SIZE} pixels`,
        };
    }

    return { valid: true };
}

/**
 * Validate margin (quiet zone)
 * @param margin - Margin in modules
 * @returns Validation result
 */
export function validateMargin(margin: number): QRValidationResult {
    if (typeof margin !== "number" || isNaN(margin)) {
        return {
            valid: false,
            error: "Margin must be a number",
        };
    }

    if (margin < 0) {
        return {
            valid: false,
            error: "Margin cannot be negative",
        };
    }

    if (margin > 10) {
        return {
            valid: false,
            error: "Margin too large (max 10)",
        };
    }

    return { valid: true };
}

/**
 * Validate complete QR options
 * @param options - QR generation options
 * @returns Validation result
 */
export function validateOptions(options: QROptions): QRValidationResult {
    const sizeResult = validateSize(options.size);
    if (!sizeResult.valid) return sizeResult;

    const marginResult = validateMargin(options.margin);
    if (!marginResult.valid) return marginResult;

    const darkColorResult = validateHexColor(options.darkColor);
    if (!darkColorResult.valid) {
        return {
            valid: false,
            error: `Foreground color: ${darkColorResult.error}`,
        };
    }

    const lightColorResult = validateHexColor(options.lightColor);
    if (!lightColorResult.valid) {
        return {
            valid: false,
            error: `Background color: ${lightColorResult.error}`,
        };
    }

    const validLevels: ErrorCorrectionLevel[] = ["L", "M", "Q", "H"];
    if (!validLevels.includes(options.errorCorrectionLevel)) {
        return {
            valid: false,
            error: "Invalid error correction level",
        };
    }

    return { valid: true };
}

/**
 * Check if colors have sufficient contrast for scanning
 * @param darkColor - Foreground color
 * @param lightColor - Background color
 * @returns Validation result with warning if low contrast
 */
export function checkColorContrast(
    darkColor: string,
    lightColor: string
): QRValidationResult {
    // Parse hex colors to RGB
    const parseHex = (hex: string): { r: number; g: number; b: number } => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return { r: 0, g: 0, b: 0 };
        return {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        };
    };

    // Calculate relative luminance
    const getLuminance = (r: number, g: number, b: number): number => {
        const [rs, gs, bs] = [r, g, b].map((c) => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const dark = parseHex(darkColor);
    const light = parseHex(lightColor);

    const darkLum = getLuminance(dark.r, dark.g, dark.b);
    const lightLum = getLuminance(light.r, light.g, light.b);

    // Calculate contrast ratio
    const lighter = Math.max(darkLum, lightLum);
    const darker = Math.min(darkLum, lightLum);
    const contrastRatio = (lighter + 0.05) / (darker + 0.05);

    // QR codes need high contrast for reliable scanning
    // WCAG recommends 4.5:1 for text, we use 3:1 as minimum for QR
    if (contrastRatio < 3) {
        return {
            valid: false,
            error: "Low contrast between colors may cause scanning issues",
        };
    }

    return { valid: true };
}
