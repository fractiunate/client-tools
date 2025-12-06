import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "TLS Certificate Generator",
    description:
        "Generate self-signed TLS certificates for development and testing. Create root CAs, server certificates, and client certificates with RSA/ECDSA keys. 100% client-side.",
    openGraph: {
        title: "TLS Certificate Generator | Client-Side Tools",
        description:
            "Generate self-signed TLS certificates for development. Root CAs, server certs, client certs with full X.509v3 support. Runs entirely in your browser.",
        url: "https://fractiunate.me/client-tools/cert-generator",
    },
    twitter: {
        title: "TLS Certificate Generator | Client-Side Tools",
        description:
            "Generate self-signed TLS certificates for development. Root CAs, server certs, client certs. 100% private.",
    },
};

export default function CertGeneratorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
