/**
 * Certificate Generation Service
 * Core business logic for generating X.509 certificates
 */

import * as x509 from "@peculiar/x509";
import type {
    SubjectInfo,
    KeySettings,
    ValiditySettings,
    SANEntry,
    KeyUsageSettings,
    ExtKeyUsageSettings,
    CASettings,
    RootCAInput,
    GeneratedCert,
    CertGenerationInput,
    ValidationResult,
} from "./types";
import {
    buildDistinguishedName,
    getAlgorithmParams,
    getSigningAlgorithm,
    getSigningAlgorithmParams,
    arrayBufferToBase64,
    formatPEM,
    pemToArrayBuffer,
    generateSerialNumber,
    calculateValidityDates,
} from "./utils";
import { validateCertGenerationInput } from "./validation";

export interface CertGenerationResult {
    success: boolean;
    certificate?: GeneratedCert;
    error?: string;
}

/**
 * Build X.509 extensions based on settings
 */
function buildExtensions(
    keyUsage: KeyUsageSettings,
    extKeyUsage: ExtKeyUsageSettings,
    caSettings: CASettings,
    sans: SANEntry[]
): x509.Extension[] {
    const extensions: x509.Extension[] = [];

    // Basic Constraints
    extensions.push(
        new x509.BasicConstraintsExtension(
            caSettings.isCA,
            caSettings.pathLengthConstraint ?? undefined,
            true
        )
    );

    // Key Usage
    let keyUsageFlags = 0;
    if (keyUsage.digitalSignature) keyUsageFlags |= x509.KeyUsageFlags.digitalSignature;
    if (keyUsage.keyEncipherment) keyUsageFlags |= x509.KeyUsageFlags.keyEncipherment;
    if (keyUsage.dataEncipherment) keyUsageFlags |= x509.KeyUsageFlags.dataEncipherment;
    if (keyUsage.keyAgreement) keyUsageFlags |= x509.KeyUsageFlags.keyAgreement;
    if (keyUsage.keyCertSign) keyUsageFlags |= x509.KeyUsageFlags.keyCertSign;
    if (keyUsage.crlSign) keyUsageFlags |= x509.KeyUsageFlags.cRLSign;

    if (keyUsageFlags > 0) {
        extensions.push(new x509.KeyUsagesExtension(keyUsageFlags, true));
    }

    // Extended Key Usage
    const ekuOids: string[] = [];
    if (extKeyUsage.serverAuth) ekuOids.push(x509.ExtendedKeyUsage.serverAuth);
    if (extKeyUsage.clientAuth) ekuOids.push(x509.ExtendedKeyUsage.clientAuth);
    if (extKeyUsage.codeSigning) ekuOids.push(x509.ExtendedKeyUsage.codeSigning);
    if (extKeyUsage.emailProtection) ekuOids.push(x509.ExtendedKeyUsage.emailProtection);

    if (ekuOids.length > 0) {
        extensions.push(new x509.ExtendedKeyUsageExtension(ekuOids, false));
    }

    // Subject Alternative Names
    const validSans = sans.filter(s => s.value && s.value.trim());
    if (validSans.length > 0) {
        const sanExtension = new x509.SubjectAlternativeNameExtension(
            validSans.map(san => ({
                type: san.type,
                value: san.value,
            })),
            false
        );
        extensions.push(sanExtension);
    }

    return extensions;
}

/**
 * Generate a key pair using Web Crypto API
 */
async function generateKeyPair(
    keySettings: KeySettings
): Promise<CryptoKeyPair> {
    const algorithmParams = getAlgorithmParams(keySettings);
    return await crypto.subtle.generateKey(
        algorithmParams,
        true,
        ["sign", "verify"]
    );
}

/**
 * Export keys to PEM format
 */
async function exportKeys(keyPair: CryptoKeyPair): Promise<{
    privateKeyPem: string;
    publicKeyPem: string;
    privateKeyBuffer: ArrayBuffer;
}> {
    // Export private key
    const privateKeyBuffer = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
    const privateKeyBase64 = arrayBufferToBase64(privateKeyBuffer);
    const privateKeyPem = formatPEM(privateKeyBase64, "PRIVATE KEY");

    // Export public key
    const publicKeyBuffer = await crypto.subtle.exportKey("spki", keyPair.publicKey);
    const publicKeyBase64 = arrayBufferToBase64(publicKeyBuffer);
    const publicKeyPem = formatPEM(publicKeyBase64, "PUBLIC KEY");

    return { privateKeyPem, publicKeyPem, privateKeyBuffer };
}

/**
 * Parse and import CA certificate and private key
 */
async function parseCACredentials(
    rootCAInput: RootCAInput,
    keySettings: KeySettings
): Promise<{ signingKey: CryptoKey; issuerDn: string }> {
    // Parse the CA private key
    const caKeyPem = rootCAInput.privateKey.trim();
    const caKey = await crypto.subtle.importKey(
        "pkcs8",
        pemToArrayBuffer(caKeyPem),
        getAlgorithmParams(keySettings),
        true,
        ["sign"]
    );

    // Parse CA certificate to get issuer DN
    const caCert = new x509.X509Certificate(rootCAInput.certificate);

    return {
        signingKey: caKey,
        issuerDn: caCert.subject,
    };
}

/**
 * Generate a self-signed or CA-signed X.509 certificate
 * @param input - Certificate generation input parameters
 * @returns Result with generated certificate or error
 */
export async function generateCertificate(
    input: CertGenerationInput
): Promise<CertGenerationResult> {
    // Validate all inputs
    const validation = validateCertGenerationInput(input);
    if (!validation.valid) {
        return { success: false, error: validation.error };
    }

    try {
        // Set crypto provider
        x509.cryptoProvider.set(crypto);

        // Generate key pair
        const keyPair = await generateKeyPair(input.keySettings);

        // Build extensions
        const extensions = buildExtensions(
            input.keyUsage,
            input.extKeyUsage,
            input.caSettings,
            input.sans
        );

        // Calculate validity dates
        const { notBefore, notAfter } = calculateValidityDates(input.validity);

        // Build distinguished name
        const dn = buildDistinguishedName(input.subject);

        // Determine signing key and issuer
        let signingKey: CryptoKey = keyPair.privateKey;
        let issuerDn = dn; // Self-signed by default

        // If using existing CA, parse and use it
        if (input.useExistingCA && input.rootCAInput.certificate && input.rootCAInput.privateKey) {
            const caCredentials = await parseCACredentials(input.rootCAInput, input.keySettings);
            signingKey = caCredentials.signingKey;
            issuerDn = caCredentials.issuerDn;
        }

        // Create certificate
        const cert = await x509.X509CertificateGenerator.create({
            serialNumber: generateSerialNumber(),
            subject: dn,
            issuer: issuerDn,
            notBefore,
            notAfter,
            signingAlgorithm: getSigningAlgorithmParams(input.keySettings),
            publicKey: keyPair.publicKey,
            signingKey,
            extensions,
        });

        // Export certificate and keys
        const certPem = cert.toString("pem");
        const certDer = cert.rawData;
        const { privateKeyPem, publicKeyPem, privateKeyBuffer } = await exportKeys(keyPair);

        return {
            success: true,
            certificate: {
                certificate: certPem,
                privateKey: privateKeyPem,
                publicKey: publicKeyPem,
                certificateDer: certDer,
                privateKeyDer: privateKeyBuffer,
            },
        };
    } catch (error) {
        console.error("Certificate generation error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}

/**
 * Parse and decode a PEM certificate to get its details
 * @param pem - PEM encoded certificate
 * @returns Parsed certificate info with success flag
 */
export function parseCertificate(pem: string): {
    success: boolean;
    certificate?: {
        subject: string;
        issuer: string;
        notBefore: Date;
        notAfter: Date;
        serialNumber: string;
    };
    error?: string;
} {
    if (!pem || !pem.trim()) {
        return { success: false, error: "Certificate PEM is required" };
    }

    try {
        const cert = new x509.X509Certificate(pem);
        return {
            success: true,
            certificate: {
                subject: cert.subject,
                issuer: cert.issuer,
                notBefore: cert.notBefore,
                notAfter: cert.notAfter,
                serialNumber: cert.serialNumber,
            },
        };
    } catch (err) {
        return {
            success: false,
            error: `Failed to parse certificate: ${err instanceof Error ? err.message : "Unknown error"}`
        };
    }
}
