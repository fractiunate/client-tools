/**
 * Favicon Converter Service
 * Main conversion logic and download utilities
 */

import JSZip from "jszip";
import { saveAs } from "file-saver";
import type {
    ConvertedFavicon,
    ConversionResult,
    ConversionResponse,
    ProgressCallback
} from "./types";
import { loadImage, convertToFormat, createResultId } from "./utils";
import { validateImageFile, validateFormats } from "./validation";

/**
 * Convert a file to selected favicon formats
 * @param file - Image file to convert
 * @param formats - Array of format IDs to generate
 * @param onProgress - Optional progress callback (0-100)
 * @returns Promise resolving to ConversionResponse
 */
export async function convertFavicon(
    file: File,
    formats: string[],
    onProgress?: ProgressCallback
): Promise<ConversionResponse> {
    // Validate file
    const fileValidation = validateImageFile(file);
    if (!fileValidation.valid) {
        return {
            success: false,
            message: fileValidation.error || "Invalid file",
            results: [],
        };
    }

    // Validate formats
    const formatValidation = validateFormats(formats);
    if (!formatValidation.valid) {
        return {
            success: false,
            message: formatValidation.error || "Invalid formats",
            results: [],
        };
    }

    try {
        // Load the image
        const img = await loadImage(file);
        const results: ConversionResult[] = [];

        // Convert to each format
        for (let i = 0; i < formats.length; i++) {
            const formatId = formats[i];
            const converted = await convertToFormat(img, formatId);

            results.push({
                id: createResultId(formatId),
                format: converted.format,
                size: converted.size,
                url: URL.createObjectURL(converted.blob),
                filename: converted.filename,
                blob: converted.blob,
            });

            // Report progress
            if (onProgress) {
                onProgress(Math.round(((i + 1) / formats.length) * 100));
            }
        }

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
 * Convert an image file to multiple favicon formats (raw conversion)
 * @param file - Image file to convert
 * @param formats - Array of format IDs to generate
 * @param onProgress - Optional progress callback
 * @returns Promise resolving to array of ConvertedFavicon
 */
export async function convertImageToFavicons(
    file: File,
    formats: string[],
    onProgress?: ProgressCallback
): Promise<ConvertedFavicon[]> {
    const img = await loadImage(file);
    const results: ConvertedFavicon[] = [];

    for (let i = 0; i < formats.length; i++) {
        const formatId = formats[i];
        const converted = await convertToFormat(img, formatId);
        results.push(converted);

        if (onProgress) {
            onProgress(Math.round(((i + 1) / formats.length) * 100));
        }
    }

    return results;
}

/**
 * Download a single converted favicon
 * @param result - Conversion result to download
 */
export async function downloadFavicon(result: ConversionResult): Promise<void> {
    saveAs(result.blob, result.filename);
}

/**
 * Download all converted favicons as a ZIP file
 * @param results - Array of conversion results
 * @param zipFilename - Optional custom ZIP filename (default: "favicons.zip")
 */
export async function downloadAllAsZip(
    results: ConversionResult[],
    zipFilename: string = "favicons.zip"
): Promise<void> {
    const zip = new JSZip();

    // Add each file to the ZIP
    for (const result of results) {
        zip.file(result.filename, result.blob);
    }

    // Generate and download the ZIP
    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, zipFilename);
}

/**
 * Clean up blob URLs when results are no longer needed
 * Call this when unmounting or resetting to prevent memory leaks
 * @param results - Array of conversion results to clean up
 */
export function cleanupResults(results: ConversionResult[]): void {
    for (const result of results) {
        if (result.url.startsWith("blob:")) {
            URL.revokeObjectURL(result.url);
        }
    }
}
