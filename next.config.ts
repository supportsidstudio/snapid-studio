// @ts-nocheck
import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_ACTIONS || process.env.NODE_ENV === "production";
const repoName = "/snapid-studio";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export", // GitHub Pages requires static HTML export
  basePath: isGithubPages ? repoName : "",
  assetPrefix: isGithubPages ? `${repoName}/` : "",
  images: {
    unoptimized: true, // Required for static export on GitHub Pages
  },

  // Headers (works in local dev and servers, while coi-serviceworker handles GitHub Pages)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "credentialless",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "cross-origin",
          },
        ],
      },
    ];
  },

  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };
    return config;
  },
};

export default nextConfig;
