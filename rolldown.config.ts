export default {
  input: './.build/index.js',
  output: [{ dir: 'dist', format: 'es', sourcemap: true }],
  external: ['class-transformer', 'class-validator', 'reflect-metadata']
}
