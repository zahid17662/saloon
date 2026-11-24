import path from "node:path";
import { configDefaults, defineConfig } from "vitest/config";

// Playwright specs live in e2e/ and run with `npm run test:e2e`, not here.
export default defineConfig({
  resolve: { alias: { "@": path.resolve(process.cwd(), "src") } },
  test: { exclude: [...configDefaults.exclude, "e2e/**"] },
});
