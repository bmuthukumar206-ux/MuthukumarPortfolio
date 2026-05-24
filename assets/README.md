# Assets

Save these two files in this folder for the site to display fully:

| Filename | What it is |
| --- | --- |
| `Muthukumar-B-Resume.pdf` | Your résumé — wired to the "Resume" button in the header & mobile menu. |
| `profile.jpg` | Your professional portrait — appears in the About section. Square or 4:5 portrait works best. JPG or PNG is fine; if PNG, rename references in `index.html` accordingly. |

## Photo tips

The CSS already applies professional treatment automatically — contrast lift, gentle saturation pull, subtle vignette, soft shadow, and a small editorial tilt that straightens on hover. **Your face is not modified.** Just save the photo as `profile.jpg`.

If the photo looks too dark or warm after the CSS treatment, tweak the filter values in [css/style.css](../css/style.css) — search for `.portrait__frame img` and adjust the `filter:` line.

While `profile.jpg` is missing, the site gracefully shows a "M·B" monogram in its place.
