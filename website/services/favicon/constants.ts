/**
 * Favicon Converter Constants
 * Default values and configuration
 */

import type { FaviconFormat } from "./types";

/**
 * Supported favicon formats with configuration
 */
export const FAVICON_FORMATS: FaviconFormat[] = [
    {
        id: "ico",
        name: "ICO",
        extension: ".ico",
        sizes: [16, 32, 48],
        description: "Classic favicon format, supports multiple sizes",
    },
    {
        id: "png-16",
        name: "PNG 16x16",
        extension: ".png",
        sizes: [16],
        description: "Small PNG favicon",
    },
    {
        id: "png-32",
        name: "PNG 32x32",
        extension: ".png",
        sizes: [32],
        description: "Standard PNG favicon",
    },
    {
        id: "png-48",
        name: "PNG 48x48",
        extension: ".png",
        sizes: [48],
        description: "Large PNG favicon",
    },
    {
        id: "png-180",
        name: "Apple Touch Icon",
        extension: ".png",
        sizes: [180],
        description: "Apple Touch Icon (180x180)",
    },
    {
        id: "png-192",
        name: "Android Chrome 192",
        extension: ".png",
        sizes: [192],
        description: "Android Chrome icon (192x192)",
    },
    {
        id: "png-512",
        name: "Android Chrome 512",
        extension: ".png",
        sizes: [512],
        description: "Android Chrome large icon (512x512)",
    },
    {
        id: "svg",
        name: "SVG",
        extension: ".svg",
        description: "Scalable vector format",
    },
];

/**
 * Default selected formats for new conversions
 */
export const DEFAULT_SELECTED_FORMATS: string[] = [
    "ico",
    "png-16",
    "png-32",
    "png-180",
    "png-192",
    "png-512",
];

/**
 * Format ID to size mapping
 */
export const FORMAT_SIZES: Record<string, number | number[] | null> = {
    ico: [16, 32, 48],
    "png-16": 16,
    "png-32": 32,
    "png-48": 48,
    "png-180": 180,
    "png-192": 192,
    "png-512": 512,
    svg: 32,
};

/**
 * Allowed MIME types for upload
 */
export const ALLOWED_MIME_TYPES: string[] = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/svg+xml",
    "image/webp",
    "image/gif",
    "image/x-icon",
    "image/vnd.microsoft.icon",
];

/**
 * Maximum file size in bytes (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Get format configuration by ID
 */
export function getFormatById(formatId: string): FaviconFormat | undefined {
    return FAVICON_FORMATS.find(f => f.id === formatId);
}

/**
 * Get filename for a format
 */
export function getFilenameForFormat(formatId: string, size?: number): string {
    switch (formatId) {
        case "ico":
            return "favicon.ico";
        case "svg":
            return "favicon.svg";
        case "png-180":
            return "apple-touch-icon.png";
        case "png-192":
            return "android-chrome-192x192.png";
        case "png-512":
            return "android-chrome-512x512.png";
        default:
            return `favicon-${size}x${size}.png`;
    }
}
