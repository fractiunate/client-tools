/**
 * JSON/YAML Formatter Unit Tests
 */

import { describe, it, expect } from "vitest";
import {
    formatJson,
    formatYaml,
    jsonToYaml,
    yamlToJson,
    minifyJson,
    autoFormat,
} from "./formatter";

describe("formatJson", () => {
    it("should format valid JSON with default indent", () => {
        const result = formatJson('{"a":1,"b":2}');
        expect(result.success).toBe(true);
        expect(result.output).toContain("\n");
        expect(result.output).toContain("  "); // 2-space indent
    });

    it("should format with custom indent", () => {
        const result = formatJson('{"a":1}', { indent: 4 });
        expect(result.success).toBe(true);
        expect(result.output).toContain("    "); // 4-space indent
    });

    it("should sort keys when option enabled", () => {
        const result = formatJson('{"b":1,"a":2}', { sortKeys: true });
        expect(result.success).toBe(true);
        const parsed = JSON.parse(result.output!);
        const keys = Object.keys(parsed);
        expect(keys[0]).toBe("a");
        expect(keys[1]).toBe("b");
    });

    it("should fail for invalid JSON", () => {
        const result = formatJson("{invalid}");
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
    });

    it("should preserve nested structure", () => {
        const input = '{"a":{"b":{"c":1}}}';
        const result = formatJson(input);
        expect(result.success).toBe(true);
        const parsed = JSON.parse(result.output!);
        expect(parsed.a.b.c).toBe(1);
    });
});

describe("formatYaml", () => {
    it("should format valid YAML", () => {
        const result = formatYaml("a: 1\nb: 2");
        expect(result.success).toBe(true);
        expect(result.output).toBeDefined();
    });

    it("should sort keys when option enabled", () => {
        const result = formatYaml("b: 1\na: 2", { sortKeys: true });
        expect(result.success).toBe(true);
        // a should come before b in output
        const aIndex = result.output!.indexOf("a:");
        const bIndex = result.output!.indexOf("b:");
        expect(aIndex).toBeLessThan(bIndex);
    });

    it("should fail for invalid YAML", () => {
        const result = formatYaml("");
        expect(result.success).toBe(false);
    });
});

describe("jsonToYaml", () => {
    it("should convert simple JSON to YAML", () => {
        const result = jsonToYaml('{"name":"test","value":42}');
        expect(result.success).toBe(true);
        expect(result.inputFormat).toBe("json");
        expect(result.outputFormat).toBe("yaml");
        expect(result.output).toContain("name:");
        expect(result.output).toContain("value:");
    });

    it("should convert nested JSON to YAML", () => {
        const result = jsonToYaml('{"a":{"b":1}}');
        expect(result.success).toBe(true);
        expect(result.output).toContain("a:");
        expect(result.output).toContain("b:");
    });

    it("should convert JSON array to YAML", () => {
        const result = jsonToYaml('["one","two","three"]');
        expect(result.success).toBe(true);
        expect(result.output).toContain("- one");
    });

    it("should fail for invalid JSON", () => {
        const result = jsonToYaml("{invalid}");
        expect(result.success).toBe(false);
    });

    it("should sort keys when option enabled", () => {
        const result = jsonToYaml('{"z":1,"a":2}', { sortKeys: true });
        expect(result.success).toBe(true);
        const aIndex = result.output!.indexOf("a:");
        const zIndex = result.output!.indexOf("z:");
        expect(aIndex).toBeLessThan(zIndex);
    });
});

describe("yamlToJson", () => {
    it("should convert simple YAML to JSON", () => {
        const result = yamlToJson("name: test\nvalue: 42");
        expect(result.success).toBe(true);
        expect(result.inputFormat).toBe("yaml");
        expect(result.outputFormat).toBe("json");
        const parsed = JSON.parse(result.output!);
        expect(parsed.name).toBe("test");
        expect(parsed.value).toBe(42);
    });

    it("should convert nested YAML to JSON", () => {
        const yaml = `a:
  b: 1`;
        const result = yamlToJson(yaml);
        expect(result.success).toBe(true);
        const parsed = JSON.parse(result.output!);
        expect(parsed.a.b).toBe(1);
    });

    it("should convert YAML array to JSON", () => {
        const yaml = `- one
- two
- three`;
        const result = yamlToJson(yaml);
        expect(result.success).toBe(true);
        const parsed = JSON.parse(result.output!);
        expect(parsed).toEqual(["one", "two", "three"]);
    });

    it("should fail for invalid YAML", () => {
        const result = yamlToJson("");
        expect(result.success).toBe(false);
    });

    it("should use custom indent", () => {
        const result = yamlToJson("a: 1", { indent: 4 });
        expect(result.success).toBe(true);
        expect(result.output).toContain("    "); // 4-space indent
    });
});

describe("minifyJson", () => {
    it("should remove whitespace from JSON", () => {
        const formatted = `{
  "a": 1,
  "b": 2
}`;
        const result = minifyJson(formatted);
        expect(result.success).toBe(true);
        expect(result.output).toBe('{"a":1,"b":2}');
    });

    it("should preserve data integrity", () => {
        const input = '{"name": "test", "values": [1, 2, 3]}';
        const result = minifyJson(input);
        expect(result.success).toBe(true);
        const parsed = JSON.parse(result.output!);
        expect(parsed.name).toBe("test");
        expect(parsed.values).toEqual([1, 2, 3]);
    });

    it("should fail for invalid JSON", () => {
        const result = minifyJson("{invalid}");
        expect(result.success).toBe(false);
    });
});

describe("autoFormat", () => {
    it("should auto-detect and format JSON", () => {
        const result = autoFormat('{"a":1}');
        expect(result.success).toBe(true);
        expect(result.inputFormat).toBe("json");
    });

    it("should auto-detect and format YAML", () => {
        const result = autoFormat("a: 1");
        expect(result.success).toBe(true);
        expect(result.inputFormat).toBe("yaml");
    });

    it("should convert JSON to YAML when target specified", () => {
        const result = autoFormat('{"a":1}', "yaml");
        expect(result.success).toBe(true);
        expect(result.inputFormat).toBe("json");
        expect(result.outputFormat).toBe("yaml");
    });

    it("should convert YAML to JSON when target specified", () => {
        const result = autoFormat("a: 1", "json");
        expect(result.success).toBe(true);
        expect(result.inputFormat).toBe("yaml");
        expect(result.outputFormat).toBe("json");
    });

    it("should fail for undetectable format", () => {
        const result = autoFormat("{{{{");
        expect(result.success).toBe(false);
    });
});
