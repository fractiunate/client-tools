// Client-side favicon conversion service
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { convertImageToFavicons, ConvertedImage } from "./image-converter";

export interface ConversionFormat {
    id: string;
    name: string;
    extension: string;
    sizes?: number[];
    description: string;
}

export interface ConversionResult {
    id: string;
    format: string;
    size?: number;
    url: string;
    filename: string;
    blob: Blob;
}

export interface ConversionResponse {
    success: boolean;
    message: string;
    results: ConversionResult[];
}

// Available favicon formats
export const FAVICON_FORMATS: ConversionFormat[] = [
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
 * Convert a file to selected favicon formats (client-side)
 */
export async function convertFavicon(
    file: File,
    formats: string[],
    onProgress?: (progress: number) => void
): Promise<ConversionResponse> {
    // Validation
    const validation = validateImageFile(file);
    if (!validation.valid) {
        return {
            success: false,
            message: validation.error || "Invalid file",
            results: [],
        };
    }

    if (formats.length === 0) {
        return {
            success: false,
            message: "Please select at least one output format",
            results: [],
        };
    }

    try {
        // Perform actual conversion
        const convertedImages = await convertImageToFavicons(file, formats, onProgress);

        // Convert to result format with blob URLs
        const results: ConversionResult[] = convertedImages.map((img) => ({
            id: `result-${img.format}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            format: img.format,
            size: img.size,
            url: URL.createObjectURL(img.blob),
            filename: img.filename,
            blob: img.blob,
        }));

        return {
            success: true,
            message: `Successfully converted to ${formats.length} format(s)`,
            results,
        };
    } catch (error) {
        console.error("Conversion error:", error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "Conversion failed",
            results: [],
        };
    }
}

/**
 * Download a single converted favicon
 */
export async function downloadFavicon(result: ConversionResult): Promise<void> {
    saveAs(result.blob, result.filename);
}

/**
 * Download all converted favicons as a ZIP file
 */
export async function downloadAllAsZip(results: ConversionResult[]): Promise<void> {
    const zip = new JSZip();

    // Add each file to the ZIP
    for (const result of results) {
        zip.file(result.filename, result.blob);
    }

    // Generate and download the ZIP
    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, "favicons.zip");
}

/**
 * Clean up blob URLs when results are no longer needed
 */
export function cleanupResults(results: ConversionResult[]): void {
    for (const result of results) {
        if (result.url.startsWith("blob:")) {
            URL.revokeObjectURL(result.url);
        }
    }
}

/**
 * Validate image file before upload
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/svg+xml",
        "image/webp",
        "image/gif",
        "image/x-icon",
        "image/vnd.microsoft.icon",
    ];

    // Also check file extension for ICO files (some browsers report different MIME types)
    const isIcoFile = file.name.toLowerCase().endsWith(".ico");

    if (!allowedTypes.includes(file.type) && !isIcoFile) {
        return {
            valid: false,
            error: "Please upload a valid image (PNG, JPG, SVG, WebP, GIF, or ICO)",
        };
    }

    if (file.size > maxSize) {
        return {
            valid: false,
            error: "File size must be less than 10MB",
        };
    }

    return { valid: true };
}
