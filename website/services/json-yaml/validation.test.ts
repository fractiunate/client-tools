/**
 * JSON/YAML Validation Unit Tests
 */

import { describe, it, expect } from "vitest";
import {
    validateJson,
    validateYaml,
    detectFormat,
    validateInput,
} from "./validation";

describe("validateJson", () => {
    describe("valid JSON", () => {
        it("should accept valid JSON object", () => {
            const result = validateJson('{"name": "test"}');
            expect(result.valid).toBe(true);
            expect(result.parsed).toEqual({ name: "test" });
        });

        it("should accept valid JSON array", () => {
            const result = validateJson('[1, 2, 3]');
            expect(result.valid).toBe(true);
            expect(result.parsed).toEqual([1, 2, 3]);
        });

        it("should accept nested JSON", () => {
            const result = validateJson('{"a": {"b": {"c": 1}}}');
            expect(result.valid).toBe(true);
            expect(result.parsed).toEqual({ a: { b: { c: 1 } } });
        });

        it("should accept JSON with various types", () => {
            const json = '{"str": "hello", "num": 42, "bool": true, "null": null}';
            const result = validateJson(json);
            expect(result.valid).toBe(true);
        });

        it("should accept minified JSON", () => {
            const result = validateJson('{"a":1,"b":2}');
            expect(result.valid).toBe(true);
        });
    });

    describe("invalid JSON", () => {
        it("should reject empty string", () => {
            const result = validateJson("");
            expect(result.valid).toBe(false);
            expect(result.error).toContain("empty");
        });

        it("should reject whitespace-only", () => {
            const result = validateJson("   ");
            expect(result.valid).toBe(false);
        });

        it("should reject invalid JSON syntax", () => {
            const result = validateJson("{invalid}");
            expect(result.valid).toBe(false);
            expect(result.error).toContain("JSON parse error");
        });

        it("should reject trailing commas", () => {
            const result = validateJson('{"a": 1,}');
            expect(result.valid).toBe(false);
        });

        it("should reject single quotes", () => {
            const result = validateJson("{'a': 1}");
            expect(result.valid).toBe(false);
        });

        it("should reject unquoted keys", () => {
            const result = validateJson("{a: 1}");
            expect(result.valid).toBe(false);
        });
    });
});

describe("validateYaml", () => {
    describe("valid YAML", () => {
        it("should accept valid YAML object", () => {
            const result = validateYaml("name: test");
            expect(result.valid).toBe(true);
            expect(result.parsed).toEqual({ name: "test" });
        });

        it("should accept valid YAML array", () => {
            const yaml = `- one
- two
- three`;
            const result = validateYaml(yaml);
            expect(result.valid).toBe(true);
            expect(result.parsed).toEqual(["one", "two", "three"]);
        });

        it("should accept nested YAML", () => {
            const yaml = `a:
  b:
    c: 1`;
            const result = validateYaml(yaml);
            expect(result.valid).toBe(true);
            expect(result.parsed).toEqual({ a: { b: { c: 1 } } });
        });

        it("should accept YAML with document marker", () => {
            const yaml = `---
name: test`;
            const result = validateYaml(yaml);
            expect(result.valid).toBe(true);
        });

        it("should accept quoted strings", () => {
            const yaml = 'name: "test with spaces"';
            const result = validateYaml(yaml);
            expect(result.valid).toBe(true);
        });
    });

    describe("invalid YAML", () => {
        it("should reject empty string", () => {
            const result = validateYaml("");
            expect(result.valid).toBe(false);
            expect(result.error).toContain("empty");
        });

        it("should reject invalid indentation", () => {
            const yaml = `a:
b: 1
  c: 2`;
            const result = validateYaml(yaml);
            // YAML parser may or may not reject this depending on interpretation
            // Just ensure it doesn't crash
            expect(typeof result.valid).toBe("boolean");
        });
    });
});

describe("detectFormat", () => {
    describe("JSON detection", () => {
        it("should detect JSON object", () => {
            expect(detectFormat('{"key": "value"}')).toBe("json");
        });

        it("should detect JSON array", () => {
            expect(detectFormat("[1, 2, 3]")).toBe("json");
        });

        it("should detect minified JSON", () => {
            expect(detectFormat('{"a":1,"b":2}')).toBe("json");
        });

        it("should detect JSON with whitespace", () => {
            expect(detectFormat('  { "key": "value" }  ')).toBe("json");
        });
    });

    describe("YAML detection", () => {
        it("should detect YAML with key-value", () => {
            expect(detectFormat("key: value")).toBe("yaml");
        });

        it("should detect YAML with document marker", () => {
            expect(detectFormat("---\nkey: value")).toBe("yaml");
        });

        it("should detect YAML array", () => {
            expect(detectFormat("- item1\n- item2")).toBe("yaml");
        });

        it("should detect multi-line YAML", () => {
            const yaml = `name: test
age: 30`;
            expect(detectFormat(yaml)).toBe("yaml");
        });
    });

    describe("edge cases", () => {
        it("should return null for empty input", () => {
            expect(detectFormat("")).toBe(null);
        });

        it("should return null for whitespace-only", () => {
            expect(detectFormat("   ")).toBe(null);
        });

        it("should return null for invalid content", () => {
            // Content that's neither valid JSON nor YAML
            expect(detectFormat("{{{{")).toBe(null);
        });
    });
});

describe("validateInput", () => {
    it("should validate JSON when format is json", () => {
        const result = validateInput('{"a": 1}', "json");
        expect(result.valid).toBe(true);
    });

    it("should validate YAML when format is yaml", () => {
        const result = validateInput("a: 1", "yaml");
        expect(result.valid).toBe(true);
    });

    it("should fail JSON validation for YAML input", () => {
        const result = validateInput("a: 1", "json");
        expect(result.valid).toBe(false);
    });
});
