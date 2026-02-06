import { defineConfig } from 'tsup'
import { copyFileSync } from 'fs'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'adapters/claude': 'src/adapters/claude.ts',
    'adapters/openai': 'src/adapters/openai.ts',
    'adapters/bedrock': 'src/adapters/bedrock.ts',
    'adapters/openrouter': 'src/adapters/openrouter.ts',
    'adapters/ollama': 'src/adapters/ollama.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    '@aws-sdk/client-bedrock-runtime',
    '@aws-sdk/client-bedrock',
  ],
  treeshake: true,
  onSuccess: async () => {
    // Copy the CSS file to dist
    copyFileSync('src/styles.css', 'dist/styles.css')
  },
})
