/**
 * Certificate Generator Utilities
 * Pure utility functions for certificate generation
 */

import type { SubjectInfo, KeySettings, ValiditySettings } from "./types";

/**
 * Escape special characters in DN values
 * @param value - The value to escape
 * @returns Escaped value
 */
function escapeDNValue(value: string): string {
    return value
        .replace(/\\/g, '\\\\')
        .replace(/,/g, '\\,')
        .replace(/\+/g, '\\+')
        .replace(/"/g, '\\"')
        .replace(/</g, '\\<')
        .replace(/>/g, '\\>')
        .replace(/;/g, '\\;');
}

/**
 * Build a Distinguished Name (DN) string from subject info
 * @param subject - The subject information
 * @returns Formatted DN string (e.g., "CN=example.com, O=My Org, C=US")
 */
export function buildDistinguishedName(subject: SubjectInfo): string {
    const parts: string[] = [];
    if (subject.commonName) parts.push(`CN=${escapeDNValue(subject.commonName)}`);
    if (subject.organization) parts.push(`O=${escapeDNValue(subject.organization)}`);
    if (subject.organizationalUnit) parts.push(`OU=${escapeDNValue(subject.organizationalUnit)}`);
    if (subject.locality) parts.push(`L=${escapeDNValue(subject.locality)}`);
    if (subject.state) parts.push(`ST=${escapeDNValue(subject.state)}`);
    if (subject.country) parts.push(`C=${escapeDNValue(subject.country)}`);
    if (subject.email) parts.push(`E=${escapeDNValue(subject.email)}`);
    return parts.join(", ");
}

/**
 * Get Web Crypto API algorithm parameters for key generation
 * @param settings - Key settings configuration
 * @returns Algorithm parameters for crypto.subtle.generateKey
 */
export function getAlgorithmParams(settings: KeySettings): EcKeyGenParams | RsaHashedKeyGenParams {
    if (settings.algorithm === "ECDSA") {
        return {
            name: "ECDSA",
            namedCurve: settings.ecdsaCurve,
        };
    }
    return {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: parseInt(settings.rsaKeySize),
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: settings.signingAlgorithm,
    };
}

/**
 * Get signing algorithm string (e.g., "SHA256withRSA") for X.509 certificate
 * @param algorithm - Key algorithm (RSA or ECDSA)
 * @param hash - Hash algorithm (SHA-256, SHA-384, SHA-512)
 * @returns Signing algorithm string for X.509
 */
export function getSigningAlgorithm(algorithm: "RSA" | "ECDSA", hash: "SHA-256" | "SHA-384" | "SHA-512"): string {
    const hashName = hash.replace("-", "");
    if (algorithm === "ECDSA") {
        return `${hashName}withECDSA`;
    }
    return `${hashName}withRSA`;
}

/**
 * Get signing algorithm parameters for Web Crypto API operations
 * @param settings - Key settings configuration
 * @returns Algorithm parameters for signing operations
 */
export function getSigningAlgorithmParams(settings: KeySettings): Algorithm | EcdsaParams | RsaHashedImportParams {
    if (settings.algorithm === "ECDSA") {
        return {
            name: "ECDSA",
            hash: settings.signingAlgorithm,
        };
    }
    return {
        name: "RSASSA-PKCS1-v1_5",
        hash: settings.signingAlgorithm,
    };
}

/**
 * Convert ArrayBuffer to Base64 string
 * @param buffer - ArrayBuffer to convert
 * @returns Base64 encoded string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 * @param base64 - Base64 string to convert
 * @returns ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * Format a Base64 string as PEM
 * @param base64 - Base64 encoded data
 * @param type - PEM type (e.g., "CERTIFICATE", "PRIVATE KEY")
 * @returns Formatted PEM string
 */
export function formatPEM(base64: string, type: string): string {
    const lines = base64.match(/.{1,64}/g) || [];
    return `-----BEGIN ${type}-----\n${lines.join("\n")}\n-----END ${type}-----`;
}

/**
 * Parse PEM string to ArrayBuffer
 * @param pem - PEM formatted string
 * @returns ArrayBuffer of the decoded data
 */
export function pemToArrayBuffer(pem: string): ArrayBuffer {
    const lines = pem.split("\n");
    const base64 = lines
        .filter(line => !line.startsWith("-----"))
        .join("");
    return base64ToArrayBuffer(base64);
}

/**
 * Generate a random serial number for certificates
 * @returns Hex string serial number (32 characters)
 */
export function generateSerialNumber(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array).map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Calculate certificate validity dates
 * @param validity - Validity settings object
 * @returns Object with notBefore and notAfter dates
 */
export function calculateValidityDates(
    validity: ValiditySettings
): { notBefore: Date; notAfter: Date } {
    const notBefore = validity.useCustomDates && validity.customStartDate
        ? new Date(validity.customStartDate)
        : new Date();

    const notAfter = validity.useCustomDates && validity.customEndDate
        ? new Date(validity.customEndDate)
        : new Date(notBefore.getTime() + validity.days * 24 * 60 * 60 * 1000);

    return { notBefore, notAfter };
}

/**
 * Extract the PEM type from a PEM string
 * @param pem - PEM formatted string
 * @returns The type (e.g., "CERTIFICATE", "PRIVATE KEY") or null if invalid
 */
export function extractPEMType(pem: string): string | null {
    const match = pem.match(/-----BEGIN\s+(.+?)-----/);
    return match ? match[1] : null;
}

/**
 * Check if a string is a valid PEM format
 * @param pem - String to check
 * @returns True if valid PEM format
 */
export function isValidPEM(pem: string): boolean {
    const beginMatch = pem.match(/-----BEGIN\s+(.+?)-----/);
    const endMatch = pem.match(/-----END\s+(.+?)-----/);

    if (!beginMatch || !endMatch) return false;
    return beginMatch[1] === endMatch[1];
}
