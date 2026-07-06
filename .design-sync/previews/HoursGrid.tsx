import { DayCard, HoursGrid } from "@saltytaco/design-system";

export const Week = () => (
  <HoursGrid>
    <DayCard day="Sun" time="12pm–5pm" />
    <DayCard day="Mon" time="12pm–5pm" today />
    <DayCard day="Tue" closed />
    <DayCard day="Wed" time="12pm–5pm" />
    <DayCard day="Thu" time="12pm–5pm" />
    <DayCard day="Fri" time="12pm–8pm" />
    <DayCard day="Sat" time="12pm–8pm" />
  </HoursGrid>
);
