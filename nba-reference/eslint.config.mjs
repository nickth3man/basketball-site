import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier/flat';

const eslintConfig = defineConfig([
  {
    name: 'ignore-eslint-config',
    ignores: ['eslint.config.mjs'],
  },
  ...nextVitals,
  ...nextTs,
  // TypeScript strict type-checked rules
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Strict naming conventions
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'forbid',
        },
        {
          selector: 'function',
          format: ['camelCase', 'PascalCase'],
        },
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
      ],
      // Strict boolean expressions
      '@typescript-eslint/strict-boolean-expressions': 'error',
      // No floating promises
      '@typescript-eslint/no-floating-promises': 'error',
      // Require explicit return types on exported functions
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
        },
      ],
      // No explicit any
      '@typescript-eslint/no-explicit-any': 'error',
      // Prefer nullish coalescing
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      // Prefer optional chaining
      '@typescript-eslint/prefer-optional-chain': 'error',
      // No non-null assertions
      '@typescript-eslint/no-non-null-assertion': 'error',
      // Consistent type imports
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports',
        },
      ],
      // No unused vars
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      // Prefer readonly
      '@typescript-eslint/prefer-readonly': 'error',
      // No shadow
      '@typescript-eslint/no-shadow': 'error',
      // Restrict plus operands
      '@typescript-eslint/restrict-plus-operands': 'error',
      // Restrict template expressions
      '@typescript-eslint/restrict-template-expressions': 'error',
    },
  },
  // Prettier must be last to disable conflicting rules
  prettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
]);

export default eslintConfig;
