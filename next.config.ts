import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // tesseract.js resolves its worker script relative to its own package dir
  // at runtime; bundling it rewrites that path and breaks resolution. Same
  // class of issue for @napi-rs/canvas's native binary. Keep both external
  // so the OCR API routes (src/app/api/ocr-demo/) use normal node `require`.
  serverExternalPackages: ["tesseract.js", "@napi-rs/canvas"],
};

export default nextConfig;
