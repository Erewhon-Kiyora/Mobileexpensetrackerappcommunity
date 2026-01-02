// eslint.config.mjs
import js from "@eslint/js";
import ts from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import reactPlugin from "eslint-plugin-react";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: ts,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },

    plugins: {
      "@typescript-eslint": tsPlugin,
      react: reactPlugin,
    },

    rules: {
      // ----- React 规则 -----
      ...reactPlugin.configs.recommended.rules,

      // ----- TypeScript 规则 -----
      ...tsPlugin.configs.recommended.rules,

      // 关闭与 TS 重复的 no-undef
      "no-undef": "off",

      // 自定义规则
      semi: "error",
      "no-unused-vars": "warn",
    },
  },
];
