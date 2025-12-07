import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "CIDR Calculator - IPv4 & IPv6",
    description:
        "Calculate IPv4 and IPv6 CIDR ranges, detect overlaps, and find available IP blocks. Subnet calculator with network address, broadcast, usable hosts. Supports both protocols. 100% client-side.",
    openGraph: {
        title: "CIDR Calculator - IPv4 & IPv6 | Client-Side Tools",
        description:
            "Calculate IPv4 and IPv6 CIDR ranges, detect overlaps, and find available subnets. Dual-stack network planning made easy. Runs entirely in your browser.",
        url: "https://fractiunate.me/client-tools/cidr-calculator",
    },
    twitter: {
        title: "CIDR Calculator - IPv4 & IPv6 | Client-Side Tools",
        description:
            "IPv4 & IPv6 CIDR calculator with overlap detection and subnet suggestions. 100% private.",
    },
};

export default function CIDRCalculatorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
