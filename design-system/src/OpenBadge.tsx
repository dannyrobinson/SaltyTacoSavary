export interface OpenBadgeProps {
  /** Whether the truck is currently open. */
  open: boolean;
  /** Closing time shown when open, e.g. `"5pm"`. */
  until?: string;
  /** Override the label entirely (otherwise derived from `open`/`until`). */
  children?: React.ReactNode;
}

/**
 * Pill status badge: chalk-green "Open now — until 5pm" or chalk-pink
 * "Closed right now". Sits under the hero title on the public site.
 */
export function OpenBadge({ open, until, children }: OpenBadgeProps) {
  const label = children ?? (open ? `Open now${until ? ` — until ${until}` : ""}` : "Closed right now");
  return <span className={`st-badge${open ? "" : " st-badge--closed"}`}>{label}</span>;
}
