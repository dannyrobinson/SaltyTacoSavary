export interface SectionHeadingProps {
  /** Heading text, e.g. "Menu", "Hours", "Photos". */
  children: React.ReactNode;
}

/**
 * Brush-script ocean-blue section heading with a sunset-to-wave gradient
 * underline. Use one per page section.
 */
export function SectionHeading({ children }: SectionHeadingProps) {
  return <h2 className="st-heading">{children}</h2>;
}
