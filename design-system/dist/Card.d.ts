export interface CardProps {
    /** Optional card heading in deep ocean blue. */
    title?: string;
    /** Card body. */
    children: React.ReactNode;
    /** Sunset-orange border for attention (used for the "someone's asking" card). */
    highlight?: boolean;
}
/**
 * Plain white rounded card on the sand background — the workhorse container
 * in Dave's app.
 */
export declare function Card({ title, children, highlight }: CardProps): import("react").JSX.Element;
