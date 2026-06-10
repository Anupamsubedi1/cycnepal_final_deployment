import { redirect } from "next/navigation";
import AdminLoginForm from "./AdminLoginForm";
import { getAdminSessionFromRequestCookies } from "@/lib/admin-auth";

export default async function AdminLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getAdminSessionFromRequestCookies();

  if (session) {
    redirect(`/${locale}/admin/dahboard`);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 py-10">
      <AdminLoginForm />
    </main>
  );
}
