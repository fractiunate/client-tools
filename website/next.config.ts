import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  distDir: "dist",
  basePath: "/client-tools",
  trailingSlash: true,
};

export default nextConfig;
