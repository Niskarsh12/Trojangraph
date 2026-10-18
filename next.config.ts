import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The falkordb client pulls in node-only redis/TLS modules; keep it out of the bundle.
  serverExternalPackages: ["falkordb"],
};

export default nextConfig;
