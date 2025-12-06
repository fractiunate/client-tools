/**
 * JSON/YAML Formatter Type Definitions
 */

/**
 * Supported format types
 */
export type FormatType = "json" | "yaml";

/**
 * Indentation options
 */
export type IndentSize = 2 | 4 | 8;

/**
 * Format options for JSON
 */
export interface JsonFormatOptions {
    indent: IndentSize;
    sortKeys: boolean;
}

/**
 * Format options for YAML
 */
export interface YamlFormatOptions {
    indent: IndentSize;
    sortKeys: boolean;
    flowLevel: number; // -1 for block style, positive for flow style threshold
    lineWidth: number;
    quotingType: "'" | '"';
    forceQuotes: boolean;
}

/**
 * Result of a format/convert operation
 */
export interface FormatResult {
    success: boolean;
    output?: string;
    error?: string;
    inputFormat?: FormatType;
    outputFormat?: FormatType;
}

/**
 * Validation result
 */
export interface ValidationResult {
    valid: boolean;
    error?: string;
    parsed?: unknown;
}
