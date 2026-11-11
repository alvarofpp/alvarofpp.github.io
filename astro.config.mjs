import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://alvarofpp.github.io",
  i18n: {
    // ponytail: en only for now; add "pt-br" here + src/i18n/pt-br.ts when translating
    locales: ["en"],
    defaultLocale: "en",
  },
  server: { host: true, allowedHosts: true },
  vite: {
    server: {
      // In dev the browser reaches us through the shared Traefik on :80, not :4321
      ws: process.env.HMR_CLIENT_PORT
        ? { clientPort: Number(process.env.HMR_CLIENT_PORT) }
        : undefined,
    },
  },
});
