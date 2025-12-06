import { describe, it, expect } from 'vitest';
import {
    buildDistinguishedName,
    getAlgorithmParams,
    getSigningAlgorithm,
    arrayBufferToBase64,
    formatPEM,
    pemToArrayBuffer,
    generateSerialNumber,
    calculateValidityDates,
} from './utils';
import type { SubjectInfo, KeySettings, ValiditySettings } from './types';

// ============ Distinguished Name Tests ============

describe('buildDistinguishedName', () => {
    it('should build DN with all fields', () => {
        const subject: SubjectInfo = {
            commonName: 'example.com',
            organization: 'Test Org',
            organizationalUnit: 'IT',
            country: 'US',
            state: 'California',
            locality: 'San Francisco',
            email: 'admin@example.com',
        };

        const dn = buildDistinguishedName(subject);

        expect(dn).toContain('CN=example.com');
        expect(dn).toContain('O=Test Org');
        expect(dn).toContain('OU=IT');
        expect(dn).toContain('C=US');
        expect(dn).toContain('ST=California');
        expect(dn).toContain('L=San Francisco');
        expect(dn).toContain('E=admin@example.com');
    });

    it('should omit empty fields', () => {
        const subject: SubjectInfo = {
            commonName: 'example.com',
            organization: '',
            organizationalUnit: '',
            country: '',
            state: '',
            locality: '',
            email: '',
        };

        const dn = buildDistinguishedName(subject);

        expect(dn).toBe('CN=example.com');
        expect(dn).not.toContain('O=');
        expect(dn).not.toContain('OU=');
        expect(dn).not.toContain('C=');
    });

    it('should escape special characters', () => {
        const subject: SubjectInfo = {
            commonName: 'test, org',
            organization: 'Test + Company',
            organizationalUnit: '',
            country: '',
            state: '',
            locality: '',
            email: '',
        };

        const dn = buildDistinguishedName(subject);

        expect(dn).toContain('CN=test\\, org');
        expect(dn).toContain('O=Test \\+ Company');
    });
});

// ============ Algorithm Params Tests ============

describe('getAlgorithmParams', () => {
    it('should return RSA params for RSA algorithm', () => {
        const keySettings: KeySettings = {
            algorithm: 'RSA',
            rsaKeySize: '2048',
            ecdsaCurve: 'P-256',
            signingAlgorithm: 'SHA-256',
        };

        const params = getAlgorithmParams(keySettings) as RsaHashedKeyGenParams;

        expect(params.name).toBe('RSASSA-PKCS1-v1_5');
        expect(params.modulusLength).toBe(2048);
        expect(params.publicExponent).toBeInstanceOf(Uint8Array);
        expect(params.hash).toBe('SHA-256');
    });

    it('should return different key sizes for RSA', () => {
        const keySettings2048: KeySettings = {
            algorithm: 'RSA',
            rsaKeySize: '2048',
            ecdsaCurve: 'P-256',
            signingAlgorithm: 'SHA-256',
        };
        const keySettings4096: KeySettings = {
            algorithm: 'RSA',
            rsaKeySize: '4096',
            ecdsaCurve: 'P-256',
            signingAlgorithm: 'SHA-256',
        };

        expect((getAlgorithmParams(keySettings2048) as RsaHashedKeyGenParams).modulusLength).toBe(2048);
        expect((getAlgorithmParams(keySettings4096) as RsaHashedKeyGenParams).modulusLength).toBe(4096);
    });

    it('should return ECDSA params for ECDSA algorithm', () => {
        const keySettings: KeySettings = {
            algorithm: 'ECDSA',
            rsaKeySize: '2048',
            ecdsaCurve: 'P-384',
            signingAlgorithm: 'SHA-256',
        };

        const params = getAlgorithmParams(keySettings) as EcKeyGenParams;

        expect(params.name).toBe('ECDSA');
        expect(params.namedCurve).toBe('P-384');
    });

    it('should use different curves for ECDSA', () => {
        const p256: KeySettings = {
            algorithm: 'ECDSA',
            rsaKeySize: '2048',
            ecdsaCurve: 'P-256',
            signingAlgorithm: 'SHA-256',
        };
        const p521: KeySettings = {
            algorithm: 'ECDSA',
            rsaKeySize: '2048',
            ecdsaCurve: 'P-521',
            signingAlgorithm: 'SHA-256',
        };

        expect((getAlgorithmParams(p256) as EcKeyGenParams).namedCurve).toBe('P-256');
        expect((getAlgorithmParams(p521) as EcKeyGenParams).namedCurve).toBe('P-521');
    });
});

// ============ Signing Algorithm Tests ============

describe('getSigningAlgorithm', () => {
    it('should return RSA signing algorithms', () => {
        expect(getSigningAlgorithm('RSA', 'SHA-256')).toBe('SHA256withRSA');
        expect(getSigningAlgorithm('RSA', 'SHA-384')).toBe('SHA384withRSA');
        expect(getSigningAlgorithm('RSA', 'SHA-512')).toBe('SHA512withRSA');
    });

    it('should return ECDSA signing algorithms', () => {
        expect(getSigningAlgorithm('ECDSA', 'SHA-256')).toBe('SHA256withECDSA');
        expect(getSigningAlgorithm('ECDSA', 'SHA-384')).toBe('SHA384withECDSA');
        expect(getSigningAlgorithm('ECDSA', 'SHA-512')).toBe('SHA512withECDSA');
    });
});

// ============ Base64 Conversion Tests ============

describe('arrayBufferToBase64', () => {
    it('should convert ArrayBuffer to base64', () => {
        const bytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
        const result = arrayBufferToBase64(bytes.buffer);
        expect(result).toBe('SGVsbG8=');
    });

    it('should handle empty ArrayBuffer', () => {
        const empty = new ArrayBuffer(0);
        const result = arrayBufferToBase64(empty);
        expect(result).toBe('');
    });

    it('should handle binary data', () => {
        const bytes = new Uint8Array([0, 255, 128, 64]);
        const result = arrayBufferToBase64(bytes.buffer);
        expect(result).toBe('AP+AQA==');
    });
});

// ============ PEM Formatting Tests ============

describe('formatPEM', () => {
    it('should format base64 as PEM with label', () => {
        const base64 = 'SGVsbG9Xb3JsZA==';
        const result = formatPEM(base64, 'CERTIFICATE');

        expect(result).toContain('-----BEGIN CERTIFICATE-----');
        expect(result).toContain('-----END CERTIFICATE-----');
        expect(result).toContain('SGVsbG9Xb3JsZA==');
    });

    it('should wrap long lines at 64 characters', () => {
        const longBase64 = 'A'.repeat(128);
        const result = formatPEM(longBase64, 'TEST');

        const lines = result.split('\n');
        // First line is BEGIN, last line is END
        const contentLines = lines.filter(line => !line.startsWith('-----'));

        contentLines.forEach(line => {
            expect(line.length).toBeLessThanOrEqual(64);
        });
    });

    it('should work with different labels', () => {
        const base64 = 'dGVzdA==';

        expect(formatPEM(base64, 'PRIVATE KEY')).toContain('-----BEGIN PRIVATE KEY-----');
        expect(formatPEM(base64, 'PUBLIC KEY')).toContain('-----BEGIN PUBLIC KEY-----');
        expect(formatPEM(base64, 'RSA PRIVATE KEY')).toContain('-----BEGIN RSA PRIVATE KEY-----');
    });
});

// ============ PEM to ArrayBuffer Tests ============

describe('pemToArrayBuffer', () => {
    it('should convert PEM back to ArrayBuffer', () => {
        const original = new Uint8Array([72, 101, 108, 108, 111]);
        const pem = formatPEM(arrayBufferToBase64(original.buffer), 'TEST');

        const result = pemToArrayBuffer(pem);
        const resultArray = new Uint8Array(result);

        expect(resultArray).toEqual(original);
    });

    it('should handle PEM with extra whitespace', () => {
        const pem = `
-----BEGIN TEST-----
  SGVsbG8=  
-----END TEST-----
        `;

        const result = new Uint8Array(pemToArrayBuffer(pem));
        expect(result).toEqual(new Uint8Array([72, 101, 108, 108, 111]));
    });

    it('should handle multi-line PEM content', () => {
        const longData = new Uint8Array(100);
        for (let i = 0; i < 100; i++) {
            longData[i] = i;
        }

        const pem = formatPEM(arrayBufferToBase64(longData.buffer), 'DATA');
        const result = new Uint8Array(pemToArrayBuffer(pem));

        expect(result).toEqual(longData);
    });
});

// ============ Serial Number Tests ============

describe('generateSerialNumber', () => {
    it('should generate a hex string', () => {
        const serial = generateSerialNumber();
        expect(serial).toMatch(/^[0-9a-f]+$/);
    });

    it('should generate 16 bytes (32 hex chars)', () => {
        const serial = generateSerialNumber();
        expect(serial.length).toBe(32);
    });

    it('should generate unique values', () => {
        const serials = new Set<string>();
        for (let i = 0; i < 100; i++) {
            serials.add(generateSerialNumber());
        }
        expect(serials.size).toBe(100);
    });
});

// ============ Validity Dates Tests ============

describe('calculateValidityDates', () => {
    it('should calculate dates from days', () => {
        const validity: ValiditySettings = {
            days: 365,
            useCustomDates: false,
            customStartDate: '',
            customEndDate: '',
        };

        const { notBefore, notAfter } = calculateValidityDates(validity);

        expect(notBefore).toBeInstanceOf(Date);
        expect(notAfter).toBeInstanceOf(Date);

        // Check that the difference is approximately 365 days
        const diffMs = notAfter.getTime() - notBefore.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        expect(Math.round(diffDays)).toBe(365);
    });

    it('should use custom dates when specified', () => {
        const validity: ValiditySettings = {
            days: 365,
            useCustomDates: true,
            customStartDate: '2024-01-01',
            customEndDate: '2025-06-15',
        };

        const { notBefore, notAfter } = calculateValidityDates(validity);

        expect(notBefore.getFullYear()).toBe(2024);
        expect(notBefore.getMonth()).toBe(0); // January
        expect(notBefore.getDate()).toBe(1);

        expect(notAfter.getFullYear()).toBe(2025);
        expect(notAfter.getMonth()).toBe(5); // June
        expect(notAfter.getDate()).toBe(15);
    });

    it('should start from now for non-custom dates', () => {
        const validity: ValiditySettings = {
            days: 30,
            useCustomDates: false,
            customStartDate: '',
            customEndDate: '',
        };

        const before = new Date();
        const { notBefore } = calculateValidityDates(validity);
        const after = new Date();

        expect(notBefore.getTime()).toBeGreaterThanOrEqual(before.getTime());
        expect(notBefore.getTime()).toBeLessThanOrEqual(after.getTime());
    });
});
