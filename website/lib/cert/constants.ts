/**
 * Certificate Generator Constants
 * Default values and configuration constants
 */

import type {
    SubjectInfo,
    KeySettings,
    ValiditySettings,
    KeyUsageSettings,
    ExtKeyUsageSettings,
    CASettings,
    OutputSettings,
    CertPreset,
    CertPresetConfig,
    CountryCode,
} from "./types";

export const DEFAULT_SUBJECT: SubjectInfo = {
    commonName: "",
    organization: "",
    organizationalUnit: "",
    country: "",
    state: "",
    locality: "",
    email: "",
};

export const DEFAULT_KEY_SETTINGS: KeySettings = {
    algorithm: "RSA",
    rsaKeySize: "2048",
    ecdsaCurve: "P-256",
    signingAlgorithm: "SHA-256",
};

export const DEFAULT_VALIDITY: ValiditySettings = {
    days: 365,
    customStartDate: "",
    customEndDate: "",
    useCustomDates: false,
};

export const DEFAULT_KEY_USAGE: KeyUsageSettings = {
    digitalSignature: true,
    keyEncipherment: true,
    dataEncipherment: false,
    keyAgreement: false,
    keyCertSign: false,
    crlSign: false,
};

export const DEFAULT_EXT_KEY_USAGE: ExtKeyUsageSettings = {
    serverAuth: true,
    clientAuth: false,
    codeSigning: false,
    emailProtection: false,
};

export const DEFAULT_CA_SETTINGS: CASettings = {
    isCA: false,
    pathLengthConstraint: null,
};

export const DEFAULT_OUTPUT_SETTINGS: OutputSettings = {
    certFormat: "pem",
    keyFormat: "pkcs8",
    keyPassphrase: "",
    includeChain: false,
};

export const PRESETS: Record<CertPreset, CertPresetConfig> = {
    webServer: { label: "Web Server", description: "TLS server authentication" },
    rootCA: { label: "Root CA", description: "Certificate Authority" },
    clientCert: { label: "Client Certificate", description: "TLS client authentication" },
    wildcard: { label: "Wildcard", description: "*.domain.com wildcard certificate" },
    custom: { label: "Custom", description: "Configure all options manually" },
};

export const COUNTRY_CODES: CountryCode[] = [
    { code: "US", name: "United States" },
    { code: "GB", name: "United Kingdom" },
    { code: "DE", name: "Germany" },
    { code: "FR", name: "France" },
    { code: "CA", name: "Canada" },
    { code: "AU", name: "Australia" },
    { code: "JP", name: "Japan" },
    { code: "CN", name: "China" },
    { code: "IN", name: "India" },
    { code: "BR", name: "Brazil" },
    { code: "NL", name: "Netherlands" },
    { code: "SE", name: "Sweden" },
    { code: "CH", name: "Switzerland" },
    { code: "SG", name: "Singapore" },
    { code: "KR", name: "South Korea" },
];

/**
 * Preset configurations for quick certificate setup
 */
export const PRESET_CONFIGS: Record<CertPreset, {
    keyUsage: KeyUsageSettings;
    extKeyUsage: ExtKeyUsageSettings;
    caSettings: CASettings;
    validityDays: number;
    rsaKeySize?: "2048" | "3072" | "4096";
}> = {
    webServer: {
        keyUsage: {
            digitalSignature: true,
            keyEncipherment: true,
            dataEncipherment: false,
            keyAgreement: false,
            keyCertSign: false,
            crlSign: false,
        },
        extKeyUsage: {
            serverAuth: true,
            clientAuth: false,
            codeSigning: false,
            emailProtection: false,
        },
        caSettings: { isCA: false, pathLengthConstraint: null },
        validityDays: 365,
        rsaKeySize: "2048",
    },
    rootCA: {
        keyUsage: {
            digitalSignature: true,
            keyEncipherment: false,
            dataEncipherment: false,
            keyAgreement: false,
            keyCertSign: true,
            crlSign: true,
        },
        extKeyUsage: {
            serverAuth: false,
            clientAuth: false,
            codeSigning: false,
            emailProtection: false,
        },
        caSettings: { isCA: true, pathLengthConstraint: null },
        validityDays: 3650,
        rsaKeySize: "4096",
    },
    clientCert: {
        keyUsage: {
            digitalSignature: true,
            keyEncipherment: true,
            dataEncipherment: false,
            keyAgreement: false,
            keyCertSign: false,
            crlSign: false,
        },
        extKeyUsage: {
            serverAuth: false,
            clientAuth: true,
            codeSigning: false,
            emailProtection: true,
        },
        caSettings: { isCA: false, pathLengthConstraint: null },
        validityDays: 365,
        rsaKeySize: "2048",
    },
    wildcard: {
        keyUsage: {
            digitalSignature: true,
            keyEncipherment: true,
            dataEncipherment: false,
            keyAgreement: false,
            keyCertSign: false,
            crlSign: false,
        },
        extKeyUsage: {
            serverAuth: true,
            clientAuth: false,
            codeSigning: false,
            emailProtection: false,
        },
        caSettings: { isCA: false, pathLengthConstraint: null },
        validityDays: 365,
    },
    custom: {
        keyUsage: {
            digitalSignature: false,
            keyEncipherment: false,
            dataEncipherment: false,
            keyAgreement: false,
            keyCertSign: false,
            crlSign: false,
        },
        extKeyUsage: {
            serverAuth: false,
            clientAuth: false,
            codeSigning: false,
            emailProtection: false,
        },
        caSettings: { isCA: false, pathLengthConstraint: null },
        validityDays: 365,
    },
};
