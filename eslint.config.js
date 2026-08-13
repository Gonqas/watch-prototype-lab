import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    'dist/**',
    'build/**',
    'tmp/**',
    '.venv-cad/**',
    'cad-engine/.pytest_cache/**',
    'cad-engine/build/**',
    'cad-engine/dist/**',
    'src-tauri/target/**',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['scripts/**/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
])
