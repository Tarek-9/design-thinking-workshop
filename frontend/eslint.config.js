import js from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'storybook-static/**',
      'public/mockServiceWorker.js',
    ],
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

      // `no-magic-numbers` misses a number written directly as a JSX prop
      // value (`offset={4}`), which the parser reads as a prop, not a literal
      // expression. This selector closes that gap.
      //
      // Design tokens live in CSS. An inline style bypasses the token layer
      // and cannot be linted for literal values (see README.md). The
      // exceptions are the same lists as for `no-magic-numbers` above.
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='style']",
          message:
            'Use a CSS module and design tokens instead of an inline style.',
        },
        {
          selector: 'JSXExpressionContainer > Literal[value>1]',
          message:
            'A literal number in JSX is a named constant (see docs/CODE_STANDARDS.md).',
        },
      ],

      // A default export makes a component harder to find by name and lets the
      // same component be imported under different names.
      'no-restricted-exports': [
        'error',
        { restrictDefaultExports: { direct: true } },
      ],
    },
  },

  /**
   * The UI layer must not know the domain. It receives finished strings as
   * props, which is what keeps it reusable by the English staff dashboard and
   * what matches the Figma component boundary (DESIGN.md section 45).
   */
  {
    files: ['src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/content/*', '**/features/*', '**/features/**'],
              message:
                'A UI component must not import copy or domain code. Pass finished strings in as props.',
            },
          ],
        },
      ],
    },
  },

  /** Tests may assert on internals and use non-null assertions. Test data and
     MSW handlers spell out literal values on purpose, so a reader sees the
     status or length the test expects. */
  {
    files: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/mocks/**'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-magic-numbers': 'off',
    },
  },

  /* Storybook metadata is the documented exception to named exports. */
  {
    files: ['src/**/*.stories.{ts,tsx}'],
    rules: {
      'no-restricted-exports': 'off',
      'no-restricted-imports': 'off',
    },
  },

  /* Vite and Vitest resolve their config from a default export. */
  {
    files: ['vite.config.ts'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      'no-restricted-exports': 'off',
    },
  },

  /* Storybook's config is compiled separately and stays outside src/. */
  {
    files: ['.storybook/**/*.{ts,tsx}'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      'no-restricted-exports': 'off',
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
