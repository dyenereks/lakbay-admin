import type { NextConfig } from "next";

// NOTE: the public site's `/packages/:slug` -> `/:slug` redirect must NOT be
// copied here — this app has a real /packages/[slug] route (the editor), and
// that redirect would hijack it.
const nextConfig: NextConfig = {
  images: {
    // Thumbnails come from two places: Firebase Storage, and the public site
    // (packages seeded with relative paths like /images/packages/x.jpg, which
    // that deployment serves). This is a private tool rendering a handful of
    // small images, so skip the optimizer rather than maintain a remotePatterns
    // allowlist that has to track both hosts plus localhost in dev.
    unoptimized: true,
  },
};

export default nextConfig;
