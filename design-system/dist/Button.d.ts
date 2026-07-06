import type { ButtonHTMLAttributes } from "react";
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    /** Visual style: `primary` sunset-orange call to action, `secondary` ocean blue, `yes` green confirm, `no` red decline. Default `primary`. */
    variant?: "primary" | "secondary" | "yes" | "no";
    /** Button size. Default `md`; use `lg` for hero calls to action like "Are you still open?". */
    size?: "md" | "lg";
}
/**
 * Pill-shaped brush-script button in the Salty Taco palette. The `primary`
 * sunset gradient is the site's main call to action; `yes`/`no` pair for
 * confirm/decline flows in Dave's app.
 */
export declare function Button({ variant, size, className, ...rest }: ButtonProps): import("react").JSX.Element;
