import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["**/*.{ts}"],
    //ignorar .spec.ts
    ignores: [
      "**/node_modules/**",
      "**/config/**",
      "**/build/**",
      "jest.config.js",
      "jest.setup.ts",
      "jest.config.**",
      "ecosystem.config.mjs"
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": [
        "error",
        {
          fixToUnknown: true,
        },
      ],
      semi: ["error", "always"],
      "no-empty": "error",
      "no-unused-vars": "warn",
    },
  },
  {
    languageOptions: { globals: globals.browser },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
];
