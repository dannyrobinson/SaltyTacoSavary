import { DayCard } from "@saltytaco/design-system";

// In the wild a DayCard is a ~130px tile inside HoursGrid — constrain the solo renders.
const Tile = ({ children }: { children: React.ReactNode }) => (
  <div style={{ maxWidth: 130 }}>{children}</div>
);

export const Open = () => (
  <Tile><DayCard day="Sat" time="12pm–5pm" /></Tile>
);

export const Today = () => (
  <Tile><DayCard day="Mon" time="12pm–5pm" today /></Tile>
);

export const Closed = () => (
  <Tile><DayCard day="Tue" closed /></Tile>
);
