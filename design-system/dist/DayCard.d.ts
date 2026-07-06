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
export declare function DayCard({ day, time, closed, today }: DayCardProps): import("react").JSX.Element;
