export interface HoursGridProps {
  /** DayCard children (typically seven). */
  children: React.ReactNode;
}

/**
 * Responsive grid of DayCards — the week's hours at a glance.
 */
export function HoursGrid({ children }: HoursGridProps) {
  return <div className="st-hours-grid">{children}</div>;
}
