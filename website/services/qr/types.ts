/**
 * QR Generator Type Definitions
 */

/**
 * QR code input type
 */
export type QRInputType = "text" | "url" | "wifi";

/**
 * WiFi encryption type
 */
export type WifiEncryptionType = "WPA" | "WEP" | "nopass";

/**
 * Error correction level for QR codes
 * L = ~7% recovery
 * M = ~15% recovery
 * Q = ~25% recovery
 * H = ~30% recovery
 */
export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

/**
 * Download format for QR codes
 */
export type QRDownloadFormat = "png" | "svg";

/**
 * QR code generation options
 */
export interface QROptions {
    /** Size in pixels (width and height) */
    size: number;
    /** Margin (quiet zone) around the QR code in modules */
    margin: number;
    /** Foreground (dark) color in hex format */
    darkColor: string;
    /** Background (light) color in hex format */
    lightColor: string;
    /** Error correction level */
    errorCorrectionLevel: ErrorCorrectionLevel;
}

/**
 * Size option for the UI select dropdown
 */
export interface SizeOption {
    value: string;
    label: string;
}

/**
 * Error correction level option for the UI
 */
export interface ErrorLevelOption {
    value: ErrorCorrectionLevel;
    label: string;
}

/**
 * WiFi network configuration for QR generation
 */
export interface WifiConfig {
    ssid: string;
    password: string;
    encryption: WifiEncryptionType;
}

/**
 * Result of QR code generation
 */
export interface QRGenerationResult {
    success: boolean;
    dataUrl?: string;
    svg?: string;
    blob?: Blob;
    error?: string;
}

/**
 * Validation result for QR content
 */
export interface QRValidationResult {
    valid: boolean;
    error?: string;
}
