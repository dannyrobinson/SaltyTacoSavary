import { Button } from "@saltytaco/design-system";

export const Primary = () => <Button variant="primary" size="lg">Are you still open?</Button>;

export const Variants = () => (
  <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
    <Button variant="primary">Order tacos</Button>
    <Button variant="secondary">See the menu</Button>
    <Button variant="yes">Yes</Button>
    <Button variant="no">No</Button>
  </div>
);

export const Sizes = () => (
  <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
    <Button size="md">Save hours</Button>
    <Button size="lg">Are you still open?</Button>
  </div>
);

export const Disabled = () => <Button disabled>Asking Dave…</Button>;
