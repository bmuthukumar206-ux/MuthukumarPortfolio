# Assets

Save these files in this folder for the site to display fully:

| Filename | What it is |
| --- | --- |
| **`media.jpg`** | Your portrait — appears as the centerpiece of the hero between MUTHU / KUMAR. **Required.** |
| `Muthukumar-B-Resume.pdf` | Your résumé — wired to the **Resume** button in the header & mobile menu. |

## Saving your photo

1. Right-click the polished portrait you sent in chat → **Save image as…**
2. In the save dialog, name it exactly: `media.jpg`
3. Save it into this folder: `d:\MuthukumarPortfolio\MuthukumarPortfolio\assets\`
4. If Windows saves it as `media.jfif`, just rename the extension to `.jpg` (View → File name extensions in Explorer if you can't see it).
5. Refresh the browser — the hero will pick it up immediately.

While `media.jpg` is missing, the hero gracefully shows an **M·B** monogram on a deep gradient in its place.

## How the photo is treated

The hero portrait frame is tuned for a **pre-edited dark-background portrait** like the one you sent:

- Frame background is a deep radial gradient — visually continues the photo's own dark backdrop, so the edges feel seamless instead of "cut out."
- CSS filter is intentionally **gentle** (`contrast 1.03 · brightness 1.02 · saturate 1.02`) — the photo is already polished; we don't want to over-process it.
- Slow vertical float animation (~6s), tiny scale + filter boost on hover.
- Soft fade at the bottom edge blends into the page.
- **No face modification** — only frame, filter, shadow and animation in pure CSS.

If you swap in a different photo later (e.g. lighter background, candid), bump the filter values up in [css/style.css](../css/style.css) — search for `.hero__portrait img`.
