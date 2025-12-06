import { describe, it, expect, vi } from 'vitest';
import {
    generateCertificate,
    parseCertificate,
} from './generator';
import type { CertGenerationInput, SubjectInfo } from './types';
import {
    DEFAULT_SUBJECT,
    DEFAULT_KEY_SETTINGS,
    DEFAULT_VALIDITY,
    DEFAULT_KEY_USAGE,
    DEFAULT_EXT_KEY_USAGE,
    DEFAULT_CA_SETTINGS,
} from './constants';

// Helper to create valid input
const createValidInput = (overrides?: Partial<CertGenerationInput>): CertGenerationInput => ({
    subject: { ...DEFAULT_SUBJECT, commonName: 'test.example.com' },
    keySettings: DEFAULT_KEY_SETTINGS,
    validity: DEFAULT_VALIDITY,
    sans: [],
    keyUsage: DEFAULT_KEY_USAGE,
    extKeyUsage: DEFAULT_EXT_KEY_USAGE,
    caSettings: DEFAULT_CA_SETTINGS,
    useExistingCA: false,
    rootCAInput: { certificate: '', privateKey: '', passphrase: '' },
    ...overrides,
});

// ============ Certificate Generation Tests ============

describe('generateCertificate', () => {
    it('should generate a self-signed certificate', async () => {
        const input = createValidInput();
        const result = await generateCertificate(input);

        expect(result.success).toBe(true);
        expect(result.certificate).toBeDefined();
        expect(result.certificate?.certificate).toContain('-----BEGIN CERTIFICATE-----');
        expect(result.certificate?.privateKey).toContain('-----BEGIN PRIVATE KEY-----');
        expect(result.certificate?.publicKey).toContain('-----BEGIN PUBLIC KEY-----');
    }, 10000);

    it('should generate certificate with RSA 2048', async () => {
        const input = createValidInput({
            keySettings: {
                algorithm: 'RSA',
                rsaKeySize: '2048',
                ecdsaCurve: 'P-256',
                signingAlgorithm: 'SHA-256',
            },
        });

        const result = await generateCertificate(input);

        expect(result.success).toBe(true);
        expect(result.certificate?.certificate).toContain('-----BEGIN CERTIFICATE-----');
    }, 10000);

    it('should generate certificate with RSA 4096', async () => {
        const input = createValidInput({
            keySettings: {
                algorithm: 'RSA',
                rsaKeySize: '4096',
                ecdsaCurve: 'P-256',
                signingAlgorithm: 'SHA-256',
            },
        });

        const result = await generateCertificate(input);

        expect(result.success).toBe(true);
        expect(result.certificate?.certificate).toContain('-----BEGIN CERTIFICATE-----');
    }, 15000);

    it('should generate certificate with ECDSA P-256', async () => {
        const input = createValidInput({
            keySettings: {
                algorithm: 'ECDSA',
                rsaKeySize: '2048',
                ecdsaCurve: 'P-256',
                signingAlgorithm: 'SHA-256',
            },
        });

        const result = await generateCertificate(input);

        expect(result.success).toBe(true);
        expect(result.certificate?.certificate).toContain('-----BEGIN CERTIFICATE-----');
    }, 10000);

    it('should generate certificate with ECDSA P-384', async () => {
        const input = createValidInput({
            keySettings: {
                algorithm: 'ECDSA',
                rsaKeySize: '2048',
                ecdsaCurve: 'P-384',
                signingAlgorithm: 'SHA-384',
            },
        });

        const result = await generateCertificate(input);

        expect(result.success).toBe(true);
        expect(result.certificate?.certificate).toContain('-----BEGIN CERTIFICATE-----');
    }, 10000);

    it('should generate certificate with SANs', async () => {
        const input = createValidInput({
            sans: [
                { type: 'dns', value: 'www.example.com' },
                { type: 'dns', value: 'api.example.com' },
                { type: 'ip', value: '192.168.1.1' },
            ],
        });

        const result = await generateCertificate(input);

        expect(result.success).toBe(true);
        expect(result.certificate).toBeDefined();
    }, 10000);

    it('should generate CA certificate', async () => {
        const input = createValidInput({
            subject: { ...DEFAULT_SUBJECT, commonName: 'My Root CA' },
            caSettings: {
                isCA: true,
                pathLengthConstraint: 1,
            },
            keyUsage: {
                digitalSignature: true,
                keyEncipherment: false,
                dataEncipherment: false,
                keyAgreement: false,
                keyCertSign: true,
                crlSign: true,
            },
        });

        const result = await generateCertificate(input);

        expect(result.success).toBe(true);
        expect(result.certificate).toBeDefined();
    }, 10000);

    it('should fail with invalid subject', async () => {
        const input = createValidInput({
            subject: {
                ...DEFAULT_SUBJECT,
                commonName: '', // Invalid: empty common name
            },
        });

        const result = await generateCertificate(input);

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error).toContain('Common Name');
    });

    it('should fail with invalid country code', async () => {
        const input = createValidInput({
            subject: {
                ...DEFAULT_SUBJECT,
                commonName: 'example.com',
                country: 'USA', // Invalid: should be 2 letters
            },
        });

        const result = await generateCertificate(input);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Country');
    });

    it('should fail with invalid email in SANs', async () => {
        const input = createValidInput({
            sans: [
                { type: 'email', value: 'invalid-email' },
            ],
        });

        const result = await generateCertificate(input);

        expect(result.success).toBe(false);
        expect(result.error).toContain('email');
    });

    it('should fail with invalid IP in SANs', async () => {
        const input = createValidInput({
            sans: [
                { type: 'ip', value: '999.999.999.999' },
            ],
        });

        const result = await generateCertificate(input);

        expect(result.success).toBe(false);
        expect(result.error).toContain('IP');
    });

    it('should fail with invalid validity period', async () => {
        const input = createValidInput({
            validity: {
                days: 0,
                useCustomDates: false,
                customStartDate: '',
                customEndDate: '',
            },
        });

        const result = await generateCertificate(input);

        expect(result.success).toBe(false);
        expect(result.error).toContain('1 day');
    });

    it('should use custom validity dates', async () => {
        const input = createValidInput({
            validity: {
                days: 365,
                useCustomDates: true,
                customStartDate: '2024-01-01',
                customEndDate: '2025-01-01',
            },
        });

        const result = await generateCertificate(input);

        expect(result.success).toBe(true);
        expect(result.certificate).toBeDefined();
    }, 10000);

    it('should include DER format when requested', async () => {
        const input = createValidInput();

        const result = await generateCertificate(input);

        expect(result.success).toBe(true);
        expect(result.certificate?.certificateDer).toBeInstanceOf(ArrayBuffer);
    }, 10000);
});

// ============ Certificate Parsing Tests ============

describe('parseCertificate', () => {
    it('should parse a generated certificate', async () => {
        // First generate a certificate
        const input = createValidInput({
            subject: {
                ...DEFAULT_SUBJECT,
                commonName: 'parse-test.example.com',
                organization: 'Test Organization',
            },
        });

        const genResult = await generateCertificate(input);
        expect(genResult.success).toBe(true);

        // Now parse it
        const parseResult = await parseCertificate(genResult.certificate!.certificate);

        expect(parseResult.success).toBe(true);
        expect(parseResult.certificate).toBeDefined();
        expect(parseResult.certificate?.subject).toContain('parse-test.example.com');
    }, 15000);

    it('should return error for invalid PEM', async () => {
        const result = await parseCertificate('not a valid certificate');

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
    });

    it('should return error for empty string', async () => {
        const result = await parseCertificate('');

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
    });
});

// ============ Key Usage Tests ============

describe('generateCertificate with key usage', () => {
    it('should generate certificate with server auth key usage', async () => {
        const input = createValidInput({
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
        });

        const result = await generateCertificate(input);

        expect(result.success).toBe(true);
        expect(result.certificate).toBeDefined();
    }, 10000);

    it('should generate certificate with client auth key usage', async () => {
        const input = createValidInput({
            keyUsage: {
                digitalSignature: true,
                keyEncipherment: false,
                dataEncipherment: false,
                keyAgreement: false,
                keyCertSign: false,
                crlSign: false,
            },
            extKeyUsage: {
                serverAuth: false,
                clientAuth: true,
                codeSigning: false,
                emailProtection: false,
            },
        });

        const result = await generateCertificate(input);

        expect(result.success).toBe(true);
        expect(result.certificate).toBeDefined();
    }, 10000);

    it('should generate certificate with code signing key usage', async () => {
        const input = createValidInput({
            keyUsage: {
                digitalSignature: true,
                keyEncipherment: false,
                dataEncipherment: false,
                keyAgreement: false,
                keyCertSign: false,
                crlSign: false,
            },
            extKeyUsage: {
                serverAuth: false,
                clientAuth: false,
                codeSigning: true,
                emailProtection: false,
            },
        });

        const result = await generateCertificate(input);

        expect(result.success).toBe(true);
        expect(result.certificate).toBeDefined();
    }, 10000);
});

// ============ Edge Cases ============

describe('generateCertificate edge cases', () => {
    it('should handle wildcard domain', async () => {
        const input = createValidInput({
            subject: {
                ...DEFAULT_SUBJECT,
                commonName: '*.example.com',
            },
            sans: [
                { type: 'dns', value: '*.example.com' },
                { type: 'dns', value: 'example.com' },
            ],
        });

        const result = await generateCertificate(input);

        expect(result.success).toBe(true);
        expect(result.certificate).toBeDefined();
    }, 10000);

    it('should handle IPv6 SAN', async () => {
        const input = createValidInput({
            sans: [
                { type: 'ip', value: '::1' },
                { type: 'ip', value: '2001:db8::1' },
            ],
        });

        const result = await generateCertificate(input);

        expect(result.success).toBe(true);
        expect(result.certificate).toBeDefined();
    }, 10000);

    it('should handle email SAN', async () => {
        const input = createValidInput({
            sans: [
                { type: 'email', value: 'admin@example.com' },
            ],
        });

        const result = await generateCertificate(input);

        expect(result.success).toBe(true);
        expect(result.certificate).toBeDefined();
    }, 10000);

    it('should handle long validity period', async () => {
        const input = createValidInput({
            validity: {
                days: 3650, // 10 years
                useCustomDates: false,
                customStartDate: '',
                customEndDate: '',
            },
        });

        const result = await generateCertificate(input);

        expect(result.success).toBe(true);
        expect(result.certificate).toBeDefined();
    }, 10000);

    it('should handle minimum validity period', async () => {
        const input = createValidInput({
            validity: {
                days: 1,
                useCustomDates: false,
                customStartDate: '',
                customEndDate: '',
            },
        });

        const result = await generateCertificate(input);

        expect(result.success).toBe(true);
        expect(result.certificate).toBeDefined();
    }, 10000);

    it('should handle subject with special characters', async () => {
        const input = createValidInput({
            subject: {
                commonName: 'test-site.example.com',
                organization: 'Test & Company, Inc.',
                organizationalUnit: 'R&D + Engineering',
                country: 'US',
                state: 'New York',
                locality: "O'Fallon",
                email: 'admin+test@example.com',
            },
        });

        const result = await generateCertificate(input);

        expect(result.success).toBe(true);
        expect(result.certificate).toBeDefined();
    }, 10000);
});
