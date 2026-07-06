import { ExtensionBanner } from "@saltytaco/design-system";

export const GoodNews = () => <ExtensionBanner until="6:30pm" />;

export const CustomMessage = () => (
  <ExtensionBanner until="8pm">🌮 Beach bonfire special — tacos until 8pm tonight!</ExtensionBanner>
);
