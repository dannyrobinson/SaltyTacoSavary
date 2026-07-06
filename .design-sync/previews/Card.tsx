import { Button, Card } from "@saltytaco/design-system";

export const Basic = () => (
  <Card title="Weekly hours">
    <p style={{ margin: 0 }}>The truck is at the beach 12–5 every day.</p>
  </Card>
);

export const Highlighted = () => (
  <Card title="🌮 Someone's asking:" highlight>
    <p style={{ fontSize: "1.3rem", fontWeight: 700, margin: "0 0 .8rem" }}>"Are you still open?"</p>
    <div style={{ display: "flex", gap: ".8rem" }}>
      <Button variant="yes">Yes</Button>
      <Button variant="no">No</Button>
    </div>
  </Card>
);
