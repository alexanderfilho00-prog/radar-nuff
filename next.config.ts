import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Os relatórios ficam em data/reports e são lidos no build.
  outputFileTracingIncludes: { "/*": ["./data/reports/**/*"] },
};

export default nextConfig;
