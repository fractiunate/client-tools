/**
 * QR Generator Module
 * Re-exports all public APIs for easy importing
 */

// Types
export type {
    QRInputType,
    WifiEncryptionType,
    ErrorCorrectionLevel,
    QRDownloadFormat,
    QROptions,
    SizeOption,
    ErrorLevelOption,
    WifiConfig,
    QRGenerationResult,
    QRValidationResult,
} from "./types";

// Constants
export {
    DEFAULT_OPTIONS,
    SIZE_OPTIONS,
    ERROR_LEVELS,
    MIN_QR_SIZE,
    MAX_QR_SIZE,
    GENERATION_DEBOUNCE_MS,
    MAX_CONTENT_LENGTH,
    WIFI_ENCRYPTION_LABELS,
    HEX_COLOR_PATTERN,
} from "./constants";

// Validation
export {
    validateContent,
    validateUrl,
    validateWifiConfig,
    validateHexColor,
    validateSize,
    validateMargin,
    validateOptions,
    checkColorContrast,
} from "./validation";

// Utils
export {
    buildWifiString,
    getQRContent,
    parseWifiString,
    dataUrlToBlob,
    normalizeHexColor,
    estimateQRVersion,
    getSuggestedFilename,
} from "./utils";

// Generator (main service)
export {
    generateQRDataUrl,
    generateQRSvg,
    generateQRBlob,
    downloadQR,
    copyQRToClipboard,
} from "./generator";
