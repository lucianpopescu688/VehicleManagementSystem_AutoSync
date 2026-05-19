import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import eslintConfigPrettier from 'eslint-config-prettier'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      {
        ...reactRefresh.configs.vite,
        rules: {
          ...reactRefresh.configs.vite.rules,
          // TanStack Router exports `Route` alongside components in route files
          'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
        },
      },
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // TanStack Router route files always export a `Route` constant alongside component
    // helper functions — fast-refresh can't reasonably be applied here.
    files: ['src/routes/**/*.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  eslintConfigPrettier
])