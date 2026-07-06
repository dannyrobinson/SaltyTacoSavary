export interface ChalkMenuItemProps {
  /** Item name, written in coloured chalk. */
  name: string;
  /** Price string, e.g. `"$25"` or `"$18 / 2 for $30"`. */
  price: string;
  /** Chalk colour for the name. Default `yellow`. */
  chalk?: "pink" | "blue" | "yellow" | "green" | "orange";
  /** Optional smaller italic description line under the item. */
  description?: string;
}

/**
 * One menu line on a ChalkBoard: coloured chalk name, dotted leader, price,
 * optional description. Render inside a `<ul>` within `ChalkBoard`.
 */
export function ChalkMenuItem({ name, price, chalk = "yellow", description }: ChalkMenuItemProps) {
  return (
    <>
      <li className="st-menu-item">
        <span className={`st-menu-item__name st-chalk--${chalk}`}>{name}</span>
        <span className="st-menu-item__dots" />
        <span className="st-menu-item__price">{price}</span>
      </li>
      {description && <li className="st-menu-item__desc">{description}</li>}
    </>
  );
}
