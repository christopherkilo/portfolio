# Premium Developer Portfolio

Production-ready portfolio built with Next.js (App Router), TypeScript, Tailwind CSS, Framer Motion, and Lucide React.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build
npm start
```

## Customize

| What | Where |
| --- | --- |
| Name, links, tagline | `lib/constants.ts` |
| Projects (9 placeholders) | `lib/projectData.ts` |
| Motion tokens | `lib/animation.ts` |
| Theme colors | `app/globals.css` |
| Project images | `public/projects/` |
| Resume PDF | `public/resume.pdf` |

## Pages

- `/` — Home (hero, featured project, carousels, lab, about, contact)
- `/projects` — Full project grid by category
- `/lab` — IT case studies + troubleshooting demo
- `/about` — Roles and biography placeholders
- `/contact` — Links + contact form

## Features

- Sticky nav + animated mobile menu
- Command palette (`⌘K` / `Ctrl+K`)
- Scroll progress bar
- Blueprint background with subtle motion
- Drag / snap / autoplay project carousels
- 3D tilt project cards with gradient borders
- Interactive troubleshooting decision tree
- Reduced-motion support, focus states, semantic HTML
