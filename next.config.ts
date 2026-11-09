// @ts-nocheck
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // 1. COOP और COEP हेडर पूरी साइट पर लागू करने के लिए
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
            // credentialless बाहरी इमेज/फ़ॉन्ट्स को ब्लॉक किए बिना crossOriginIsolated: true सक्षम करता है
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
  // WebAssembly और ONNX मॉडल बाइनरी सपोर्ट
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
