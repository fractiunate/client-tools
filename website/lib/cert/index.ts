/**
 * Certificate Generator Module
 * Export all types, utilities, and services
 */

// Types
export type {
    SubjectInfo,
    KeySettings,
    ValiditySettings,
    SANEntry,
    KeyUsageSettings,
    ExtKeyUsageSettings,
    CASettings,
    RootCAInput,
    OutputSettings,
    GeneratedCert,
    CertPreset,
    CertPresetConfig,
    CountryCode,
    CertGenerationInput,
    ValidationResult,
} from "./types";

// Constants
export {
    DEFAULT_SUBJECT,
    DEFAULT_KEY_SETTINGS,
    DEFAULT_VALIDITY,
    DEFAULT_KEY_USAGE,
    DEFAULT_EXT_KEY_USAGE,
    DEFAULT_CA_SETTINGS,
    DEFAULT_OUTPUT_SETTINGS,
    PRESETS,
    COUNTRY_CODES,
    PRESET_CONFIGS,
} from "./constants";

// Utilities
export {
    buildDistinguishedName,
    getAlgorithmParams,
    getSigningAlgorithm,
    getSigningAlgorithmParams,
    arrayBufferToBase64,
    base64ToArrayBuffer,
    formatPEM,
    pemToArrayBuffer,
    generateSerialNumber,
    calculateValidityDates,
    extractPEMType,
    isValidPEM,
} from "./utils";

// Validation
export {
    isValidIPv4,
    isValidIPv6,
    isValidIP,
    isValidEmail,
    isValidDomain,
    isValidCommonName,
    isValidCountryCode,
    validateSubject,
    validateSANEntry,
    validateSANs,
    validateValidity,
    validatePEMCertificate,
    validatePEMPrivateKey,
    validateCertGenerationInput,
} from "./validation";

// Generator
export {
    generateCertificate,
    parseCertificate,
    type CertGenerationResult,
} from "./generator";
