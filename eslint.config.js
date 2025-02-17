import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  { ignores: ["dist/*", "lib/*", "**/*.js", "**/*.d.ts"] },
  { files: ["**/*.{ts,tsx}"] },
  { 
    languageOptions: { 
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      }
    },
  },
  {
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
    }
  },
)