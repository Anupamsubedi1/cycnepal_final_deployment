"use client";

import PageHeroCard from "./PageHeroCard";
import { PageHeader } from "@/components/admin/ui";

interface Props {
  pageKey: string;
  pageLabel: string;
  publicPath: string;
  breadcrumb?: string;
  showSectionHeadings?: boolean;
}

export default function HeroSectionEditor({ pageKey, pageLabel, publicPath, breadcrumb, showSectionHeadings }: Props) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={pageLabel}
        description={breadcrumb}
        actions={<span className="font-mono text-[10px] text-slate-400">{publicPath}</span>}
      />
      <PageHeroCard pageKey={pageKey} showSectionHeadings={showSectionHeadings} />
      <p className="px-1 text-xs text-slate-400">
        Leave all fields blank to revert to the built-in default text and banner image.
      </p>
    </div>
  );
}
