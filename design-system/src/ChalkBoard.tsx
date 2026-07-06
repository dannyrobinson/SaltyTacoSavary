export interface ChalkBoardProps {
  /** Board title, chalk-underlined with a wavy teal line, e.g. "Tacos". */
  title?: string;
  /** Board contents — usually a `<ul>` of `ChalkMenuItem`s. */
  children: React.ReactNode;
  /** Hand-written flourish at the bottom, e.g. "DELICIOUS!!!". */
  flourish?: string;
}

/**
 * Wood-framed chalkboard panel, the Salty Taco menu idiom. Compose with
 * `ChalkMenuItem` rows inside a `<ul>`.
 */
export function ChalkBoard({ title, children, flourish }: ChalkBoardProps) {
  return (
    <div className="st-board">
      {title && <h3 className="st-board__title">{title}</h3>}
      {children}
      {flourish && <p className="st-board__flourish">{flourish}</p>}
    </div>
  );
}
