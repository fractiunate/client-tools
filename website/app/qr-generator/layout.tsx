import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "QR Code Generator",
    description:
        "Generate QR codes for text, URLs, WiFi credentials, and vCards. Customize colors, size, and error correction. Download as PNG or SVG. 100% client-side.",
    openGraph: {
        title: "QR Code Generator | Client-Side Tools",
        description:
            "Generate QR codes for text, URLs, WiFi, and vCards. Customizable colors and sizes. Download as PNG or SVG. Runs entirely in your browser.",
        url: "https://fractiunate.me/client-tools/qr-generator",
    },
    twitter: {
        title: "QR Code Generator | Client-Side Tools",
        description:
            "Generate customizable QR codes for text, URLs, WiFi, vCards. PNG or SVG export. 100% private.",
    },
};

export default function QRGeneratorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
