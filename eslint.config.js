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
  },
  {
    // `script/a11y` named by its exact path, because eslint globs by extension and this one is
    // an entry point in `script/`, where everything is called by its bare name - and given both
    // sets of globals, because half of it is closures handed to `page.evaluate`, which run in
    // the page rather than in node. Here rather than in a `/* global */` comment at the top of
    // the file: that one cannot say *where* in the file a browser global is legitimate either,
    // but it does say it in the file that would then be lying about what it runs in.
    files: ['script/a11y'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { console: 'readonly', process: 'readonly', window: 'readonly', document: 'readonly' }
    }
  }
]
