const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch all packages in the monorepo so Metro picks up changes
config.watchFolders = [monorepoRoot];

// Resolve modules from monorepo root first (prevents duplicate React, etc.)
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Required for pnpm's virtual store + package.json exports field
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
