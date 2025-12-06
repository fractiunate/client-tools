/**
 * JSON/YAML Formatter Service
 * Core formatting and conversion logic
 */

import YAML from "yaml";
import type {
    FormatType,
    FormatResult,
    JsonFormatOptions,
    YamlFormatOptions,
} from "./types";
import { DEFAULT_JSON_OPTIONS, DEFAULT_YAML_OPTIONS } from "./constants";
import { validateJson, validateYaml, detectFormat } from "./validation";

/**
 * Sort object keys recursively
 * @param obj - Object to sort
 * @returns New object with sorted keys
 */
function sortKeysRecursive(obj: unknown): unknown {
    if (obj === null || typeof obj !== "object") {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(sortKeysRecursive);
    }

    const sorted: Record<string, unknown> = {};
    const keys = Object.keys(obj as Record<string, unknown>).sort();

    for (const key of keys) {
        sorted[key] = sortKeysRecursive((obj as Record<string, unknown>)[key]);
    }

    return sorted;
}

/**
 * Format JSON string
 * @param input - JSON string to format
 * @param options - Format options
 * @returns FormatResult
 */
export function formatJson(
    input: string,
    options: Partial<JsonFormatOptions> = {}
): FormatResult {
    const opts = { ...DEFAULT_JSON_OPTIONS, ...options };

    const validation = validateJson(input);
    if (!validation.valid) {
        return {
            success: false,
            error: validation.error,
            inputFormat: "json",
            outputFormat: "json",
        };
    }

    try {
        let data = validation.parsed;

        if (opts.sortKeys) {
            data = sortKeysRecursive(data);
        }

        const output = JSON.stringify(data, null, opts.indent);

        return {
            success: true,
            output,
            inputFormat: "json",
            outputFormat: "json",
        };
    } catch (e) {
        return {
            success: false,
            error: e instanceof Error ? e.message : "Failed to format JSON",
            inputFormat: "json",
            outputFormat: "json",
        };
    }
}

/**
 * Format YAML string
 * @param input - YAML string to format
 * @param options - Format options
 * @returns FormatResult
 */
export function formatYaml(
    input: string,
    options: Partial<YamlFormatOptions> = {}
): FormatResult {
    const opts = { ...DEFAULT_YAML_OPTIONS, ...options };

    const validation = validateYaml(input);
    if (!validation.valid) {
        return {
            success: false,
            error: validation.error,
            inputFormat: "yaml",
            outputFormat: "yaml",
        };
    }

    try {
        let data = validation.parsed;

        if (opts.sortKeys) {
            data = sortKeysRecursive(data);
        }

        const output = YAML.stringify(data, {
            indent: opts.indent,
            lineWidth: opts.lineWidth,
            defaultKeyType: "PLAIN",
            defaultStringType: opts.forceQuotes ? "QUOTE_SINGLE" : "PLAIN",
        });

        return {
            success: true,
            output: output.trim(),
            inputFormat: "yaml",
            outputFormat: "yaml",
        };
    } catch (e) {
        return {
            success: false,
            error: e instanceof Error ? e.message : "Failed to format YAML",
            inputFormat: "yaml",
            outputFormat: "yaml",
        };
    }
}

/**
 * Convert JSON to YAML
 * @param input - JSON string to convert
 * @param options - YAML output options
 * @returns FormatResult
 */
export function jsonToYaml(
    input: string,
    options: Partial<YamlFormatOptions> = {}
): FormatResult {
    const opts = { ...DEFAULT_YAML_OPTIONS, ...options };

    const validation = validateJson(input);
    if (!validation.valid) {
        return {
            success: false,
            error: validation.error,
            inputFormat: "json",
            outputFormat: "yaml",
        };
    }

    try {
        let data = validation.parsed;

        if (opts.sortKeys) {
            data = sortKeysRecursive(data);
        }

        const output = YAML.stringify(data, {
            indent: opts.indent,
            lineWidth: opts.lineWidth,
            defaultKeyType: "PLAIN",
            defaultStringType: opts.forceQuotes ? "QUOTE_SINGLE" : "PLAIN",
        });

        return {
            success: true,
            output: output.trim(),
            inputFormat: "json",
            outputFormat: "yaml",
        };
    } catch (e) {
        return {
            success: false,
            error: e instanceof Error ? e.message : "Failed to convert to YAML",
            inputFormat: "json",
            outputFormat: "yaml",
        };
    }
}

/**
 * Convert YAML to JSON
 * @param input - YAML string to convert
 * @param options - JSON output options
 * @returns FormatResult
 */
export function yamlToJson(
    input: string,
    options: Partial<JsonFormatOptions> = {}
): FormatResult {
    const opts = { ...DEFAULT_JSON_OPTIONS, ...options };

    const validation = validateYaml(input);
    if (!validation.valid) {
        return {
            success: false,
            error: validation.error,
            inputFormat: "yaml",
            outputFormat: "json",
        };
    }

    try {
        let data = validation.parsed;

        if (opts.sortKeys) {
            data = sortKeysRecursive(data);
        }

        const output = JSON.stringify(data, null, opts.indent);

        return {
            success: true,
            output,
            inputFormat: "yaml",
            outputFormat: "json",
        };
    } catch (e) {
        return {
            success: false,
            error: e instanceof Error ? e.message : "Failed to convert to JSON",
            inputFormat: "yaml",
            outputFormat: "json",
        };
    }
}

/**
 * Minify JSON (remove whitespace)
 * @param input - JSON string to minify
 * @returns FormatResult
 */
export function minifyJson(input: string): FormatResult {
    const validation = validateJson(input);
    if (!validation.valid) {
        return {
            success: false,
            error: validation.error,
            inputFormat: "json",
            outputFormat: "json",
        };
    }

    try {
        const output = JSON.stringify(validation.parsed);
        return {
            success: true,
            output,
            inputFormat: "json",
            outputFormat: "json",
        };
    } catch (e) {
        return {
            success: false,
            error: e instanceof Error ? e.message : "Failed to minify JSON",
            inputFormat: "json",
            outputFormat: "json",
        };
    }
}

/**
 * Auto-format input based on detected or specified format
 * @param input - Input string
 * @param targetFormat - Optional target format for conversion
 * @param options - Format options
 * @returns FormatResult
 */
export function autoFormat(
    input: string,
    targetFormat?: FormatType,
    options?: Partial<JsonFormatOptions & YamlFormatOptions>
): FormatResult {
    const sourceFormat = detectFormat(input);

    if (!sourceFormat) {
        return {
            success: false,
            error: "Could not detect input format. Please ensure valid JSON or YAML.",
        };
    }

    // If no target specified, format in place
    if (!targetFormat || targetFormat === sourceFormat) {
        if (sourceFormat === "json") {
            return formatJson(input, options);
        }
        return formatYaml(input, options);
    }

    // Convert between formats
    if (sourceFormat === "json" && targetFormat === "yaml") {
        return jsonToYaml(input, options);
    }

    if (sourceFormat === "yaml" && targetFormat === "json") {
        return yamlToJson(input, options);
    }

    return {
        success: false,
        error: "Invalid format conversion",
    };
}
