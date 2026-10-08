# Station Coverage Map

A single-page map of Europe that colours each country by its station coverage percentage, from orange (0%) to purple (100%). It has two pages, switched with the tabs at the top:

- **Map** (`#map`): the coloured map with the exact percentage on every country, the Grand Total, the colour scale, and a full list of all rows. At desktop full-screen size everything fits on one screen with no scrolling.
- **Edit** (`#edit`): change the title, subtitle, total, every percentage, the two end colours and their legend labels. You can also add or remove rows, choose which map shape each row colours, or paste a new CSV to replace all the data.

Edits are saved in the browser's `localStorage`, so they are per-browser. To change the data for everyone, edit the `DEFAULTS` block in `src/template.html` and rebuild.

## Run it

`index.html` is self-contained (only Google Fonts loads from the web). Open it in a browser, or publish it with GitHub Pages:

1. Create an empty repository on GitHub.
2. In this folder:
   ```bash
   git remote add origin https://github.com/<you>/station-coverage-map.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Deploy from a branch → `main` / root**.

## Data

`data/BookSheet1.csv` is the original source: first line is the header, last line is the Grand Total.

| Row | Map shape |
|---|---|
| United Kingdom (100%) | United Kingdom (whole UK, Northern Ireland included) |
| UK Domestic (96.83%) | Not drawn; listed with a dashed swatch |
| Northern Ireland | Removed from the map data (part of United Kingdom); still in the original CSV |
| All other countries | Their own country |

To load new numbers without touching code, open the Edit page and paste a CSV in the same format (`Country,Value%`, with an optional `Grand Total` row).

## Project layout

```
index.html                 built page (open or deploy this)
src/template.html          page source: HTML, CSS, JS and default data
src/shapes.json            pre-projected country outlines (SVG paths)
scripts/build-page.mjs     template + shapes -> index.html
scripts/build-shapes.mjs   Natural Earth GeoJSON -> src/shapes.json
data/BookSheet1.csv        original data
```

## Rebuild

```bash
npm install
npm run build        # after editing src/template.html
```

To regenerate the country outlines, download `ne_50m_admin_0_map_units.geojson` from [Natural Earth](https://github.com/nvkelso/natural-earth-vector/tree/master/geojson) and run:

```bash
npm run shapes -- ne_50m_admin_0_map_units.geojson
npm run build
```

Map data: [Natural Earth](https://www.naturalearthdata.com/) (public domain).
