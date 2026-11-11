# alvarofpp.github.io

Portfolio and online resume — [alvarofpp.github.io](https://alvarofpp.github.io). Astro, static, deployed to
GitHub Pages by `.github/workflows/deploy.yml` on every push to `main`.

## Where things live

| What | Where |
|---|---|
| Resume + open-source projects | `src/data/*.yaml` — **generated**. Source of truth is the private `resume` repo: edit there, then `task site:sync` there. |
| Case studies (`/work/<slug>`) | `src/content/work/*.md` — one file per achievement; `order` sets position on the home page; `highlights` lists the start of each resume bullet that should link to the post |
| UI copy | `src/i18n/en.ts` (a `pt-br.ts` with the same keys comes later) |
| Design tokens | `src/styles/global.css` (`:root`) |

## Dev

```bash
task dev:up     # http://site.alvarofpp-github-io.localhost (shared Traefik, no published ports)
task dev:down
task build      # same static build the CI publishes, into dist/
```
