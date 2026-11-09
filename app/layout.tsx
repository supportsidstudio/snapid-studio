// @ts-nocheck
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SnapID Studio - AI Passport Photo & Background Remover',
  description: 'Instant client-side AI background remover with WebGPU and multi-threaded WASM.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* 
          coi-serviceworker: GitHub Pages के लिए अनिवार्य है।
          यह सर्विस वर्कर हर रिस्पॉन्स में COOP: same-origin और COEP: credentialless हेडर जोड़कर 
          crossOriginIsolated: true और Multi-threaded WASM SIMD को सक्रिय करता है।
        */}
        <script src="/snapid-studio/coi-serviceworker.js" async={false} />
      </head>
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
