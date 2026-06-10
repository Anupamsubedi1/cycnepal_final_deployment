import type { ReactNode } from "react";
import VacancyShell from "@/components/vacancy/VacancyShell";

export default function VacanciesLayout({
  children,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  return <VacancyShell>{children}</VacancyShell>;
}