import nx from "@nx/eslint-plugin";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

const shared = ["scope:shared"];

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/generated/**",
      "**/coverage/**",
      "Untitled/**",
      "e2e/playwright-report/**",
      "tools/dev/**",
    ],
  },
  {
    files: ["tools/**/*.mjs"],
    languageOptions: {
      globals: {
        console: "readonly",
        fetch: "readonly",
        process: "readonly",
        URL: "readonly",
      },
    },
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    plugins: {
      "@nx": nx,
    },
    rules: {
      "@nx/enforce-module-boundaries": [
        "error",
        {
          enforceBuildableLibDependency: false,
          allow: [],
          depConstraints: [
            { sourceTag: "type:app", onlyDependOnLibsWithTags: ["type:lib"] },
            { sourceTag: "type:lib", onlyDependOnLibsWithTags: ["type:lib"] },
            { sourceTag: "scope:shared", onlyDependOnLibsWithTags: shared },
            { sourceTag: "scope:marketing", onlyDependOnLibsWithTags: shared },
            { sourceTag: "scope:gateway", onlyDependOnLibsWithTags: shared },
            { sourceTag: "scope:auth", onlyDependOnLibsWithTags: shared },
            {
              sourceTag: "scope:commerce",
              onlyDependOnLibsWithTags: [...shared, "scope:commerce"],
            },
            { sourceTag: "scope:erp", onlyDependOnLibsWithTags: shared },
            { sourceTag: "scope:industrial", onlyDependOnLibsWithTags: shared },
            { sourceTag: "scope:streaming", onlyDependOnLibsWithTags: shared },
            { sourceTag: "scope:game", onlyDependOnLibsWithTags: shared },
            { sourceTag: "scope:chat", onlyDependOnLibsWithTags: shared },
            { sourceTag: "scope:realtime", onlyDependOnLibsWithTags: shared },
          ],
        },
      ],
    },
  },
  {
    files: ["**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "mongodb",
              message: "MongoDB stays in server libraries, not in components.",
            },
            {
              name: "redis",
              message: "Redis stays in server libraries, not in components.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["apps/marketing/**/*.ts", "apps/marketing/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@swiss/observability",
              message: "Marketing may import only @swiss/observability/browser.",
            },
            {
              name: "mongodb",
              message: "MongoDB stays in server libraries, not in components.",
            },
            {
              name: "redis",
              message: "Redis stays in server libraries, not in components.",
            },
          ],
        },
      ],
    },
  },
);
