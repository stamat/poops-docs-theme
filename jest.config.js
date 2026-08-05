// ponytail: tsconfig kept inline, not a tsconfig.json — poops/esbuild reads a root
// tsconfig.json and would change the build. Add the real file only if src needs it.
export default {
  testEnvironment: 'jsdom',
  // One entry covering ts and js, not two: ts-jest builds a single TS program, and a second
  // transform with its own inline tsconfig ends up type-checking the test files without
  // `types`, which loses `test`, `jest` and `beforeAll`.
  //
  // `allowJs` is here because docs.ts imports `book-of-elementals`, which ships ES modules
  // and no CommonJS build — right for the browser, unreadable to a CJS jest.
  transform: {
    '^.+\\.(ts|m?js)$': ['ts-jest', {
      tsconfig: {
        allowJs: true,
        module: 'commonjs',
        target: 'es2019',
        lib: ['es2019', 'dom'],
        types: ['jest', 'node']
      }
    }]
  },
  // Empty, not a `(?!book-of-elementals)` negation: during local development the package is
  // a `file:` symlink, so it resolves to a real path with no `node_modules` segment to
  // match on. Transforming everything is the one rule that holds either way.
  transformIgnorePatterns: []
}
