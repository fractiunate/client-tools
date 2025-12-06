import { describe, it, expect } from 'vitest';
import {
    isValidIP,
    isValidIPv4,
    isValidIPv6,
    isValidEmail,
    isValidDomain,
    isValidCommonName,
    validateSubject,
    validateSANs,
    validateValidity,
    validatePEMCertificate,
    validatePEMPrivateKey,
} from './validation';
import type { SubjectInfo, SANEntry, ValiditySettings } from './types';

// ============ IP Validation Tests ============

describe('isValidIPv4', () => {
    it('should return true for valid IPv4 addresses', () => {
        expect(isValidIPv4('192.168.1.1')).toBe(true);
        expect(isValidIPv4('10.0.0.1')).toBe(true);
        expect(isValidIPv4('172.16.0.1')).toBe(true);
        expect(isValidIPv4('255.255.255.255')).toBe(true);
        expect(isValidIPv4('0.0.0.0')).toBe(true);
        expect(isValidIPv4('127.0.0.1')).toBe(true);
    });

    it('should return false for invalid IPv4 addresses', () => {
        expect(isValidIPv4('256.0.0.1')).toBe(false);
        expect(isValidIPv4('192.168.1')).toBe(false);
        expect(isValidIPv4('192.168.1.1.1')).toBe(false);
        expect(isValidIPv4('192.168.1.')).toBe(false);
        expect(isValidIPv4('.192.168.1.1')).toBe(false);
        expect(isValidIPv4('192.168.1.1a')).toBe(false);
        expect(isValidIPv4('abc.def.ghi.jkl')).toBe(false);
        expect(isValidIPv4('')).toBe(false);
    });
});

describe('isValidIPv6', () => {
    it('should return true for valid IPv6 addresses', () => {
        expect(isValidIPv6('::1')).toBe(true);
        expect(isValidIPv6('::')).toBe(true);
        expect(isValidIPv6('2001:db8::1')).toBe(true);
        expect(isValidIPv6('fe80::1')).toBe(true);
        expect(isValidIPv6('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
        expect(isValidIPv6('2001:db8:85a3::8a2e:370:7334')).toBe(true);
    });

    it('should return false for invalid IPv6 addresses', () => {
        expect(isValidIPv6('192.168.1.1')).toBe(false);
        expect(isValidIPv6('2001:db8::g')).toBe(false);
        expect(isValidIPv6('12345::1')).toBe(false);
        expect(isValidIPv6('')).toBe(false);
    });
});

describe('isValidIP', () => {
    it('should accept both IPv4 and IPv6 addresses', () => {
        expect(isValidIP('192.168.1.1')).toBe(true);
        expect(isValidIP('::1')).toBe(true);
        expect(isValidIP('2001:db8::1')).toBe(true);
    });

    it('should reject invalid addresses', () => {
        expect(isValidIP('invalid')).toBe(false);
        expect(isValidIP('')).toBe(false);
    });
});

// ============ Email Validation Tests ============

describe('isValidEmail', () => {
    it('should return true for valid email addresses', () => {
        expect(isValidEmail('user@example.com')).toBe(true);
        expect(isValidEmail('user.name@example.com')).toBe(true);
        expect(isValidEmail('user+tag@example.com')).toBe(true);
        expect(isValidEmail('user@subdomain.example.com')).toBe(true);
        expect(isValidEmail('admin@localhost.local')).toBe(true);
    });

    it('should return false for invalid email addresses', () => {
        expect(isValidEmail('invalid')).toBe(false);
        expect(isValidEmail('user@')).toBe(false);
        expect(isValidEmail('@example.com')).toBe(false);
        expect(isValidEmail('user@.com')).toBe(false);
        expect(isValidEmail('')).toBe(false);
        expect(isValidEmail('user@example')).toBe(false);
    });
});

// ============ Domain Validation Tests ============

describe('isValidDomain', () => {
    it('should return true for valid domain names', () => {
        expect(isValidDomain('example.com')).toBe(true);
        expect(isValidDomain('sub.example.com')).toBe(true);
        expect(isValidDomain('deep.sub.example.com')).toBe(true);
        expect(isValidDomain('example-site.com')).toBe(true);
        expect(isValidDomain('example123.com')).toBe(true);
        expect(isValidDomain('localhost')).toBe(true);
    });

    it('should return true for wildcard domains', () => {
        expect(isValidDomain('*.example.com')).toBe(true);
        expect(isValidDomain('*.sub.example.com')).toBe(true);
    });

    it('should return false for invalid domain names', () => {
        expect(isValidDomain('-example.com')).toBe(false);
        expect(isValidDomain('example-.com')).toBe(false);
        expect(isValidDomain('.example.com')).toBe(false);
        expect(isValidDomain('example..com')).toBe(false);
        expect(isValidDomain('')).toBe(false);
        expect(isValidDomain('example_site.com')).toBe(false);
    });
});

// ============ Common Name Validation Tests ============

describe('isValidCommonName', () => {
    it('should return true for valid common names', () => {
        expect(isValidCommonName('example.com')).toBe(true);
        expect(isValidCommonName('*.example.com')).toBe(true);
        expect(isValidCommonName('My Company CA')).toBe(true);
        expect(isValidCommonName('server-01.local')).toBe(true);
    });

    it('should return false for invalid common names', () => {
        expect(isValidCommonName('')).toBe(false);
        expect(isValidCommonName('a'.repeat(65))).toBe(false); // Too long
    });
});

// ============ Subject Validation Tests ============

describe('validateSubject', () => {
    const validSubject: SubjectInfo = {
        commonName: 'example.com',
        organization: 'Test Org',
        organizationalUnit: 'IT',
        country: 'US',
        state: 'California',
        locality: 'San Francisco',
        email: 'admin@example.com',
    };

    it('should return valid for a complete valid subject', () => {
        const result = validateSubject(validSubject);
        expect(result.valid).toBe(true);
    });

    it('should return invalid when common name is missing', () => {
        const result = validateSubject({ ...validSubject, commonName: '' });
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Common Name');
    });

    it('should return invalid when common name is too long', () => {
        const result = validateSubject({ ...validSubject, commonName: 'a'.repeat(65) });
        expect(result.valid).toBe(false);
    });

    it('should return invalid for invalid country code', () => {
        const result = validateSubject({ ...validSubject, country: 'USA' });
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Country code');
    });

    it('should return invalid for invalid email', () => {
        const result = validateSubject({ ...validSubject, email: 'invalid-email' });
        expect(result.valid).toBe(false);
        expect(result.error).toContain('email');
    });

    it('should allow empty optional fields', () => {
        const minimalSubject: SubjectInfo = {
            commonName: 'example.com',
            organization: '',
            organizationalUnit: '',
            country: '',
            state: '',
            locality: '',
            email: '',
        };
        const result = validateSubject(minimalSubject);
        expect(result.valid).toBe(true);
    });
});

// ============ SANs Validation Tests ============

describe('validateSANs', () => {
    it('should return valid for empty SANs array', () => {
        const result = validateSANs([]);
        expect(result.valid).toBe(true);
    });

    it('should return valid for valid DNS SANs', () => {
        const sans: SANEntry[] = [
            { type: 'dns', value: 'example.com' },
            { type: 'dns', value: '*.example.com' },
        ];
        const result = validateSANs(sans);
        expect(result.valid).toBe(true);
    });

    it('should return valid for valid IP SANs', () => {
        const sans: SANEntry[] = [
            { type: 'ip', value: '192.168.1.1' },
            { type: 'ip', value: '::1' },
        ];
        const result = validateSANs(sans);
        expect(result.valid).toBe(true);
    });

    it('should return valid for valid email SANs', () => {
        const sans: SANEntry[] = [
            { type: 'email', value: 'user@example.com' },
        ];
        const result = validateSANs(sans);
        expect(result.valid).toBe(true);
    });

    it('should return invalid for invalid DNS SAN', () => {
        const sans: SANEntry[] = [
            { type: 'dns', value: '-invalid.com' },
        ];
        const result = validateSANs(sans);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('DNS');
    });

    it('should return invalid for invalid IP SAN', () => {
        const sans: SANEntry[] = [
            { type: 'ip', value: '999.999.999.999' },
        ];
        const result = validateSANs(sans);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('IP');
    });

    it('should return invalid for invalid email SAN', () => {
        const sans: SANEntry[] = [
            { type: 'email', value: 'invalid-email' },
        ];
        const result = validateSANs(sans);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('email');
    });

    it('should return invalid for empty SAN value', () => {
        const sans: SANEntry[] = [
            { type: 'dns', value: '' },
        ];
        const result = validateSANs(sans);
        expect(result.valid).toBe(false);
    });
});

// ============ Validity Validation Tests ============

describe('validateValidity', () => {
    it('should return valid for default settings', () => {
        const validity: ValiditySettings = {
            days: 365,
            useCustomDates: false,
            customStartDate: '',
            customEndDate: '',
        };
        const result = validateValidity(validity);
        expect(result.valid).toBe(true);
    });

    it('should return invalid for zero days', () => {
        const validity: ValiditySettings = {
            days: 0,
            useCustomDates: false,
            customStartDate: '',
            customEndDate: '',
        };
        const result = validateValidity(validity);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('at least 1 day');
    });

    it('should return invalid for negative days', () => {
        const validity: ValiditySettings = {
            days: -10,
            useCustomDates: false,
            customStartDate: '',
            customEndDate: '',
        };
        const result = validateValidity(validity);
        expect(result.valid).toBe(false);
    });

    it('should return invalid for too many days', () => {
        const validity: ValiditySettings = {
            days: 10000,
            useCustomDates: false,
            customStartDate: '',
            customEndDate: '',
        };
        const result = validateValidity(validity);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('7300');
    });

    it('should return valid for custom dates when start is before end', () => {
        const validity: ValiditySettings = {
            days: 365,
            useCustomDates: true,
            customStartDate: '2024-01-01',
            customEndDate: '2025-01-01',
        };
        const result = validateValidity(validity);
        expect(result.valid).toBe(true);
    });

    it('should return invalid when end date is before start date', () => {
        const validity: ValiditySettings = {
            days: 365,
            useCustomDates: true,
            customStartDate: '2025-01-01',
            customEndDate: '2024-01-01',
        };
        const result = validateValidity(validity);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('after');
    });

    it('should return invalid when custom dates are missing', () => {
        const validity: ValiditySettings = {
            days: 365,
            useCustomDates: true,
            customStartDate: '',
            customEndDate: '',
        };
        const result = validateValidity(validity);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Both');
    });
});

// ============ PEM Validation Tests ============

describe('validatePEMCertificate', () => {
    const validCert = `-----BEGIN CERTIFICATE-----
MIIBkTCB+wIUABCDEFGHIJKLMNOPQRSTUVWXYZabcde=
-----END CERTIFICATE-----`;

    it('should return valid for valid PEM certificate', () => {
        const result = validatePEMCertificate(validCert);
        expect(result.valid).toBe(true);
    });

    it('should return invalid for missing BEGIN marker', () => {
        const invalidCert = `MIIBkTCB+wIUABCDEFGHIJKLMNOPQRSTUVWXYZabcde=
-----END CERTIFICATE-----`;
        const result = validatePEMCertificate(invalidCert);
        expect(result.valid).toBe(false);
    });

    it('should return invalid for missing END marker', () => {
        const invalidCert = `-----BEGIN CERTIFICATE-----
MIIBkTCB+wIUABCDEFGHIJKLMNOPQRSTUVWXYZabcde=`;
        const result = validatePEMCertificate(invalidCert);
        expect(result.valid).toBe(false);
    });

    it('should return invalid for empty string', () => {
        const result = validatePEMCertificate('');
        expect(result.valid).toBe(false);
    });
});

describe('validatePEMPrivateKey', () => {
    const validPKCS8Key = `-----BEGIN PRIVATE KEY-----
MIIBVQIBADANBgkqhkiG9w0BAQEFAASCAT8wggE7AgEAAkEA
-----END PRIVATE KEY-----`;

    const validRSAKey = `-----BEGIN RSA PRIVATE KEY-----
MIIBOgIBAAJBAMJl5zVdA5YgATQJvGqQqR8v3I7Z8vqsw
-----END RSA PRIVATE KEY-----`;

    const validECKey = `-----BEGIN EC PRIVATE KEY-----
MHQCAQEEIGFz1O8t0dF+8vWkm2fC3Y7N
-----END EC PRIVATE KEY-----`;

    it('should return valid for PKCS8 private key', () => {
        const result = validatePEMPrivateKey(validPKCS8Key);
        expect(result.valid).toBe(true);
    });

    it('should return valid for RSA private key', () => {
        const result = validatePEMPrivateKey(validRSAKey);
        expect(result.valid).toBe(true);
    });

    it('should return valid for EC private key', () => {
        const result = validatePEMPrivateKey(validECKey);
        expect(result.valid).toBe(true);
    });

    it('should return invalid for public key', () => {
        const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA
-----END PUBLIC KEY-----`;
        const result = validatePEMPrivateKey(publicKey);
        expect(result.valid).toBe(false);
    });

    it('should return invalid for empty string', () => {
        const result = validatePEMPrivateKey('');
        expect(result.valid).toBe(false);
    });
});
