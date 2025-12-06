/**
 * Favicon Converter Types
 * Type definitions for favicon conversion
 */

/**
 * Available favicon format configuration
 */
export interface FaviconFormat {
    id: string;
    name: string;
    extension: string;
    sizes?: number[];
    description: string;
}

/**
 * Result of a single favicon conversion
 */
export interface ConvertedFavicon {
    blob: Blob;
    filename: string;
    format: string;
    size?: number;
}

/**
 * Conversion result with URL for preview
 */
export interface ConversionResult {
    id: string;
    format: string;
    size?: number;
    url: string;
    filename: string;
    blob: Blob;
}

/**
 * Response from conversion operation
 */
export interface ConversionResponse {
    success: boolean;
    message: string;
    results: ConversionResult[];
}

/**
 * File validation result
 */
export interface ValidationResult {
    valid: boolean;
    error?: string;
}

/**
 * Progress callback type
 */
export type ProgressCallback = (progress: number) => void;
