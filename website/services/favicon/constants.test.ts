/**
 * Favicon Constants and Utils Unit Tests
 * Tests pure functions and constants that don't require DOM
 */

import { describe, it, expect } from "vitest";
import {
    FAVICON_FORMATS,
    FORMAT_SIZES,
    ALLOWED_MIME_TYPES,
    MAX_FILE_SIZE,
    DEFAULT_SELECTED_FORMATS,
    getFilenameForFormat,
} from "./constants";
import { createResultId } from "./utils";

// ============ Constants Tests ============

describe("FAVICON_FORMATS", () => {
    it("should export an array of formats", () => {
        expect(Array.isArray(FAVICON_FORMATS)).toBe(true);
        expect(FAVICON_FORMATS.length).toBeGreaterThan(0);
    });

    it("should include ICO format", () => {
        const ico = FAVICON_FORMATS.find((f) => f.id === "ico");
        expect(ico).toBeDefined();
        expect(ico?.name).toBe("ICO");
        expect(ico?.extension).toBe(".ico");
        expect(ico?.sizes).toContain(16);
        expect(ico?.sizes).toContain(32);
    });

    it("should include PNG 16x16 format", () => {
        const png16 = FAVICON_FORMATS.find((f) => f.id === "png-16");
        expect(png16).toBeDefined();
        expect(png16?.sizes).toContain(16);
    });

    it("should include PNG 32x32 format", () => {
        const png32 = FAVICON_FORMATS.find((f) => f.id === "png-32");
        expect(png32).toBeDefined();
        expect(png32?.sizes).toContain(32);
    });

    it("should include Apple Touch Icon format", () => {
        const apple = FAVICON_FORMATS.find((f) => f.id === "png-180");
        expect(apple).toBeDefined();
        expect(apple?.sizes).toContain(180);
    });

    it("should include Android Chrome formats", () => {
        const android192 = FAVICON_FORMATS.find((f) => f.id === "png-192");
        const android512 = FAVICON_FORMATS.find((f) => f.id === "png-512");
        expect(android192).toBeDefined();
        expect(android512).toBeDefined();
        expect(android192?.sizes).toContain(192);
        expect(android512?.sizes).toContain(512);
    });

    it("should include SVG format", () => {
        const svg = FAVICON_FORMATS.find((f) => f.id === "svg");
        expect(svg).toBeDefined();
        expect(svg?.extension).toBe(".svg");
    });

    it("should have required properties on all formats", () => {
        for (const format of FAVICON_FORMATS) {
            expect(format.id).toBeDefined();
            expect(format.name).toBeDefined();
            expect(format.extension).toBeDefined();
            expect(format.description).toBeDefined();
        }
    });
});

describe("FORMAT_SIZES", () => {
    it("should have ICO as array of sizes", () => {
        const icoSizes = FORMAT_SIZES["ico"];
        expect(Array.isArray(icoSizes)).toBe(true);
        expect(icoSizes).toContain(16);
        expect(icoSizes).toContain(32);
        expect(icoSizes).toContain(48);
    });

    it("should have correct PNG sizes", () => {
        expect(FORMAT_SIZES["png-16"]).toBe(16);
        expect(FORMAT_SIZES["png-32"]).toBe(32);
        expect(FORMAT_SIZES["png-48"]).toBe(48);
        expect(FORMAT_SIZES["png-180"]).toBe(180);
        expect(FORMAT_SIZES["png-192"]).toBe(192);
        expect(FORMAT_SIZES["png-512"]).toBe(512);
    });

    it("should have SVG with default size", () => {
        expect(FORMAT_SIZES["svg"]).toBe(32);
    });
});

describe("ALLOWED_MIME_TYPES", () => {
    it("should include PNG", () => {
        expect(ALLOWED_MIME_TYPES).toContain("image/png");
    });

    it("should include JPEG", () => {
        expect(ALLOWED_MIME_TYPES).toContain("image/jpeg");
    });

    it("should include SVG", () => {
        expect(ALLOWED_MIME_TYPES).toContain("image/svg+xml");
    });

    it("should include WebP", () => {
        expect(ALLOWED_MIME_TYPES).toContain("image/webp");
    });

    it("should include GIF", () => {
        expect(ALLOWED_MIME_TYPES).toContain("image/gif");
    });
});

describe("MAX_FILE_SIZE", () => {
    it("should be a positive number", () => {
        expect(typeof MAX_FILE_SIZE).toBe("number");
        expect(MAX_FILE_SIZE).toBeGreaterThan(0);
    });

    it("should be at least 5MB", () => {
        expect(MAX_FILE_SIZE).toBeGreaterThanOrEqual(5 * 1024 * 1024);
    });

    it("should be under 100MB", () => {
        expect(MAX_FILE_SIZE).toBeLessThanOrEqual(100 * 1024 * 1024);
    });
});

describe("DEFAULT_SELECTED_FORMATS", () => {
    it("should be an array", () => {
        expect(Array.isArray(DEFAULT_SELECTED_FORMATS)).toBe(true);
    });

    it("should include essential formats", () => {
        expect(DEFAULT_SELECTED_FORMATS).toContain("ico");
        expect(DEFAULT_SELECTED_FORMATS).toContain("png-16");
        expect(DEFAULT_SELECTED_FORMATS).toContain("png-32");
    });

    it("should only contain valid format IDs", () => {
        const validIds = FAVICON_FORMATS.map((f) => f.id);
        for (const formatId of DEFAULT_SELECTED_FORMATS) {
            expect(validIds).toContain(formatId);
        }
    });
});

// ============ getFilenameForFormat Tests ============

describe("getFilenameForFormat", () => {
    it("should return favicon.ico for ICO format", () => {
        expect(getFilenameForFormat("ico")).toBe("favicon.ico");
    });

    it("should return favicon.svg for SVG format", () => {
        expect(getFilenameForFormat("svg")).toBe("favicon.svg");
    });

    it("should return correct filename for png-16", () => {
        expect(getFilenameForFormat("png-16", 16)).toBe("favicon-16x16.png");
    });

    it("should return correct filename for png-32", () => {
        expect(getFilenameForFormat("png-32", 32)).toBe("favicon-32x32.png");
    });

    it("should return correct filename for png-180 (Apple Touch)", () => {
        expect(getFilenameForFormat("png-180", 180)).toBe("apple-touch-icon.png");
    });

    it("should return correct filename for png-192 (Android)", () => {
        expect(getFilenameForFormat("png-192", 192)).toBe("android-chrome-192x192.png");
    });

    it("should return correct filename for png-512 (Android)", () => {
        expect(getFilenameForFormat("png-512", 512)).toBe("android-chrome-512x512.png");
    });

    it("should handle unknown format with default naming", () => {
        const filename = getFilenameForFormat("unknown", 64);
        expect(filename).toContain(".png");
    });
});

// ============ createResultId Tests ============

describe("createResultId", () => {
    it("should create unique IDs for different calls", () => {
        const id1 = createResultId("ico");
        const id2 = createResultId("ico");
        expect(id1).not.toBe(id2);
    });

    it("should include format in the ID", () => {
        const id = createResultId("png-32");
        expect(id).toContain("png-32");
    });

    it("should start with result- prefix", () => {
        const id = createResultId("svg");
        expect(id).toMatch(/^result-/);
    });

    it("should create valid string IDs", () => {
        const id = createResultId("png-180");
        expect(typeof id).toBe("string");
        expect(id.length).toBeGreaterThan(10);
    });

    it("should include timestamp-like component", () => {
        const id = createResultId("ico");
        // ID format: result-{format}-{timestamp}-{random}
        const parts = id.split("-");
        expect(parts.length).toBeGreaterThanOrEqual(3);
    });

    it("should handle empty format string", () => {
        const id = createResultId("");
        expect(id).toMatch(/^result--/);
    });

    it("should generate many unique IDs", () => {
        const ids = new Set<string>();
        for (let i = 0; i < 100; i++) {
            ids.add(createResultId("test"));
        }
        expect(ids.size).toBe(100);
    });
});

// ============ Module Exports Tests ============

describe("Favicon Module Exports", () => {
    it("should export all constants from index", async () => {
        const index = await import("./index");

        expect(index.FAVICON_FORMATS).toBeDefined();
        expect(index.FORMAT_SIZES).toBeDefined();
        expect(index.ALLOWED_MIME_TYPES).toBeDefined();
        expect(index.MAX_FILE_SIZE).toBeDefined();
        expect(index.DEFAULT_SELECTED_FORMATS).toBeDefined();
        expect(index.getFilenameForFormat).toBeDefined();
    });

    it("should export validation functions from index", async () => {
        const index = await import("./index");

        expect(index.validateImageFile).toBeDefined();
        expect(index.validateFormats).toBeDefined();
    });

    it("should export utility functions from index", async () => {
        const index = await import("./index");

        expect(index.loadImage).toBeDefined();
        expect(index.resizeImageToPng).toBeDefined();
        expect(index.createIcoFile).toBeDefined();
        expect(index.createSvgFromImage).toBeDefined();
        expect(index.convertToFormat).toBeDefined();
        expect(index.createResultId).toBeDefined();
    });

    it("should export converter functions from index", async () => {
        const index = await import("./index");

        expect(index.convertFavicon).toBeDefined();
        expect(index.convertImageToFavicons).toBeDefined();
        expect(index.downloadFavicon).toBeDefined();
        expect(index.downloadAllAsZip).toBeDefined();
        expect(index.cleanupResults).toBeDefined();
    });
});
