import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  reactHooks.configs.flat["recommended-latest"],
  prettierConfig,
  {
    ignores: ["dist/", "node_modules/"],
  },
);
