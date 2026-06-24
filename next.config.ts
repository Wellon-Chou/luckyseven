import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Served at the root of the custom domain (luckyseven.com.sg), so no basePath.
  // If you ever go back to the github.io/life-chart-report URL, restore:
  //   basePath: "/life-chart-report",
};

export default nextConfig;
