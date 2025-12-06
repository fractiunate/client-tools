/**
 * JSON/YAML Formatter Additional Tests
 * Edge cases and comprehensive coverage
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
import { validateJson, validateYaml, detectFormat } from "./validation";

// ============ Deep Nesting Tests ============

describe("Deep Nesting", () => {
    it("should handle deeply nested JSON objects (10 levels)", () => {
        const deep = {
            l1: { l2: { l3: { l4: { l5: { l6: { l7: { l8: { l9: { l10: "value" } } } } } } } } }
        };
        const input = JSON.stringify(deep);

        const result = formatJson(input, { indent: 2, sortKeys: false });

        expect(result.success).toBe(true);
        expect(result.output).toContain("l10");
    });

    it("should handle deeply nested YAML objects", () => {
        const yaml = `
l1:
  l2:
    l3:
      l4:
        l5:
          l6:
            l7:
              l8:
                l9:
                  l10: value
`;

        const result = yamlToJson(yaml, { indent: 2, sortKeys: false });

        expect(result.success).toBe(true);
        expect(result.output).toContain("l10");
    });

    it("should handle deeply nested arrays", () => {
        const createNestedArray = (depth: number, value: string): unknown => {
            if (depth === 0) return [value];
            return [createNestedArray(depth - 1, value)];
        };
        const deep = createNestedArray(10, "innermost");
        const input = JSON.stringify(deep);

        const result = formatJson(input, { indent: 2, sortKeys: false });

        expect(result.success).toBe(true);
        expect(result.output).toContain("innermost");
    });
});

// ============ Large Data Tests ============

describe("Large Data Handling", () => {
    it("should handle JSON with many keys", () => {
        const obj: Record<string, number> = {};
        for (let i = 0; i < 1000; i++) {
            obj[`key_${i}`] = i;
        }
        const input = JSON.stringify(obj);

        const result = formatJson(input, { indent: 2, sortKeys: true });

        expect(result.success).toBe(true);
        expect(result.output).toContain("key_999");
    });

    it("should handle large arrays", () => {
        const arr = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `item_${i}` }));
        const input = JSON.stringify(arr);

        const result = formatJson(input, { indent: 2, sortKeys: false });

        expect(result.success).toBe(true);
        expect(result.output).toContain("item_999");
    });

    it("should handle long strings", () => {
        const longString = "a".repeat(10000);
        const input = JSON.stringify({ text: longString });

        const result = formatJson(input, { indent: 2, sortKeys: false });

        expect(result.success).toBe(true);
        expect(result.output?.length).toBeGreaterThan(10000);
    });
});

// ============ Special Characters Tests ============

describe("Special Characters", () => {
    it("should handle JSON with escape sequences", () => {
        const obj = {
            newlines: "line1\nline2",
            tabs: "col1\tcol2",
            quotes: 'He said "hello"',
            backslash: "path\\to\\file",
            unicode: "\u0048\u0065\u006c\u006c\u006f",
        };
        const input = JSON.stringify(obj);

        const result = formatJson(input, { indent: 2, sortKeys: false });

        expect(result.success).toBe(true);
        expect(result.output).toContain("newlines");
    });

    it("should handle YAML with multiline strings", () => {
        const yaml = `
description: |
  This is a
  multiline
  string
`;

        const result = yamlToJson(yaml, { indent: 2, sortKeys: false });

        expect(result.success).toBe(true);
        expect(result.output).toContain("multiline");
    });

    it("should handle YAML folded strings", () => {
        const yaml = `
description: >
  This is a
  folded
  string
`;

        const result = yamlToJson(yaml, { indent: 2, sortKeys: false });

        expect(result.success).toBe(true);
    });

    it("should handle Unicode in keys and values", () => {
        const obj = {
            "日本語": "Japanese",
            "中文": "Chinese",
            "العربية": "Arabic",
            "emoji": "🎉🎊🎁",
        };
        const input = JSON.stringify(obj);

        const result = formatJson(input, { indent: 2, sortKeys: false });

        expect(result.success).toBe(true);
        expect(result.output).toContain("日本語");
        expect(result.output).toContain("🎉");
    });

    it("should preserve emoji in YAML conversion", () => {
        const obj = { emoji: "👨‍👩‍👧‍👦", symbol: "©®™" };
        const input = JSON.stringify(obj);

        const yamlResult = jsonToYaml(input, { indent: 2, forceQuotes: false, lineWidth: 80 });
        expect(yamlResult.success).toBe(true);

        const backToJson = yamlToJson(yamlResult.output!, { indent: 2, sortKeys: false });
        expect(backToJson.success).toBe(true);
    });
});

// ============ Data Type Tests ============

describe("Data Types", () => {
    it("should handle all JSON primitive types", () => {
        const obj = {
            string: "text",
            number: 42,
            float: 3.14159,
            negativeNumber: -100,
            scientificNotation: 1.5e10,
            booleanTrue: true,
            booleanFalse: false,
            nullValue: null,
        };
        const input = JSON.stringify(obj);

        const result = formatJson(input, { indent: 2, sortKeys: false });

        expect(result.success).toBe(true);
        expect(result.output).toContain("3.14159");
        expect(result.output).toContain("null");
    });

    it("should handle mixed arrays", () => {
        const arr = [1, "two", true, null, { nested: "object" }, [1, 2, 3]];
        const input = JSON.stringify(arr);

        const result = formatJson(input, { indent: 2, sortKeys: false });

        expect(result.success).toBe(true);
    });

    it("should preserve number precision", () => {
        const obj = { precision: 0.123456789012345 };
        const input = JSON.stringify(obj);

        const result = formatJson(input, { indent: 2, sortKeys: false });

        expect(result.success).toBe(true);
        expect(result.output).toContain("0.123456789012345");
    });

    it("should handle empty objects and arrays", () => {
        const obj = { emptyObj: {}, emptyArr: [] };
        const input = JSON.stringify(obj);

        const result = formatJson(input, { indent: 2, sortKeys: false });

        expect(result.success).toBe(true);
        expect(result.output).toContain("{}");
        expect(result.output).toContain("[]");
    });
});

// ============ YAML-Specific Tests ============

describe("YAML-Specific Features", () => {
    it("should handle YAML anchors and aliases", () => {
        const yaml = `
defaults: &defaults
  adapter: postgres
  host: localhost

development:
  <<: *defaults
  database: dev_db

production:
  <<: *defaults
  database: prod_db
`;

        const result = yamlToJson(yaml, { indent: 2, sortKeys: false });

        expect(result.success).toBe(true);
        const parsed = JSON.parse(result.output!);
        expect(parsed.development.database).toBe("dev_db");
        expect(parsed.production.database).toBe("prod_db");
    });

    it("should handle YAML dates", () => {
        const yaml = `
date: 2024-12-06
datetime: 2024-12-06T10:30:00Z
`;

        const result = yamlToJson(yaml, { indent: 2, sortKeys: false });

        expect(result.success).toBe(true);
    });

    it("should handle YAML null variations", () => {
        const yaml = `
null1: null
null2: ~
null3:
`;

        const result = yamlToJson(yaml, { indent: 2, sortKeys: false });

        expect(result.success).toBe(true);
        const parsed = JSON.parse(result.output!);
        expect(parsed.null1).toBeNull();
        expect(parsed.null2).toBeNull();
    });

    it("should handle YAML comments (strip them)", () => {
        const yaml = `
# This is a comment
key: value
# Another comment
other: data
`;

        const result = yamlToJson(yaml, { indent: 2, sortKeys: false });

        expect(result.success).toBe(true);
        expect(result.output).not.toContain("#");
    });

    it("should handle YAML arrays with different notations", () => {
        const yaml = `
inline: [1, 2, 3]
block:
  - a
  - b
  - c
`;

        const result = yamlToJson(yaml, { indent: 2, sortKeys: false });

        expect(result.success).toBe(true);
        const parsed = JSON.parse(result.output!);
        expect(parsed.inline).toEqual([1, 2, 3]);
        expect(parsed.block).toEqual(["a", "b", "c"]);
    });
});

// ============ Minification Tests ============

describe("Minification", () => {
    it("should minify JSON with proper structure", () => {
        const input = `{
  "name": "test",
  "items": [
    1,
    2,
    3
  ]
}`;

        const result = minifyJson(input);

        expect(result.success).toBe(true);
        expect(result.output).toBe('{"name":"test","items":[1,2,3]}');
    });

    it("should minify complex nested structures", () => {
        const obj = {
            a: { b: { c: { d: "value" } } },
            arr: [1, [2, [3, [4]]]],
        };
        const input = JSON.stringify(obj, null, 4);

        const result = minifyJson(input);

        expect(result.success).toBe(true);
        expect(result.output).not.toContain(" ");
        expect(result.output).not.toContain("\n");
    });
});

// ============ Sorting Tests ============

describe("Key Sorting", () => {
    it("should sort keys alphabetically when enabled", () => {
        const obj = { zebra: 1, apple: 2, mango: 3 };
        const input = JSON.stringify(obj);

        const result = formatJson(input, { indent: 2, sortKeys: true });

        expect(result.success).toBe(true);
        const lines = result.output!.split("\n");
        const keyOrder = lines.filter((l) => l.includes(":")).map((l) => l.trim().split(":")[0]);
        expect(keyOrder[0]).toContain("apple");
        expect(keyOrder[1]).toContain("mango");
        expect(keyOrder[2]).toContain("zebra");
    });

    it("should preserve key order when sorting disabled", () => {
        const obj = { zebra: 1, apple: 2, mango: 3 };
        const input = JSON.stringify(obj);

        const result = formatJson(input, { indent: 2, sortKeys: false });

        expect(result.success).toBe(true);
        const lines = result.output!.split("\n");
        const keyOrder = lines.filter((l) => l.includes(":")).map((l) => l.trim().split(":")[0]);
        expect(keyOrder[0]).toContain("zebra");
    });

    it("should sort nested object keys", () => {
        const obj = {
            outer: { z: 1, a: 2 },
            data: { y: 1, b: 2 },
        };
        const input = JSON.stringify(obj);

        const result = formatJson(input, { indent: 2, sortKeys: true });

        expect(result.success).toBe(true);
        expect(result.output!.indexOf('"a"')).toBeLessThan(result.output!.indexOf('"z"'));
    });
});

// ============ Round-Trip Tests ============

describe("Round-Trip Conversion", () => {
    it("should round-trip JSON -> YAML -> JSON", () => {
        const original = {
            name: "Test",
            count: 42,
            active: true,
            items: ["a", "b", "c"],
        };
        const input = JSON.stringify(original);

        const toYaml = jsonToYaml(input, { indent: 2, forceQuotes: false, lineWidth: 80 });
        expect(toYaml.success).toBe(true);

        const backToJson = yamlToJson(toYaml.output!, { indent: 2, sortKeys: false });
        expect(backToJson.success).toBe(true);

        const parsed = JSON.parse(backToJson.output!);
        expect(parsed).toEqual(original);
    });

    it("should round-trip YAML -> JSON -> YAML", () => {
        const yaml = `
name: Test
items:
  - one
  - two
`;

        const toJson = yamlToJson(yaml, { indent: 2, sortKeys: false });
        expect(toJson.success).toBe(true);

        const backToYaml = jsonToYaml(toJson.output!, { indent: 2, forceQuotes: false, lineWidth: 80 });
        expect(backToYaml.success).toBe(true);

        // Parse both and compare
        const original = yamlToJson(yaml, { indent: 2, sortKeys: false });
        const roundTripped = yamlToJson(backToYaml.output!, { indent: 2, sortKeys: false });

        expect(JSON.parse(original.output!)).toEqual(JSON.parse(roundTripped.output!));
    });

    it("should preserve data integrity through multiple conversions", () => {
        const original = {
            nested: { deep: { value: [1, 2, 3] } },
            special: "hello world",
        };
        const input = JSON.stringify(original);

        // Convert multiple times
        let current = input;
        for (let i = 0; i < 5; i++) {
            const toYaml = jsonToYaml(current, { indent: 2, forceQuotes: false, lineWidth: 80 });
            expect(toYaml.success).toBe(true);

            const toJson = yamlToJson(toYaml.output!, { indent: 2, sortKeys: false });
            expect(toJson.success).toBe(true);

            current = toJson.output!;
        }

        expect(JSON.parse(current)).toEqual(original);
    });
});

// ============ Auto-Format Tests ============

describe("Auto-Format", () => {
    it("should auto-format JSON", () => {
        const input = '{"key":"value"}';

        const result = autoFormat(input);

        expect(result.success).toBe(true);
        expect(result.inputFormat).toBe("json");
        expect(result.output).toContain("\n");
    });

    it("should auto-format YAML", () => {
        const input = "key: value\nother: data";

        const result = autoFormat(input);

        expect(result.success).toBe(true);
        expect(result.inputFormat).toBe("yaml");
    });

    it("should convert JSON to YAML when target specified", () => {
        const input = '{"key": "value"}';

        const result = autoFormat(input, "yaml");

        expect(result.success).toBe(true);
        expect(result.outputFormat).toBe("yaml");
    });

    it("should convert YAML to JSON when target specified", () => {
        const input = "key: value";

        const result = autoFormat(input, "json");

        expect(result.success).toBe(true);
        expect(result.outputFormat).toBe("json");
    });
});

// ============ Error Handling Tests ============

describe("Error Handling", () => {
    it("should handle unclosed JSON brackets", () => {
        const input = '{"key": "value"';

        const result = validateJson(input);

        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
    });

    it("should handle invalid JSON trailing comma", () => {
        const input = '{"key": "value",}';

        const result = validateJson(input);

        expect(result.valid).toBe(false);
    });

    it("should handle empty input gracefully", () => {
        const jsonResult = formatJson("", { indent: 2, sortKeys: false });
        expect(jsonResult.success).toBe(false);

        const yamlResult = formatYaml("", { indent: 2, forceQuotes: false, lineWidth: 80 });
        expect(yamlResult.success).toBe(false);
    });

    it("should handle whitespace-only input", () => {
        const result = formatJson("   \n\t  ", { indent: 2, sortKeys: false });
        expect(result.success).toBe(false);
    });
});

// ============ Indentation Tests ============

describe("Indentation Options", () => {
    it("should format with 2-space indent", () => {
        const input = '{"a":{"b":"c"}}';

        const result = formatJson(input, { indent: 2, sortKeys: false });

        expect(result.success).toBe(true);
        // Check the nested property has 4 spaces (2 levels * 2 spaces)
        expect(result.output).toMatch(/\n {4}"b"/);
    });

    it("should format with 4-space indent", () => {
        const input = '{"a":{"b":"c"}}';

        const result = formatJson(input, { indent: 4, sortKeys: false });

        expect(result.success).toBe(true);
        expect(result.output).toMatch(/\n {8}"b"/);
    });

    it("should format with 8-space indent", () => {
        const input = '{"a":{"b":"c"}}';

        const result = formatJson(input, { indent: 8, sortKeys: false });

        expect(result.success).toBe(true);
        expect(result.output).toMatch(/\n {16}"b"/);
    });
});

// ============ Format Detection Tests ============

describe("Format Detection", () => {
    it("should detect JSON object", () => {
        expect(detectFormat('{"key": "value"}')).toBe("json");
    });

    it("should detect JSON array", () => {
        expect(detectFormat("[1, 2, 3]")).toBe("json");
    });

    it("should detect YAML with colon", () => {
        expect(detectFormat("key: value")).toBe("yaml");
    });

    it("should detect YAML with dash list", () => {
        expect(detectFormat("- item1\n- item2")).toBe("yaml");
    });

    it("should handle input with leading whitespace", () => {
        expect(detectFormat('  { "key": "value" }')).toBe("json");
    });
});

// ============ Validation Tests ============

describe("Input Validation", () => {
    it("should reject empty JSON input", () => {
        const result = validateJson("");
        expect(result.valid).toBe(false);
    });

    it("should accept valid JSON input", () => {
        const result = validateJson('{"valid": true}');
        expect(result.valid).toBe(true);
        expect(result.parsed).toEqual({ valid: true });
    });

    it("should accept valid YAML input", () => {
        const result = validateYaml("valid: true");
        expect(result.valid).toBe(true);
        expect(result.parsed).toEqual({ valid: true });
    });

    it("should include parsed data on success", () => {
        const result = validateJson('{"a": 1, "b": [1,2,3]}');
        expect(result.valid).toBe(true);
        expect(result.parsed).toEqual({ a: 1, b: [1, 2, 3] });
    });
});
