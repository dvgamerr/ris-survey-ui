import { defineConfig } from 'astro/config'
import node from '@astrojs/node'
import preact from '@astrojs/preact'

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [preact()],
  server: { port: Number(process.env.PORT || 3000), host: true },
  // CSRF is checked in src/middleware.ts (host-based, so it also works behind a TLS-terminating proxy)
  security: { checkOrigin: false }
})
