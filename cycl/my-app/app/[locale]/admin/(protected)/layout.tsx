import { ReactNode } from "react";
import { requireAdminSession } from "@/lib/admin-auth";
import AdminShell from "@/components/admin/AdminShell";
import { AdminSessionProvider } from "@/lib/admin-context";
import PermissionGate from "@/components/admin/PermissionGate";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireAdminSession();

  const isAdmin = session.role === "admin";
  const permissions = session.permissions;

  return (
    <AdminSessionProvider value={{ isAdmin, permissions, email: session.email }}>
      <AdminShell isAdmin={isAdmin} permissions={permissions} email={session.email}>
        <PermissionGate>{children}</PermissionGate>
      </AdminShell>
    </AdminSessionProvider>
  );
}
