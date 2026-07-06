# The Salty Taco — build conventions

Beach-shack taco truck brand: ocean blue, sunset orange, chalkboard menus, brush-script display type. No provider or wrapper is needed — components style themselves from `styles.css` (make sure it's loaded; tokens are defined in it).

## Styling idiom

Use the components for controls and surfaces; style your own layout glue with **inline styles or your own classes referencing the `--st-*` tokens** — do not invent `st-*` classes (that prefix belongs to the shipped stylesheet).

Core tokens (all defined in `styles.css` / `tokens/`):

- Color: `--st-ocean` #1656a7, `--st-ocean-deep`, `--st-wave` (teal), `--st-sunset`, `--st-sunset-deep`, `--st-sunshine`, `--st-sand` (page background — use it on `body`), `--st-chalkboard`, `--st-wood`, `--st-white`, `--st-green`, `--st-red`, and chalk accents `--st-chalk-pink|blue|yellow|green|orange`
- Type: `--st-font-display` (brush script — headings/buttons), `--st-font-body` (Georgia serif — prose), `--st-font-ui` (system sans — app UI like Card contents)
- Shape/elevation: `--st-radius-card|board|pill`, `--st-shadow-card|pop|board`
- Spacing: `--st-space-xs|sm|md|lg|xl`

Pages are sand-coloured (`background: var(--st-sand)`), headings ocean blue.

## Component map

- `SectionHeading` — one per page section ("Menu", "Hours").
- `ChalkBoard` + `ChalkMenuItem` — the menu idiom. Items go inside a `<ul>` inside the board; `ChalkMenuItem` is illegible outside a `ChalkBoard`. Vary `chalk` colours across items.
- `HoursGrid` + `DayCard` — weekly hours. A solo `DayCard` should be width-constrained (~130px).
- `OpenBadge` (open/closed pill), `ExtensionBanner` (green good-news strip), `Button` (`primary` CTA, `secondary`, `yes`/`no` pair), `Card` (white admin-style container; `highlight` for attention).

## Idiomatic example

```jsx
const { SectionHeading, ChalkBoard, ChalkMenuItem, OpenBadge } = window.SaltyTacoDS;

<div style={{ background: "var(--st-sand)", padding: "var(--st-space-xl)" }}>
  <SectionHeading>Menu</SectionHeading>
  <OpenBadge open until="5pm" />
  <ChalkBoard title="Tacos" flourish="DELICIOUS!!!">
    <ul>
      <ChalkMenuItem name="Beef Taco" price="$25" chalk="orange"
        description='1 × 10" flour tortilla, cheese, lettuce, chipotle sauce' />
      <ChalkMenuItem name="Fish Tacos" price="$18 / 2 for $30" chalk="blue" />
    </ul>
  </ChalkBoard>
</div>
```

Before styling anything custom, read `styles.css` for the real token values and the shipped class definitions.
