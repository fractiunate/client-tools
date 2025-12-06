/**
 * QR Code Generator Service
 * Core generation and download logic
 */

import QRCode from "qrcode";
import { saveAs } from "file-saver";
import type {
    QROptions,
    QRGenerationResult,
    QRDownloadFormat
} from "./types";
import { dataUrlToBlob, getSuggestedFilename } from "./utils";
import { validateContent, validateOptions } from "./validation";

/**
 * Build QRCode library options from our options type
 */
function buildQRCodeOptions(options: QROptions) {
    return {
        width: options.size,
        margin: options.margin,
        color: {
            dark: options.darkColor,
            light: options.lightColor,
        },
        errorCorrectionLevel: options.errorCorrectionLevel,
    };
}

/**
 * Generate QR code as data URL (PNG)
 * @param content - Content to encode
 * @param options - Generation options
 * @returns Promise resolving to generation result
 */
export async function generateQRDataUrl(
    content: string,
    options: QROptions
): Promise<QRGenerationResult> {
    // Validate content
    const contentValidation = validateContent(content, options.errorCorrectionLevel);
    if (!contentValidation.valid) {
        return {
            success: false,
            error: contentValidation.error,
        };
    }

    // Validate options
    const optionsValidation = validateOptions(options);
    if (!optionsValidation.valid) {
        return {
            success: false,
            error: optionsValidation.error,
        };
    }

    try {
        const dataUrl = await QRCode.toDataURL(content, buildQRCodeOptions(options));
        return {
            success: true,
            dataUrl,
        };
    } catch (error) {
        console.error("QR generation error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to generate QR code",
        };
    }
}

/**
 * Generate QR code as SVG string
 * @param content - Content to encode
 * @param options - Generation options
 * @returns Promise resolving to generation result
 */
export async function generateQRSvg(
    content: string,
    options: QROptions
): Promise<QRGenerationResult> {
    // Validate content
    const contentValidation = validateContent(content, options.errorCorrectionLevel);
    if (!contentValidation.valid) {
        return {
            success: false,
            error: contentValidation.error,
        };
    }

    // Validate options
    const optionsValidation = validateOptions(options);
    if (!optionsValidation.valid) {
        return {
            success: false,
            error: optionsValidation.error,
        };
    }

    try {
        const svg = await QRCode.toString(content, {
            type: "svg",
            ...buildQRCodeOptions(options),
        });
        return {
            success: true,
            svg,
        };
    } catch (error) {
        console.error("QR SVG generation error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to generate QR SVG",
        };
    }
}

/**
 * Generate QR code as Blob
 * @param content - Content to encode
 * @param options - Generation options
 * @param format - Output format (png or svg)
 * @returns Promise resolving to generation result with blob
 */
export async function generateQRBlob(
    content: string,
    options: QROptions,
    format: QRDownloadFormat = "png"
): Promise<QRGenerationResult> {
    if (format === "svg") {
        const result = await generateQRSvg(content, options);
        if (!result.success || !result.svg) {
            return result;
        }
        const blob = new Blob([result.svg], { type: "image/svg+xml" });
        return {
            success: true,
            svg: result.svg,
            blob,
        };
    }

    const result = await generateQRDataUrl(content, options);
    if (!result.success || !result.dataUrl) {
        return result;
    }

    try {
        const blob = await dataUrlToBlob(result.dataUrl);
        return {
            success: true,
            dataUrl: result.dataUrl,
            blob,
        };
    } catch (error) {
        return {
            success: false,
            error: "Failed to convert to blob",
        };
    }
}

/**
 * Download QR code as file
 * @param content - Content to encode
 * @param options - Generation options
 * @param format - Download format (png or svg)
 * @param filename - Optional custom filename (without extension)
 * @returns Promise resolving to success/failure result
 */
export async function downloadQR(
    content: string,
    options: QROptions,
    format: QRDownloadFormat = "png",
    filename?: string
): Promise<QRGenerationResult> {
    const result = await generateQRBlob(content, options, format);

    if (!result.success || !result.blob) {
        return result;
    }

    const downloadFilename = filename
        ? `${filename}.${format}`
        : getSuggestedFilename(format);

    saveAs(result.blob, downloadFilename);

    return {
        success: true,
        blob: result.blob,
    };
}

/**
 * Copy QR code to clipboard
 * @param dataUrl - QR code data URL
 * @returns Promise resolving to success boolean
 */
export async function copyQRToClipboard(dataUrl: string): Promise<boolean> {
    try {
        // Create a canvas to get the image data
        const img = new Image();
        img.src = dataUrl;

        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error("Failed to load image"));
        });

        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            throw new Error("Could not get canvas context");
        }

        ctx.drawImage(img, 0, 0);

        // Try the modern clipboard API
        return new Promise<boolean>((resolve) => {
            canvas.toBlob(async (blob) => {
                if (!blob) {
                    resolve(false);
                    return;
                }

                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({ "image/png": blob }),
                    ]);
                    resolve(true);
                } catch {
                    // Fallback: copy the data URL as text
                    try {
                        await navigator.clipboard.writeText(dataUrl);
                        resolve(true);
                    } catch {
                        resolve(false);
                    }
                }
            }, "image/png");
        });
    } catch (error) {
        console.error("Copy to clipboard error:", error);
        return false;
    }
}
