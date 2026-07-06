export interface DayCardProps {
  /** Day label, e.g. `"Mon"`. */
  day: string;
  /** Hours text, e.g. `"12pm–5pm"`. Ignored when `closed`. */
  time?: string;
  /** Marks the day closed (chalk-pink "Closed"). */
  closed?: boolean;
  /** Highlights today with a sunset outline. */
  today?: boolean;
}

/**
 * Mini chalkboard tile for one day's hours. Usually rendered in a
 * `HoursGrid`.
 */
export function DayCard({ day, time, closed, today }: DayCardProps) {
  const cls = ["st-day-card", today && "st-day-card--today", closed && "st-day-card--closed"]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={cls}>
      <div className="st-day-card__day">{day}</div>
      <div className="st-day-card__time">{closed ? "Closed" : time}</div>
    </div>
  );
}
