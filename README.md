# Muthukumar B — Portfolio

Minimalist, editorial portfolio with continuous ambient animation. Built with vanilla HTML, CSS and JS — no build step, deploy-ready for GitHub Pages.

## Structure

```
.
├── index.html              # Single-page site
├── css/style.css           # All styles + responsive
├── js/script.js            # Loader, reveals, cursor, magnetic, form
├── assets/                 # Drop your resume PDF here
└── .nojekyll               # Tells GitHub Pages to serve files as-is
```

## Sections

1. **Hero** — name, role, animated headline, status dot, "scroll" affordance.
2. **About** — bio + animated counters (years, projects).
3. **Expertise** — three cards: Salesforce / Graphic Design / VFX with skill tags.
4. **Journey** — timeline of the career arc.
5. **Freelance** — features the [Milir Threads](https://bmuthukumar206-ux.github.io/MilirThreads/) project.
6. **Contact** — enquiry form (opens email client pre-filled) + direct email, WhatsApp, location.
7. **Footer** — big type, social icons (LinkedIn, WhatsApp, Instagram, Mail).

## Personalize

Before publishing, update these placeholders:

| Where | What to change |
| --- | --- |
| `index.html` — `href="https://wa.me/919999999999"` (appears twice) | Your real WhatsApp number with country code |
| `index.html` — `href="https://instagram.com/"` | Your Instagram URL |
| `index.html` — `href="https://www.linkedin.com/in/bmuthukumar206"` | Verify your LinkedIn handle |
| `assets/` | Drop `Muthukumar-B-Resume.pdf` so the download button works |

## Run locally

Any static server works:

```powershell
# Python
python -m http.server 8000

# Or VS Code "Live Server" extension — right-click index.html → Open with Live Server
```

Then open <http://localhost:8000>.

## Deploy to GitHub Pages

```powershell
git add .
git commit -m "Initial portfolio"
git push origin main
```

Then in GitHub → Settings → Pages → Source: `main` branch, `/` root. Done.
