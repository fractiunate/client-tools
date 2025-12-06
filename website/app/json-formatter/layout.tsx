import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "JSON & YAML Formatter",
    description:
        "Format, validate, and convert between JSON and YAML. Beautify data with customizable indentation, sort keys, and minify options. 100% client-side.",
    openGraph: {
        title: "JSON & YAML Formatter | Client-Side Tools",
        description:
            "Format, validate, and convert JSON/YAML. Beautify, minify, sort keys. Bidirectional conversion. Runs entirely in your browser.",
        url: "https://fractiunate.me/client-tools/json-formatter",
    },
    twitter: {
        title: "JSON & YAML Formatter | Client-Side Tools",
        description:
            "Format, validate, convert JSON and YAML. Beautify, minify, sort keys. 100% private.",
    },
};

export default function JsonFormatterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
