/**
 * JSON/YAML Formatter Constants
 */

import type { JsonFormatOptions, YamlFormatOptions, IndentSize } from "./types";

/**
 * Default JSON format options
 */
export const DEFAULT_JSON_OPTIONS: JsonFormatOptions = {
    indent: 2,
    sortKeys: false,
};

/**
 * Default YAML format options
 */
export const DEFAULT_YAML_OPTIONS: YamlFormatOptions = {
    indent: 2,
    sortKeys: false,
    flowLevel: -1, // Block style by default
    lineWidth: 80,
    quotingType: "'",
    forceQuotes: false,
};

/**
 * Available indent sizes
 */
export const INDENT_OPTIONS: { value: IndentSize; label: string }[] = [
    { value: 2, label: "2 spaces" },
    { value: 4, label: "4 spaces" },
    { value: 8, label: "8 spaces" },
];

/**
 * Maximum input size in characters (1MB)
 */
export const MAX_INPUT_SIZE = 1024 * 1024;

/**
 * Sample JSON for demo
 */
export const SAMPLE_JSON = `{
  "name": "John Doe",
  "age": 30,
  "email": "john@example.com",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "country": "USA"
  },
  "hobbies": ["reading", "gaming", "coding"],
  "active": true
}`;

/**
 * Sample YAML for demo
 */
export const SAMPLE_YAML = `name: John Doe
age: 30
email: john@example.com
address:
  street: 123 Main St
  city: New York
  country: USA
hobbies:
  - reading
  - gaming
  - coding
active: true`;
