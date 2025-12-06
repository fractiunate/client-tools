import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Favicon Converter",
    description:
        "Convert images to all favicon formats including ICO, PNG, SVG, Apple Touch Icons, and Android Chrome icons. Free and runs entirely in your browser.",
    openGraph: {
        title: "Favicon Converter | Client-Side Tools",
        description:
            "Convert images to all favicon formats. ICO, PNG (16x16 to 512x512), Apple Touch Icons, Android Chrome icons. 100% client-side.",
        url: "https://fractiunate.me/client-tools/favicon-converter",
    },
    twitter: {
        title: "Favicon Converter | Client-Side Tools",
        description:
            "Convert images to all favicon formats. ICO, PNG, Apple Touch Icons, Android Chrome icons. 100% private.",
    },
};

export default function FaviconConverterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
