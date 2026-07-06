import { OpenBadge } from "@saltytaco/design-system";

export const Open = () => <OpenBadge open until="5pm" />;

export const Closed = () => <OpenBadge open={false} />;

export const CustomLabel = () => <OpenBadge open>Open late tonight — until 8pm!</OpenBadge>;
