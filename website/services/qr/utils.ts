/**
 * QR Generator Utility Functions
 */

import type {
    QRInputType,
    WifiConfig,
    WifiEncryptionType
} from "./types";

/**
 * Build WiFi QR code content string
 * @see https://github.com/zxing/zxing/wiki/Barcode-Contents#wi-fi-network-config-android-ios-11
 * @param config - WiFi configuration
 * @returns WiFi QR code string
 */
export function buildWifiString(config: WifiConfig): string {
    if (!config.ssid) return "";

    // Escape special characters in SSID and password
    const escapeWifiField = (value: string): string => {
        return value
            .replace(/\\/g, "\\\\")
            .replace(/;/g, "\\;")
            .replace(/,/g, "\\,")
            .replace(/:/g, "\\:")
            .replace(/"/g, '\\"');
    };

    const ssid = escapeWifiField(config.ssid);
    const password = config.password ? escapeWifiField(config.password) : "";

    return `WIFI:T:${config.encryption};S:${ssid};P:${password};;`;
}

/**
 * Get QR content based on input type
 * @param inputType - Type of input (text, url, wifi)
 * @param text - Plain text content
 * @param url - URL content
 * @param wifiConfig - WiFi configuration
 * @returns Content string to encode
 */
export function getQRContent(
    inputType: QRInputType,
    text: string,
    url: string,
    wifiConfig: WifiConfig
): string {
    switch (inputType) {
        case "text":
            return text;
        case "url":
            return url;
        case "wifi":
            return buildWifiString(wifiConfig);
        default:
            return "";
    }
}

/**
 * Parse WiFi QR string back to config
 * @param wifiString - WiFi QR code string
 * @returns Parsed WiFi configuration or null if invalid
 */
export function parseWifiString(wifiString: string): WifiConfig | null {
    if (!wifiString.startsWith("WIFI:")) {
        return null;
    }

    const content = wifiString.slice(5, -2); // Remove "WIFI:" and ";;"

    // Parse using a proper method that handles escaped characters
    // Split by unescaped semicolons (semicolons not preceded by backslash)
    const parts: string[] = [];
    let current = "";
    let i = 0;

    while (i < content.length) {
        const char = content[i];
        if (char === "\\" && i + 1 < content.length) {
            // Keep the escape sequence for later processing
            current += char + content[i + 1];
            i += 2;
        } else if (char === ";") {
            parts.push(current);
            current = "";
            i++;
        } else {
            current += char;
            i++;
        }
    }
    if (current) {
        parts.push(current);
    }

    const config: Partial<WifiConfig> = {
        ssid: "",
        password: "",
        encryption: "WPA",
    };

    for (const part of parts) {
        const colonIndex = part.indexOf(":");
        if (colonIndex === -1) continue;

        const key = part.slice(0, colonIndex);
        const value = part.slice(colonIndex + 1);

        // Unescape special characters
        const unescaped = value
            .replace(/\\;/g, ";")
            .replace(/\\,/g, ",")
            .replace(/\\:/g, ":")
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, "\\");

        switch (key) {
            case "T":
                if (value === "WPA" || value === "WEP" || value === "nopass") {
                    config.encryption = value as WifiEncryptionType;
                }
                break;
            case "S":
                config.ssid = unescaped;
                break;
            case "P":
                config.password = unescaped;
                break;
        }
    }

    if (!config.ssid) {
        return null;
    }

    return config as WifiConfig;
}

/**
 * Convert data URL to Blob
 * @param dataUrl - Data URL string
 * @returns Promise resolving to Blob
 */
export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const response = await fetch(dataUrl);
    return response.blob();
}

/**
 * Normalize hex color (ensure # prefix and uppercase)
 * @param color - Color string
 * @returns Normalized hex color
 */
export function normalizeHexColor(color: string): string {
    let normalized = color.trim().toUpperCase();
    if (!normalized.startsWith("#")) {
        normalized = "#" + normalized;
    }
    return normalized;
}

/**
 * Calculate estimated QR code version based on content length
 * @param contentLength - Length of content to encode
 * @param errorLevel - Error correction level
 * @returns Estimated QR version (1-40)
 */
export function estimateQRVersion(
    contentLength: number,
    errorLevel: "L" | "M" | "Q" | "H"
): number {
    // Simplified capacity table for byte mode
    const capacities: Record<string, number[]> = {
        L: [17, 32, 53, 78, 106, 134, 154, 192, 230, 271, 321, 367, 425, 458, 520, 586, 644, 718, 792, 858],
        M: [14, 26, 42, 62, 84, 106, 122, 152, 180, 213, 251, 287, 331, 362, 412, 450, 504, 560, 624, 666],
        Q: [11, 20, 32, 46, 60, 74, 86, 108, 130, 151, 177, 203, 241, 258, 292, 322, 364, 394, 442, 482],
        H: [7, 14, 24, 34, 44, 58, 64, 84, 98, 119, 137, 155, 177, 194, 220, 250, 280, 310, 338, 382],
    };

    const caps = capacities[errorLevel];
    for (let i = 0; i < caps.length; i++) {
        if (contentLength <= caps[i]) {
            return i + 1;
        }
    }
    return 40; // Max version
}

/**
 * Get suggested download filename
 * @param format - Download format (png or svg)
 * @param prefix - Optional filename prefix
 * @returns Suggested filename
 */
export function getSuggestedFilename(
    format: "png" | "svg",
    prefix: string = "qrcode"
): string {
    return `${prefix}.${format}`;
}
