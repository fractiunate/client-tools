/**
 * Favicon Validation Unit Tests
 */

import { describe, it, expect } from "vitest";
import { validateImageFile, validateFormats } from "./validation";
import { FAVICON_FORMATS, ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "./constants";

describe("validateImageFile", () => {
    describe("valid files", () => {
        it("should accept PNG files", () => {
            const file = new File(["test"], "image.png", { type: "image/png" });
            const result = validateImageFile(file);
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it("should accept JPEG files", () => {
            const file = new File(["test"], "image.jpg", { type: "image/jpeg" });
            const result = validateImageFile(file);
            expect(result.valid).toBe(true);
        });

        it("should accept WebP files", () => {
            const file = new File(["test"], "image.webp", { type: "image/webp" });
            const result = validateImageFile(file);
            expect(result.valid).toBe(true);
        });

        it("should accept GIF files", () => {
            const file = new File(["test"], "image.gif", { type: "image/gif" });
            const result = validateImageFile(file);
            expect(result.valid).toBe(true);
        });

        it("should accept SVG files", () => {
            const file = new File(["<svg></svg>"], "image.svg", { type: "image/svg+xml" });
            const result = validateImageFile(file);
            expect(result.valid).toBe(true);
        });

        it("should accept ICO files by extension", () => {
            // ICO files are validated by extension, not just MIME type
            const file = new File(["test"], "favicon.ico", { type: "image/x-icon" });
            const result = validateImageFile(file);
            expect(result.valid).toBe(true);
        });
    });

    describe("invalid files", () => {
        it("should reject null file", () => {
            const result = validateImageFile(null as unknown as File);
            expect(result.valid).toBe(false);
            expect(result.error).toBe("No file provided");
        });

        it("should reject undefined file", () => {
            const result = validateImageFile(undefined as unknown as File);
            expect(result.valid).toBe(false);
            expect(result.error).toBe("No file provided");
        });

        it("should reject non-image MIME types", () => {
            const file = new File(["test"], "document.pdf", { type: "application/pdf" });
            const result = validateImageFile(file);
            expect(result.valid).toBe(false);
            expect(result.error).toContain("valid image");
        });

        it("should reject text files", () => {
            const file = new File(["test"], "document.txt", { type: "text/plain" });
            const result = validateImageFile(file);
            expect(result.valid).toBe(false);
        });

        it("should reject files exceeding MAX_FILE_SIZE", () => {
            // Create a large file by mocking size
            const largeFile = new File(["x"], "large.png", { type: "image/png" });
            Object.defineProperty(largeFile, "size", { value: MAX_FILE_SIZE + 1 });

            const result = validateImageFile(largeFile);
            expect(result.valid).toBe(false);
            expect(result.error).toContain("less than");
        });

        it("should include size limit in error message when file is too large", () => {
            const largeFile = new File(["x"], "large.png", { type: "image/png" });
            Object.defineProperty(largeFile, "size", { value: MAX_FILE_SIZE + 1 });

            const result = validateImageFile(largeFile);
            expect(result.error).toContain("10MB");
        });

        it("should reject empty files (0 bytes)", () => {
            const file = new File([], "empty.png", { type: "image/png" });
            const result = validateImageFile(file);
            expect(result.valid).toBe(false);
            expect(result.error).toContain("empty");
        });
    });

    describe("edge cases", () => {
        it("should accept file at exactly MAX_FILE_SIZE", () => {
            const file = new File(["x"], "exact.png", { type: "image/png" });
            Object.defineProperty(file, "size", { value: MAX_FILE_SIZE });

            const result = validateImageFile(file);
            expect(result.valid).toBe(true);
        });

        it("should handle files with unknown MIME type based on extension", () => {
            // Some browsers may not set MIME type correctly
            const file = new File(["test"], "image.png", { type: "" });
            const result = validateImageFile(file);
            // Should fail because MIME type is empty/invalid
            expect(result.valid).toBe(false);
        });
    });
});

describe("validateFormats", () => {
    const validFormatIds = FAVICON_FORMATS.map(f => f.id);

    describe("valid formats", () => {
        it("should accept single valid format", () => {
            const result = validateFormats(["ico"]);
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it("should accept multiple valid formats", () => {
            const result = validateFormats(["ico", "png-16", "png-32"]);
            expect(result.valid).toBe(true);
        });

        it("should accept all available formats", () => {
            const result = validateFormats(validFormatIds);
            expect(result.valid).toBe(true);
        });

        it("should accept apple-touch-icon format (png-180)", () => {
            const result = validateFormats(["png-180"]);
            expect(result.valid).toBe(true);
        });

        it("should accept android chrome formats", () => {
            const result = validateFormats(["png-192", "png-512"]);
            expect(result.valid).toBe(true);
        });

        it("should accept SVG format", () => {
            const result = validateFormats(["svg"]);
            expect(result.valid).toBe(true);
        });
    });

    describe("invalid formats", () => {
        it("should reject empty array", () => {
            const result = validateFormats([]);
            expect(result.valid).toBe(false);
            expect(result.error).toContain("at least one");
        });

        it("should reject null formats", () => {
            const result = validateFormats(null as unknown as string[]);
            expect(result.valid).toBe(false);
            expect(result.error).toContain("at least one");
        });

        it("should reject undefined formats", () => {
            const result = validateFormats(undefined as unknown as string[]);
            expect(result.valid).toBe(false);
        });

        it("should reject unknown format IDs", () => {
            const result = validateFormats(["invalid-format"]);
            expect(result.valid).toBe(false);
            expect(result.error).toContain("Unknown format");
            expect(result.error).toContain("invalid-format");
        });

        it("should reject array with mix of valid and invalid formats", () => {
            const result = validateFormats(["ico", "not-a-format", "png-16"]);
            expect(result.valid).toBe(false);
            expect(result.error).toContain("not-a-format");
        });

        it("should reject multiple invalid formats and report them", () => {
            const result = validateFormats(["fake1", "fake2"]);
            expect(result.valid).toBe(false);
            expect(result.error).toContain("fake1");
            expect(result.error).toContain("fake2");
        });
    });

    describe("edge cases", () => {
        it("should be case-sensitive for format IDs", () => {
            const result = validateFormats(["ICO"]); // uppercase
            expect(result.valid).toBe(false);
        });

        it("should reject array with empty string", () => {
            const result = validateFormats([""]);
            expect(result.valid).toBe(false);
        });

        it("should reject array with whitespace-only strings", () => {
            const result = validateFormats(["   "]);
            expect(result.valid).toBe(false);
        });

        it("should handle duplicate formats", () => {
            // Duplicates are valid format IDs, just redundant
            const result = validateFormats(["ico", "ico", "ico"]);
            expect(result.valid).toBe(true);
        });
    });
});

describe("ALLOWED_MIME_TYPES constant", () => {
    it("should include common image MIME types", () => {
        expect(ALLOWED_MIME_TYPES).toContain("image/png");
        expect(ALLOWED_MIME_TYPES).toContain("image/jpeg");
        expect(ALLOWED_MIME_TYPES).toContain("image/gif");
        expect(ALLOWED_MIME_TYPES).toContain("image/webp");
        expect(ALLOWED_MIME_TYPES).toContain("image/svg+xml");
    });
});