/**
 * Favicon Converter Module
 * Re-exports all public APIs for easy importing
 */

// Types
export type {
    FaviconFormat,
    ConvertedFavicon,
    ConversionResult,
    ConversionResponse,
    ValidationResult,
    ProgressCallback,
} from "./types";

// Constants
export {
    FAVICON_FORMATS,
    FORMAT_SIZES,
    ALLOWED_MIME_TYPES,
    MAX_FILE_SIZE,
    DEFAULT_SELECTED_FORMATS,
    getFilenameForFormat,
} from "./constants";

// Validation
export {
    validateImageFile,
    validateFormats,
} from "./validation";

// Utils
export {
    loadImage,
    resizeImageToPng,
    createIcoFile,
    createSvgFromImage,
    convertToFormat,
    createResultId,
} from "./utils";

// Converter (main service)
export {
    convertFavicon,
    convertImageToFavicons,
    downloadFavicon,
    downloadAllAsZip,
    cleanupResults,
} from "./converter";
