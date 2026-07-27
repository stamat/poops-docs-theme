// ponytail: tsconfig kept inline, not a tsconfig.json — poops/esbuild reads a root
// tsconfig.json and would change the build. Add the real file only if src needs it.
export default {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        target: 'es2019',
        lib: ['es2019', 'dom'],
        types: ['jest', 'node']
      }
    }]
  }
}
