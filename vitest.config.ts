import { configDefaults, defineConfig } from "vitest/config";

// Playwright specs live in e2e/ and run with `npm run test:e2e`, not here.
export default defineConfig({
  test: { exclude: [...configDefaults.exclude, "e2e/**"] },
});
