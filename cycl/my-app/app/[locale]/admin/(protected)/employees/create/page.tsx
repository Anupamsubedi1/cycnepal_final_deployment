import { requireAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import CreateEmployeeForm from "@/components/admin/CreateEmployeeForm";

export default async function CreateEmployeePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await requireAdminSession();

  if (session.role !== "admin") {
    redirect(`/${locale}/admin/dahboard`);
  }

  return <CreateEmployeeForm />;
}
