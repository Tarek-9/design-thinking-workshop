import js from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/**', 'coverage/**'],
  },

  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  jsxA11y.flatConfigs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      ...reactHooks.configs['recommended-latest'].rules,
      ...reactRefresh.configs.vite.rules,

      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      // A literal number is a named constant (see docs/CODE_STANDARDS.md).
      '@typescript-eslint/no-magic-numbers': [
        'error',
        {
          ignore: [-1, 0, 1],
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
          enforceConst: true,
          detectObjects: true,
        },
      ],
    },
  },

  /* Third-party component code copied in from Untitled UI (see
     THIRD_PARTY_LICENSES). We keep it close to upstream so it stays easy to
     re-sync, so its house style is exempt from our stricter rules rather than
     rewritten. Code we author ourselves is not covered here. */
  {
    files: [
      'src/components/application/pagination/**',
      'src/components/application/table/table.tsx',
      'src/components/base/**',
      'src/components/foundations/dot-icon.tsx',
      'src/hooks/use-breakpoint.ts',
      'src/utils/is-react-component.ts',
    ],
    rules: {
      '@typescript-eslint/no-deprecated': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-magic-numbers': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/no-interactive-element-to-noninteractive-role': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },

  /** Tests may assert on internals and use non-null assertions. Fixtures and
     test helpers spell out literal values on purpose, so a test reads as the
     data it runs against. */
  {
    files: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/data/**'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-magic-numbers': 'off',
    },
  },

  /* Vite and Vitest resolve their config from a default export. */
  {
    files: ['vite.config.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },

  /* Typed linting needs a TypeScript program, which plain JS config files are
     not part of. */
  {
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      globals: globals.node,
    },
  },
);
