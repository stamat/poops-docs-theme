import js from '@eslint/js'
import ts from 'typescript-eslint'

export default [
  { ignores: ['dist/**', 'preview/dist/**', 'node_modules/**'] },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off'
    }
  }
]
