import { defineConfig } from 'eslint/config'
import tseslint from '@electron-toolkit/eslint-config-ts'
import eslintConfigPrettier from '@electron-toolkit/eslint-config-prettier'
import eslintPluginReact from 'eslint-plugin-react'
import eslintPluginReactHooks from 'eslint-plugin-react-hooks'
import eslintPluginReactRefresh from 'eslint-plugin-react-refresh'

export default defineConfig(
  { ignores: ['**/node_modules', '**/dist', '**/out'] },
  tseslint.configs.recommended,
  eslintPluginReact.configs.flat.recommended,
  eslintPluginReact.configs.flat['jsx-runtime'],
  {
    settings: {
      react: {
        version: 'detect'
      }
    }
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': eslintPluginReactHooks,
      'react-refresh': eslintPluginReactRefresh
    },
    rules: {
      ...eslintPluginReactHooks.configs.recommended.rules,
      ...eslintPluginReactRefresh.configs.vite.rules,
      // Relax overly strict rules for boilerplate
      '@typescript-eslint/explicit-function-return-type': 'off',
      // setState in effects is fine for initialization and queue processing
      'react-hooks/set-state-in-effect': 'off',
      // Self-referencing callbacks are valid for reconnection patterns
      'react-hooks/immutability': 'off'
    }
  },
  // Overlay entry points don't export (they call createRoot directly)
  {
    files: ['src/overlays/src/*.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off'
    }
  },
  // Context files export both components and hooks
  {
    files: ['src/renderer/src/contexts/*.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off'
    }
  },
  eslintConfigPrettier
)
