import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: ["http://172.22.155.154:3000"],
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
