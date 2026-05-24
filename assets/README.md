# Assets

Save these two files in this folder for the site to display fully:

| Filename | What it is |
| --- | --- |
| `media.jpg` | Your portrait — appears as the centerpiece of the hero. JPG, PNG or JFIF all work; if your file is `.jfif` (Windows default for some JPEGs) just rename the extension to `.jpg`. |
| `Muthukumar-B-Resume.pdf` | Your résumé — wired to the **Resume** button in the header & mobile menu. |

## Photo tips

The CSS already applies professional treatment automatically — contrast lift (×1.12), slight brightness, gentle saturation pull, soft top vignette, drop shadow and a subtle floating animation. **Your face is not modified.** Just save the photo as `media.jpg`.

For the cleanest "cut-through-the-text" look (where the giant MUTHU / KUMAR letters appear to wrap around you), a **background-removed PNG** works best — use [remove.bg](https://www.remove.bg/) for free, save as `media.png`, then update the `src="assets/media.jpg"` reference in [index.html](../index.html) to `media.png`. The photo as-is will still look great in its frame — this is only for the most editorial finish.

If the photo looks too dark or warm after the CSS treatment, tweak the filter values in [css/style.css](../css/style.css) — search for `.hero__portrait img` and adjust the `filter:` line.

While `media.jpg` is missing, the site gracefully shows an **M·B** monogram in its place.
