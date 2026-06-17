import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Calorie Tracker and My Metrics tools moved from /health/* to /tools/*.
  // Keep old links and bookmarks working.
  async redirects() {
    return [
      { source: "/health/nutrition", destination: "/tools/nutrition", permanent: true },
      { source: "/health/metrics", destination: "/tools/metrics", permanent: true },
    ];
  },
};

export default nextConfig;
