import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Lazily imported chunks normally start downloading only after the entry chunk has run.
 * This injects a low-priority modulepreload for them, so the download starts right away
 * without competing with the entry chunk for bandwidth.
 */
function preloadLazyChunks(moduleSuffixes: string[]): Plugin {
  return {
    name: 'preload-lazy-chunks',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const bundle = ctx.bundle;
        if (!bundle) return [];
        const fileNames = Object.values(bundle)
          .filter(
            (output) =>
              output.type === 'chunk' &&
              output.isDynamicEntry &&
              moduleSuffixes.some((suffix) => output.facadeModuleId?.endsWith(suffix))
          )
          .flatMap((chunk) => (chunk.type === 'chunk' ? [chunk.fileName, ...chunk.imports] : []))
          // The entry chunk is already requested by its <script>; a low-priority preload would only slow it
          .filter((fileName) => {
            const output = bundle[fileName];
            return !(output?.type === 'chunk' && output.isEntry);
          });
        return [...new Set(fileNames)].map((fileName) => ({
            tag: 'link',
            attrs: { rel: 'modulepreload', href: `/${fileName}`, fetchpriority: 'low' },
            injectTo: 'head' as const,
          }))
      },
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    preloadLazyChunks(['src/components/3d/GameCanvas.tsx'])
  ],
  server: {
    port: 4567
  },
  // Dependencies reached only through lazy imports are otherwise discovered mid-session, which makes the
  // dev server re-bundle them and fail the in-flight dynamic import ("Failed to fetch dynamically imported module")
  optimizeDeps: {
    include: ['postprocessing', '@react-three/postprocessing', 'canvas-confetti']
  }
})
