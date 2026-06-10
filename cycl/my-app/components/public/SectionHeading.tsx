import React from "react";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <div className="mb-7 sm:mb-8">
      {eyebrow && (
        <div className="mb-3 inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em] text-teal-deep">
          <span className="h-0.5 w-9 bg-[#f5ad4a]" aria-hidden="true" />
          {eyebrow}
          <span className="h-0.5 w-9 bg-[#f5ad4a]" aria-hidden="true" />
        </div>
      )}

      <h2 className="text-3xl font-bold leading-tight text-[#123451] md:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
          {description}
        </p>
      )}
    </div>
  );
}
