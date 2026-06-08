# mikhailnarbekov.com

Personal AI-practitioner portfolio site. Astro + React, deployed to Azure Static Web Apps.

## Tech

- [Astro](https://astro.build) 6 — static-site builder
- React islands for interactive pieces (project carousel, system-diagram lightbox, easter-egg game)
- CSS custom properties for design tokens, no CSS framework
- Vite 7 as the build/dev server
- Azure Static Web Apps (Free tier) for hosting + global CDN + SSL

## Local development

```powershell
npm install
npm run dev
```

The dev server runs at `http://localhost:4321`. Use `npm run dev -- --host` to expose on your LAN for phone testing.

## Build

```powershell
npm run build
```

Outputs to `dist/`. The Azure Static Web Apps GitHub Action runs this on every push to `main`.

## Structure

```
src/
├── components/   # Astro and React components
├── features/     # feature-scoped components (easter-egg game)
├── layouts/      # page layouts
├── pages/        # routes (index.astro)
└── styles/       # design tokens, global CSS
public/           # static assets (images, fonts)
staticwebapp.config.json  # Azure SWA routing config
```

## Deployment

Pushes to `main` trigger the Azure Static Web Apps GitHub Action, which builds and deploys to https://mikhailnarbekov.com. Pull requests automatically get a preview environment URL.

## License

All rights reserved. This is a personal site; if you want to discuss the approach, reach out via the site's contact details.
