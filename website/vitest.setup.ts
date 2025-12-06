import '@testing-library/jest-dom';

// Mock crypto for Node.js environment
import { webcrypto } from 'crypto';
if (!globalThis.crypto) {
    globalThis.crypto = webcrypto as Crypto;
}
