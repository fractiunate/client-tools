/**
 * Favicon Image Utilities
 * Low-level image manipulation functions
 */

import type { ConvertedFavicon } from "./types";
import { FORMAT_SIZES, getFilenameForFormat } from "./constants";

/**
 * Load an image file and return an HTMLImageElement
 * @param file - File to load
 * @returns Promise resolving to HTMLImageElement
 */
export function loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Failed to load image"));

        const reader = new FileReader();
        reader.onload = (e) => {
            img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
    });
}

/**
 * Resize an image to a specific size and return as PNG blob
 * Uses multi-step downsampling for sharper results when scaling down significantly
 * @param img - Source image element
 * @param size - Target size in pixels (square)
 * @returns Promise resolving to PNG Blob
 */
export async function resizeImageToPng(
    img: HTMLImageElement,
    size: number
): Promise<Blob> {
    // Use stepped downsampling for sharper small images
    const resizedCanvas = stepDownscale(img, size);

    return new Promise((resolve, reject) => {
        resizedCanvas.toBlob(
            (blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error("Failed to create PNG blob"));
                }
            },
            "image/png",
            1.0
        );
    });
}

/**
 * Multi-step downscaling for sharper results
 * Instead of scaling directly from large to small (which causes blur),
 * we scale down in steps, halving the size each time.
 * This produces much sharper results for favicon-sized outputs.
 * @param source - Source image or canvas
 * @param targetSize - Final target size
 * @returns Canvas with the resized image
 */
function stepDownscale(
    source: HTMLImageElement | HTMLCanvasElement,
    targetSize: number
): HTMLCanvasElement {
    const sourceWidth = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
    const sourceHeight = source instanceof HTMLImageElement ? source.naturalHeight : source.height;

    // Calculate the larger dimension for aspect-aware scaling
    const maxSourceDim = Math.max(sourceWidth, sourceHeight);

    // If upscaling or minimal downscaling, just do a single draw
    if (maxSourceDim <= targetSize * 2) {
        const canvas = document.createElement("canvas");
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext("2d")!;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(source, 0, 0, targetSize, targetSize);
        return canvas;
    }

    // Step down in halves for better quality
    // This mimics bicubic/lanczos-like quality using browser's built-in smoothing
    let currentSource: HTMLImageElement | HTMLCanvasElement = source;
    let currentWidth = sourceWidth;
    let currentHeight = sourceHeight;

    while (currentWidth > targetSize * 2 || currentHeight > targetSize * 2) {
        // Calculate next step size (half, but not smaller than target * 2)
        const nextWidth = Math.max(Math.floor(currentWidth / 2), targetSize);
        const nextHeight = Math.max(Math.floor(currentHeight / 2), targetSize);

        const stepCanvas = document.createElement("canvas");
        stepCanvas.width = nextWidth;
        stepCanvas.height = nextHeight;

        const stepCtx = stepCanvas.getContext("2d")!;
        stepCtx.imageSmoothingEnabled = true;
        stepCtx.imageSmoothingQuality = "high";
        stepCtx.drawImage(currentSource, 0, 0, nextWidth, nextHeight);

        currentSource = stepCanvas;
        currentWidth = nextWidth;
        currentHeight = nextHeight;
    }

    // Final resize to exact target size
    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = targetSize;
    finalCanvas.height = targetSize;

    const finalCtx = finalCanvas.getContext("2d")!;
    finalCtx.imageSmoothingEnabled = true;
    finalCtx.imageSmoothingQuality = "high";
    finalCtx.drawImage(currentSource, 0, 0, targetSize, targetSize);

    return finalCanvas;
}

/**
 * Create an ICO file from multiple PNG sizes
 * ICO format: https://en.wikipedia.org/wiki/ICO_(file_format)
 * @param img - Source image element
 * @param sizes - Array of sizes to include (default: [16, 32, 48])
 * @returns Promise resolving to ICO Blob
 */
export async function createIcoFile(
    img: HTMLImageElement,
    sizes: number[] = [16, 32, 48]
): Promise<Blob> {
    // Generate PNG blobs for each size
    const pngBlobs: { size: number; data: ArrayBuffer }[] = [];

    for (const size of sizes) {
        const pngBlob = await resizeImageToPng(img, size);
        const arrayBuffer = await pngBlob.arrayBuffer();
        pngBlobs.push({ size, data: arrayBuffer });
    }

    // Calculate total file size
    // ICO header: 6 bytes
    // ICO directory entry: 16 bytes per image
    // Image data: sum of all PNG sizes
    const headerSize = 6;
    const directorySize = 16 * pngBlobs.length;
    const imageDataSize = pngBlobs.reduce((sum, p) => sum + p.data.byteLength, 0);
    const totalSize = headerSize + directorySize + imageDataSize;

    // Create the ICO file buffer
    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);

    // ICO Header
    view.setUint16(0, 0, true); // Reserved, must be 0
    view.setUint16(2, 1, true); // Image type: 1 = ICO
    view.setUint16(4, pngBlobs.length, true); // Number of images

    // Calculate image data offsets
    let dataOffset = headerSize + directorySize;

    // Write directory entries and image data
    for (let i = 0; i < pngBlobs.length; i++) {
        const { size, data } = pngBlobs[i];
        const entryOffset = headerSize + i * 16;

        // Directory entry (16 bytes)
        view.setUint8(entryOffset + 0, size === 256 ? 0 : size); // Width (0 = 256)
        view.setUint8(entryOffset + 1, size === 256 ? 0 : size); // Height (0 = 256)
        view.setUint8(entryOffset + 2, 0); // Color palette (0 = no palette)
        view.setUint8(entryOffset + 3, 0); // Reserved
        view.setUint16(entryOffset + 4, 1, true); // Color planes
        view.setUint16(entryOffset + 6, 32, true); // Bits per pixel
        view.setUint32(entryOffset + 8, data.byteLength, true); // Image size
        view.setUint32(entryOffset + 12, dataOffset, true); // Image offset

        // Copy image data
        const uint8View = new Uint8Array(buffer);
        uint8View.set(new Uint8Array(data), dataOffset);

        dataOffset += data.byteLength;
    }

    return new Blob([buffer], { type: "image/x-icon" });
}

/**
 * Convert image to SVG (creates a simple embedded image SVG)
 * Note: This doesn't vectorize the image, it embeds it as base64
 * @param img - Source image element
 * @param size - Target size (default: 32)
 * @returns Promise resolving to SVG Blob
 */
export async function createSvgFromImage(
    img: HTMLImageElement,
    size: number = 32
): Promise<Blob> {
    // Use stepped downsampling for sharper embedded image
    const canvas = stepDownscale(img, size);
    const dataUrl = canvas.toDataURL("image/png");

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <image width="${size}" height="${size}" xlink:href="${dataUrl}"/>
</svg>`;

    return new Blob([svg], { type: "image/svg+xml" });
}

/**
 * Convert an image to a specific favicon format
 * @param img - Source image element
 * @param formatId - Format ID to convert to
 * @returns Promise resolving to ConvertedFavicon
 */
export async function convertToFormat(
    img: HTMLImageElement,
    formatId: string
): Promise<ConvertedFavicon> {
    const sizeConfig = FORMAT_SIZES[formatId];

    if (formatId === "ico") {
        const sizes = sizeConfig as number[];
        const blob = await createIcoFile(img, sizes);
        return {
            blob,
            filename: getFilenameForFormat(formatId),
            format: formatId,
        };
    }

    if (formatId === "svg") {
        const blob = await createSvgFromImage(img, 32);
        return {
            blob,
            filename: getFilenameForFormat(formatId),
            format: formatId,
        };
    }

    // PNG formats
    const size = sizeConfig as number;
    const blob = await resizeImageToPng(img, size);

    return {
        blob,
        filename: getFilenameForFormat(formatId, size),
        format: formatId,
        size,
    };
}

/**
 * Create a unique ID for a conversion result
 * @param format - Format ID
 * @returns Unique string ID
 */
export function createResultId(format: string): string {
    return `result-${format}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
