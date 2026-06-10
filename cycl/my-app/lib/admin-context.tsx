"use client";

import { createContext, useContext } from "react";

export type AdminSessionContext = {
  isAdmin: boolean;
  permissions: string[];
  email: string;
};

const AdminSessionCtx = createContext<AdminSessionContext>({
  isAdmin: true,
  permissions: [],
  email: "",
});

export function AdminSessionProvider({
  value,
  children,
}: {
  value: AdminSessionContext;
  children: React.ReactNode;
}) {
  return <AdminSessionCtx.Provider value={value}>{children}</AdminSessionCtx.Provider>;
}

export function useAdminSession(): AdminSessionContext {
  return useContext(AdminSessionCtx);
}
