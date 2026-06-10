import { requireAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import EmployeeManagement from "@/components/admin/EmployeeManagement";

export default async function EmployeesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await requireAdminSession();

  if (session.role !== "admin") {
    redirect(`/${locale}/admin/dahboard`);
  }

  return <EmployeeManagement />;
}
