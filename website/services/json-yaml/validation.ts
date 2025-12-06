/**
 * JSON/YAML Validation Functions
 */

import YAML from "yaml";
import type { ValidationResult, FormatType } from "./types";
import { MAX_INPUT_SIZE } from "./constants";

/**
 * Validate JSON string
 * @param input - JSON string to validate
 * @returns ValidationResult with parsed data if valid
 */
export function validateJson(input: string): ValidationResult {
    if (!input || input.trim().length === 0) {
        return {
            valid: false,
            error: "Input is empty",
        };
    }

    if (input.length > MAX_INPUT_SIZE) {
        return {
            valid: false,
            error: `Input too large. Maximum size is ${MAX_INPUT_SIZE / 1024}KB`,
        };
    }

    try {
        const parsed = JSON.parse(input);
        return {
            valid: true,
            parsed,
        };
    } catch (e) {
        const error = e instanceof Error ? e.message : "Invalid JSON";
        return {
            valid: false,
            error: `JSON parse error: ${error}`,
        };
    }
}

/**
 * Validate YAML string
 * @param input - YAML string to validate
 * @returns ValidationResult with parsed data if valid
 */
export function validateYaml(input: string): ValidationResult {
    if (!input || input.trim().length === 0) {
        return {
            valid: false,
            error: "Input is empty",
        };
    }

    if (input.length > MAX_INPUT_SIZE) {
        return {
            valid: false,
            error: `Input too large. Maximum size is ${MAX_INPUT_SIZE / 1024}KB`,
        };
    }

    try {
        const parsed = YAML.parse(input);
        return {
            valid: true,
            parsed,
        };
    } catch (e) {
        const error = e instanceof Error ? e.message : "Invalid YAML";
        return {
            valid: false,
            error: `YAML parse error: ${error}`,
        };
    }
}

/**
 * Auto-detect format from input string
 * @param input - Input string to detect
 * @returns Detected format or null if unable to determine
 */
export function detectFormat(input: string): FormatType | null {
    if (!input || input.trim().length === 0) {
        return null;
    }

    const trimmed = input.trim();

    // Check for JSON characteristics
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        // Try to parse as JSON first
        try {
            JSON.parse(trimmed);
            return "json";
        } catch {
            // Not valid JSON, might be YAML
        }
    }

    // Check for YAML-specific patterns
    // YAML often starts with key: value or has --- document marker
    if (
        trimmed.startsWith("---") ||
        /^[a-zA-Z_][a-zA-Z0-9_]*\s*:/.test(trimmed) ||
        trimmed.startsWith("- ")
    ) {
        try {
            YAML.parse(trimmed);
            return "yaml";
        } catch {
            // Not valid YAML either
        }
    }

    // Try JSON first (stricter format)
    try {
        JSON.parse(trimmed);
        return "json";
    } catch {
        // Not JSON
    }

    // Try YAML (more permissive)
    try {
        YAML.parse(trimmed);
        return "yaml";
    } catch {
        // Not valid format
    }

    return null;
}

/**
 * Validate input based on format
 * @param input - Input string
 * @param format - Expected format
 * @returns ValidationResult
 */
export function validateInput(input: string, format: FormatType): ValidationResult {
    if (format === "json") {
        return validateJson(input);
    }
    return validateYaml(input);
}
