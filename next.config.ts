import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@composio/core",
    "@renderinc/sdk",
    "@aws-sdk/client-polly",
    "@aws-sdk/client-s3",
    "@aws-sdk/s3-request-presigner",
    "@clickhouse/client",
    "@anthropic-ai/sdk",
  ],
};

export default nextConfig;
