/**
 * QR Generator Constants
 */

import type {
    QROptions,
    SizeOption,
    ErrorLevelOption,
    ErrorCorrectionLevel
} from "./types";

/**
 * Default QR code generation options
 */
export const DEFAULT_OPTIONS: QROptions = {
    size: 256,
    margin: 2,
    darkColor: "#000000",
    lightColor: "#ffffff",
    errorCorrectionLevel: "M",
};

/**
 * Available size options for QR codes
 */
export const SIZE_OPTIONS: SizeOption[] = [
    { value: "128", label: "128 x 128" },
    { value: "256", label: "256 x 256" },
    { value: "512", label: "512 x 512" },
    { value: "1024", label: "1024 x 1024" },
];

/**
 * Error correction level options with descriptions
 */
export const ERROR_LEVELS: ErrorLevelOption[] = [
    { value: "L", label: "Low (7%)" },
    { value: "M", label: "Medium (15%)" },
    { value: "Q", label: "Quartile (25%)" },
    { value: "H", label: "High (30%)" },
];

/**
 * Minimum QR code size in pixels
 */
export const MIN_QR_SIZE = 64;

/**
 * Maximum QR code size in pixels
 */
export const MAX_QR_SIZE = 2048;

/**
 * Default debounce delay for QR generation (ms)
 */
export const GENERATION_DEBOUNCE_MS = 300;

/**
 * Maximum content length for QR codes (approximate - depends on error correction)
 * With alphanumeric mode and L error correction, max is ~4296 characters
 * With byte mode and H error correction, max is ~1273 characters
 */
export const MAX_CONTENT_LENGTH: Record<ErrorCorrectionLevel, number> = {
    L: 4000,
    M: 3000,
    Q: 2000,
    H: 1200,
};

/**
 * WiFi encryption type labels
 */
export const WIFI_ENCRYPTION_LABELS: Record<string, string> = {
    WPA: "WPA/WPA2",
    WEP: "WEP",
    nopass: "None (Open)",
};

/**
 * Valid hex color pattern
 */
export const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;
