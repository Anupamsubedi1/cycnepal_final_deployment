export type EmployeePermission =
  | "home"
  | "about"
  | "loans"
  | "savings"
  | "financial_highlights"
  | "news_notices"
  | "branches"
  | "vacancies"
  | "marquee"
  | "footer"
  | "contact";

export const ALL_PERMISSIONS: { key: EmployeePermission; label: string }[] = [
  { key: "home", label: "Home" },
  { key: "about", label: "About Us" },
  { key: "loans", label: "Loans" },
  { key: "savings", label: "Savings" },
  { key: "financial_highlights", label: "Financial Highlights" },
  { key: "news_notices", label: "News & Notices" },
  { key: "branches", label: "Branches" },
  { key: "vacancies", label: "Vacancies" },
  { key: "marquee", label: "Marquee" },
  { key: "footer", label: "Footer" },
  { key: "contact", label: "Contact" },
];

export interface EmployeePublic {
  _id: string;
  fullName: string;
  email: string;
  permissions: EmployeePermission[];
  createdAt: Date;
}
