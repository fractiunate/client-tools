/**
 * Certificate Generator Validation
 * Input validation functions for certificate generation
 */

import type {
    SubjectInfo,
    SANEntry,
    ValiditySettings,
    ValidationResult,
    CertGenerationInput
} from "./types";

// ============ Individual Validators ============

/**
 * Validate an IPv4 address
 * @param ip - IP address string to validate
 * @returns True if valid IPv4
 */
export function isValidIPv4(ip: string): boolean {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipv4Regex.test(ip);
}

/**
 * Validate an IPv6 address (simplified validation)
 * @param ip - IP address string to validate
 * @returns True if valid IPv6
 */
export function isValidIPv6(ip: string): boolean {
    if (!ip || typeof ip !== "string") return false;

    // Handle compressed formats
    if (ip === "::") return true;
    if (ip === "::1") return true;

    // Check for valid hex characters and colons
    if (!/^[a-fA-F0-9:]+$/.test(ip)) return false;

    // Split by :: to handle compressed notation
    const parts = ip.split("::");
    if (parts.length > 2) return false;

    // Count total groups
    const leftGroups = parts[0] ? parts[0].split(":") : [];
    const rightGroups = parts[1] ? parts[1].split(":") : [];

    // Validate each group is 1-4 hex chars
    const allGroups = [...leftGroups, ...rightGroups].filter(g => g !== "");
    for (const group of allGroups) {
        if (group.length > 4) return false;
    }

    // Full format must have 8 groups, compressed must have <= 7
    if (parts.length === 1) {
        return leftGroups.length === 8;
    }

    return leftGroups.length + rightGroups.length <= 7;
}

/**
 * Validate an IP address (IPv4 or IPv6)
 * @param ip - IP address string to validate
 * @returns True if valid IP address
 */
export function isValidIP(ip: string): boolean {
    return isValidIPv4(ip) || isValidIPv6(ip);
}

/**
 * Validate an email address
 * @param email - Email string to validate
 * @returns True if valid email format
 */
export function isValidEmail(email: string): boolean {
    if (!email || typeof email !== "string") return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate a domain name (including wildcards)
 * @param domain - Domain string to validate
 * @returns True if valid domain
 */
export function isValidDomain(domain: string): boolean {
    if (!domain || typeof domain !== "string") return false;

    // Allow localhost
    if (domain === "localhost") return true;

    // Reject double dots
    if (domain.includes("..")) return false;

    // Reject leading dots
    if (domain.startsWith(".")) return false;

    // Reject underscores
    if (domain.includes("_")) return false;

    // Handle wildcards
    let checkDomain = domain;
    if (domain.startsWith("*.")) {
        checkDomain = domain.substring(2);
    }

    // Split by dots and validate each part
    const parts = checkDomain.split(".");
    if (parts.length < 2) return false;

    for (const part of parts) {
        // Each part must be alphanumeric with optional hyphens in the middle
        if (!part || part.startsWith("-") || part.endsWith("-")) return false;
        if (!/^[a-zA-Z0-9-]+$/.test(part)) return false;
    }

    return true;
}

/**
 * Validate a common name (CN)
 * @param cn - Common name to validate
 * @returns True if valid common name
 */
export function isValidCommonName(cn: string): boolean {
    if (!cn || typeof cn !== "string") return false;
    // Common name should not be empty and should have reasonable length
    return cn.trim().length > 0 && cn.length <= 64;
}

/**
 * Validate a country code (ISO 3166-1 alpha-2)
 * @param code - Country code to validate
 * @returns True if valid 2-letter country code
 */
export function isValidCountryCode(code: string): boolean {
    if (!code) return true; // Country is optional
    // Must be exactly 2 uppercase letters
    return /^[A-Z]{2}$/.test(code);
}

// ============ Composite Validators ============

/**
 * Validate subject information
 * @param subject - Subject info to validate
 * @returns ValidationResult with valid flag and optional error
 */
export function validateSubject(subject: SubjectInfo): ValidationResult {
    if (!subject.commonName || !subject.commonName.trim()) {
        return { valid: false, error: "Common Name (CN) is required" };
    }

    if (!isValidCommonName(subject.commonName)) {
        return { valid: false, error: "Common Name must be between 1-64 characters" };
    }

    if (subject.email && !isValidEmail(subject.email)) {
        return { valid: false, error: "Invalid email address format" };
    }

    if (subject.country && !isValidCountryCode(subject.country)) {
        return { valid: false, error: "Country code must be exactly 2 uppercase letters (e.g., US, GB)" };
    }

    return { valid: true };
}

/**
 * Validate a single SAN entry
 * @param san - SAN entry to validate
 * @returns ValidationResult with valid flag and optional error
 */
export function validateSANEntry(san: SANEntry): ValidationResult {
    if (!san.value || !san.value.trim()) {
        return { valid: false, error: "SAN value cannot be empty" };
    }

    switch (san.type) {
        case "ip":
            if (!isValidIP(san.value)) {
                return { valid: false, error: `Invalid IP address: ${san.value}` };
            }
            break;
        case "email":
            if (!isValidEmail(san.value)) {
                return { valid: false, error: `Invalid email in SAN: ${san.value}` };
            }
            break;
        case "dns":
            if (!isValidDomain(san.value)) {
                return { valid: false, error: `Invalid DNS domain in SAN: ${san.value}` };
            }
            break;
    }

    return { valid: true };
}

/**
 * Validate all SAN entries
 * @param sans - Array of SAN entries to validate
 * @returns ValidationResult with valid flag and optional error
 */
export function validateSANs(sans: SANEntry[]): ValidationResult {
    for (const san of sans) {
        const result = validateSANEntry(san);
        if (!result.valid) {
            return result;
        }
    }
    return { valid: true };
}

/**
 * Validate validity settings
 * @param validity - Validity settings to validate
 * @returns ValidationResult with valid flag and optional error
 */
export function validateValidity(validity: ValiditySettings): ValidationResult {
    if (validity.useCustomDates) {
        if (!validity.customStartDate || !validity.customEndDate) {
            return {
                valid: false,
                error: "Both start and end dates are required when using custom dates"
            };
        }

        const startDate = new Date(validity.customStartDate);
        const endDate = new Date(validity.customEndDate);

        if (isNaN(startDate.getTime())) {
            return { valid: false, error: "Invalid start date format" };
        }

        if (isNaN(endDate.getTime())) {
            return { valid: false, error: "Invalid end date format" };
        }

        if (endDate <= startDate) {
            return { valid: false, error: "End date must be after start date" };
        }
    } else {
        if (!validity.days || validity.days < 1) {
            return { valid: false, error: "Validity must be at least 1 day" };
        }

        if (validity.days > 7300) { // ~20 years
            return { valid: false, error: "Validity cannot exceed 7300 days (20 years)" };
        }
    }

    return { valid: true };
}

/**
 * Validate PEM formatted certificate
 * @param pem - PEM string to validate
 * @returns ValidationResult with valid flag and optional error
 */
export function validatePEMCertificate(pem: string): ValidationResult {
    if (!pem || !pem.trim()) {
        return { valid: false, error: "Certificate is required" };
    }

    if (!pem.includes("-----BEGIN CERTIFICATE-----")) {
        return { valid: false, error: "Invalid certificate format. Must be PEM encoded." };
    }

    if (!pem.includes("-----END CERTIFICATE-----")) {
        return { valid: false, error: "Invalid certificate format. Missing END marker." };
    }

    return { valid: true };
}

/**
 * Validate PEM formatted private key
 * @param pem - PEM string to validate
 * @returns ValidationResult with valid flag and optional error
 */
export function validatePEMPrivateKey(pem: string): ValidationResult {
    if (!pem || !pem.trim()) {
        return { valid: false, error: "Private key is required" };
    }

    const hasPrivateKey = pem.includes("-----BEGIN PRIVATE KEY-----") ||
        pem.includes("-----BEGIN RSA PRIVATE KEY-----") ||
        pem.includes("-----BEGIN EC PRIVATE KEY-----");

    if (!hasPrivateKey) {
        return { valid: false, error: "Invalid private key format. Must be PEM encoded." };
    }

    return { valid: true };
}

/**
 * Validate all certificate generation inputs
 * @param input - All certificate generation inputs
 * @returns ValidationResult with valid flag and optional error
 */
export function validateCertGenerationInput(input: CertGenerationInput): ValidationResult {
    // Validate subject
    const subjectResult = validateSubject(input.subject);
    if (!subjectResult.valid) return subjectResult;

    // Validate SANs
    const sansResult = validateSANs(input.sans);
    if (!sansResult.valid) return sansResult;

    // Validate validity
    const validityResult = validateValidity(input.validity);
    if (!validityResult.valid) return validityResult;

    // Validate CA inputs if using existing CA
    if (input.useExistingCA) {
        const certResult = validatePEMCertificate(input.rootCAInput.certificate);
        if (!certResult.valid) return certResult;

        const keyResult = validatePEMPrivateKey(input.rootCAInput.privateKey);
        if (!keyResult.valid) return keyResult;
    }

    return { valid: true };
}
