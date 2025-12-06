/**
 * Certificate Generator Types
 * All type definitions for the TLS certificate generation feature
 */

export interface SubjectInfo {
    commonName: string;
    organization: string;
    organizationalUnit: string;
    country: string;
    state: string;
    locality: string;
    email: string;
}

export interface KeySettings {
    algorithm: "RSA" | "ECDSA";
    rsaKeySize: "2048" | "3072" | "4096";
    ecdsaCurve: "P-256" | "P-384" | "P-521";
    signingAlgorithm: "SHA-256" | "SHA-384" | "SHA-512";
}

export interface ValiditySettings {
    days: number;
    customStartDate: string;
    customEndDate: string;
    useCustomDates: boolean;
}

export interface SANEntry {
    type: "dns" | "ip" | "email";
    value: string;
}

export interface KeyUsageSettings {
    digitalSignature: boolean;
    keyEncipherment: boolean;
    dataEncipherment: boolean;
    keyAgreement: boolean;
    keyCertSign: boolean;
    crlSign: boolean;
}

export interface ExtKeyUsageSettings {
    serverAuth: boolean;
    clientAuth: boolean;
    codeSigning: boolean;
    emailProtection: boolean;
}

export interface CASettings {
    isCA: boolean;
    pathLengthConstraint: number | null;
}

export interface RootCAInput {
    certificate: string;
    privateKey: string;
    passphrase: string;
}

export interface OutputSettings {
    certFormat: "pem" | "der";
    keyFormat: "pkcs1" | "pkcs8";
    keyPassphrase: string;
    includeChain: boolean;
}

export interface GeneratedCert {
    certificate: string;
    privateKey: string;
    publicKey: string;
    certificateDer?: ArrayBuffer;
    privateKeyDer?: ArrayBuffer;
}

export type CertPreset = "webServer" | "rootCA" | "clientCert" | "wildcard" | "custom";

export interface CertPresetConfig {
    label: string;
    description: string;
}

export interface CountryCode {
    code: string;
    name: string;
}

export interface CertGenerationInput {
    subject: SubjectInfo;
    keySettings: KeySettings;
    validity: ValiditySettings;
    sans: SANEntry[];
    keyUsage: KeyUsageSettings;
    extKeyUsage: ExtKeyUsageSettings;
    caSettings: CASettings;
    useExistingCA: boolean;
    rootCAInput: RootCAInput;
}

export interface ValidationResult {
    valid: boolean;
    error?: string;
}
