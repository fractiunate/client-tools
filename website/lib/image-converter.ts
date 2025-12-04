/**
 * Client-side image conversion utilities for favicon generation
 */

export interface ConvertedImage {
    blob: Blob;
    filename: string;
    format: string;
    size?: number;
}

/**
 * Load an image file and return an HTMLImageElement
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
 */
export async function resizeImageToPng(
    img: HTMLImageElement,
    size: number
): Promise<Blob> {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
        throw new Error("Failed to get canvas context");
    }

    // Use high-quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Draw the image scaled to fit the canvas
    ctx.drawImage(img, 0, 0, size, size);

    return new Promise((resolve, reject) => {
        canvas.toBlob(
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
 * Create an ICO file from multiple PNG sizes
 * ICO format: https://en.wikipedia.org/wiki/ICO_(file_format)
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
 */
export async function createSvgFromImage(
    img: HTMLImageElement,
    size: number = 32
): Promise<Blob> {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
        throw new Error("Failed to get canvas context");
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, size, size);

    const dataUrl = canvas.toDataURL("image/png");

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <image width="${size}" height="${size}" xlink:href="${dataUrl}"/>
</svg>`;

    return new Blob([svg], { type: "image/svg+xml" });
}

/**
 * Format ID to size mapping
 */
const FORMAT_SIZES: Record<string, number | number[] | null> = {
    ico: [16, 32, 48],
    "png-16": 16,
    "png-32": 32,
    "png-48": 48,
    "png-180": 180,
    "png-192": 192,
    "png-512": 512,
    svg: 32,
};

/**
 * Convert an image to a specific favicon format
 */
export async function convertToFormat(
    img: HTMLImageElement,
    formatId: string
): Promise<ConvertedImage> {
    const sizeConfig = FORMAT_SIZES[formatId];

    if (formatId === "ico") {
        const sizes = sizeConfig as number[];
        const blob = await createIcoFile(img, sizes);
        return {
            blob,
            filename: "favicon.ico",
            format: formatId,
        };
    }

    if (formatId === "svg") {
        const blob = await createSvgFromImage(img, 32);
        return {
            blob,
            filename: "favicon.svg",
            format: formatId,
        };
    }

    // PNG formats
    const size = sizeConfig as number;
    const blob = await resizeImageToPng(img, size);

    let filename: string;
    if (formatId === "png-180") {
        filename = "apple-touch-icon.png";
    } else if (formatId === "png-192") {
        filename = "android-chrome-192x192.png";
    } else if (formatId === "png-512") {
        filename = "android-chrome-512x512.png";
    } else {
        filename = `favicon-${size}x${size}.png`;
    }

    return {
        blob,
        filename,
        format: formatId,
        size,
    };
}

/**
 * Convert an image file to multiple favicon formats
 */
export async function convertImageToFavicons(
    file: File,
    formats: string[],
    onProgress?: (progress: number) => void
): Promise<ConvertedImage[]> {
    const img = await loadImage(file);
    const results: ConvertedImage[] = [];

    for (let i = 0; i < formats.length; i++) {
        const formatId = formats[i];
        const converted = await convertToFormat(img, formatId);
        results.push(converted);

        if (onProgress) {
            onProgress(Math.round(((i + 1) / formats.length) * 100));
        }
    }

    return results;
}
