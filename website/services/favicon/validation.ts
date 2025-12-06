/**
 * Favicon Converter Validation
 * Input validation functions
 */

import type { ValidationResult } from "./types";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE, FAVICON_FORMATS } from "./constants";

/**
 * Validate an image file for favicon conversion
 * @param file - File to validate
 * @returns ValidationResult with valid flag and optional error
 */
export function validateImageFile(file: File): ValidationResult {
    if (!file) {
        return {
            valid: false,
            error: "No file provided",
        };
    }

    // Check file extension for ICO files (some browsers report different MIME types)
    const isIcoFile = file.name.toLowerCase().endsWith(".ico");

    if (!ALLOWED_MIME_TYPES.includes(file.type) && !isIcoFile) {
        return {
            valid: false,
            error: "Please upload a valid image (PNG, JPG, SVG, WebP, GIF, or ICO)",
        };
    }

    if (file.size > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: "File size must be less than 10MB",
        };
    }

    if (file.size === 0) {
        return {
            valid: false,
            error: "File is empty",
        };
    }

    return { valid: true };
}

/**
 * Validate selected formats for conversion
 * @param formats - Array of format IDs to validate
 * @returns ValidationResult
 */
export function validateFormats(formats: string[]): ValidationResult {
    if (!formats || formats.length === 0) {
        return {
            valid: false,
            error: "Please select at least one output format",
        };
    }

    // Check for unknown format IDs
    const validFormatIds = FAVICON_FORMATS.map(f => f.id);
    const unknownFormats = formats.filter(f => !validFormatIds.includes(f));
    if (unknownFormats.length > 0) {
        return {
            valid: false,
            error: `Unknown format(s): ${unknownFormats.join(", ")}`,
        };
    }

    return { valid: true };
}

/**
 * Check if a MIME type is supported
 * @param mimeType - MIME type to check
 * @returns True if supported
 */
export function isSupportedMimeType(mimeType: string): boolean {
    return ALLOWED_MIME_TYPES.includes(mimeType);
}

/**
 * Check if file extension is supported
 * @param filename - Filename to check
 * @returns True if supported
 */
export function isSupportedExtension(filename: string): boolean {
    const supportedExtensions = [".png", ".jpg", ".jpeg", ".svg", ".webp", ".gif", ".ico"];
    const ext = filename.toLowerCase().slice(filename.lastIndexOf("."));
    return supportedExtensions.includes(ext);
}

/**
 * Get file extension from filename
 * @param filename - Filename to extract extension from
 * @returns Extension including the dot, or empty string
 */
export function getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf(".");
    if (lastDot === -1) return "";
    return filename.slice(lastDot).toLowerCase();
}
