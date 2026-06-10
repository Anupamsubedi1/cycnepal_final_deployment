import React from "react";

type CardVariant = "default" | "highlighted" | "compact";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  /** Tailwind border color class for the highlighted left border, e.g. "border-l-blue-600". */
  accentClass?: string;
  children: React.ReactNode;
}

const baseClass =
  "bg-white rounded-xl border border-gray-200 shadow-sm";

const variantClass: Record<CardVariant, string> = {
  default: "p-6",
  highlighted: "p-6 border-l-4",
  compact: "p-4",
};

/**
 * Consistent card surface: white background, rounded-xl, subtle shadow + border.
 * - `default`   — standard padded card
 * - `highlighted` — adds a colored left border (set `accentClass`)
 * - `compact`   — tighter padding
 */
export default function Card({
  variant = "default",
  accentClass = "border-l-blue-600",
  className = "",
  children,
  ...rest
}: CardProps): React.JSX.Element {
  const highlight = variant === "highlighted" ? accentClass : "";
  return (
    <div className={`${baseClass} ${variantClass[variant]} ${highlight} ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}
