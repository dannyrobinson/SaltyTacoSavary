export interface ExtensionBannerProps {
  /** Time the truck stays open until, e.g. `"6:30pm"`. */
  until: string;
  /** Custom message; defaults to the good-news line with `until` interpolated. */
  children?: React.ReactNode;
}

/**
 * Chalk-green good-news banner shown when Dave extends the hours:
 * "🌮 Good news — Dave is staying open until 6:30pm today!"
 */
export function ExtensionBanner({ until, children }: ExtensionBannerProps) {
  return (
    <div className="st-banner">
      {children ?? `🌮 Good news — Dave is staying open until ${until} today!`}
    </div>
  );
}
