"use client";

import { useState, useEffect, useCallback } from "react";
import { FiPlus, FiTrash2, FiUser } from "react-icons/fi";
import { ALL_PERMISSIONS, type EmployeePublic } from "@/lib/employee-permissions";
import {
  Badge,
  ButtonLink,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  SkeletonTable,
  tableClasses,
  cx,
} from "@/components/admin/ui";

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<EmployeePublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/employees");
      const data = (await res.json()) as { employees: EmployeePublic[] };
      setEmployees(data.employees);
    } catch {
      setError("Failed to load employees.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete employee "${name}"? This cannot be undone.`)) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/employees/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        setError(data.message ?? "Failed to delete employee.");
        return;
      }
      setEmployees((prev) => prev.filter((e) => e._id !== id));
    } catch {
      setError("Failed to delete employee.");
    } finally {
      setDeletingId(null);
    }
  }

  const getPermissionLabel = (key: string) =>
    ALL_PERMISSIONS.find((p) => p.key === key)?.label ?? key;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description="Manage employee accounts and their section access."
        actions={
          <ButtonLink href="/admin/employees/create">
            <FiPlus size={16} />
            New Employee
          </ButtonLink>
        }
      />

      {error && <ErrorState message={error} />}

      {loading ? (
        <Card>
          <SkeletonTable rows={4} />
        </Card>
      ) : employees.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FiUser className="h-6 w-6" />}
            title="No employees yet"
            description="Create an employee account to get started."
            action={
              <ButtonLink href="/admin/employees/create" size="sm">
                <FiPlus size={14} />
                New Employee
              </ButtonLink>
            }
          />
        </Card>
      ) : (
        <Card>
          <div className={tableClasses.wrap}>
            <table className={cx(tableClasses.table, "min-w-[640px]")}>
              <thead className={tableClasses.thead}>
                <tr>
                  <th className={tableClasses.th}>Name</th>
                  <th className={tableClasses.th}>Email</th>
                  <th className={tableClasses.th}>Sections Access</th>
                  <th className={tableClasses.th}>Created</th>
                  <th className={tableClasses.thRight}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee._id} className={tableClasses.tr}>
                    <td className={cx(tableClasses.td, "font-medium text-slate-900")}>
                      {employee.fullName}
                    </td>
                    <td className={tableClasses.td}>{employee.email}</td>
                    <td className={tableClasses.td}>
                      <div className="flex flex-wrap gap-1">
                        {employee.permissions.length === 0 ? (
                          <span className="text-xs text-slate-400">No access</span>
                        ) : (
                          employee.permissions.map((p) => (
                            <Badge key={p} variant="accent">
                              {getPermissionLabel(p)}
                            </Badge>
                          ))
                        )}
                      </div>
                    </td>
                    <td className={cx(tableClasses.td, "text-slate-500")}>
                      {new Date(employee.createdAt).toLocaleDateString()}
                    </td>
                    <td className={tableClasses.tdRight}>
                      <button
                        onClick={() => handleDelete(employee._id, employee.fullName)}
                        disabled={deletingId === employee._id}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 disabled:opacity-50"
                      >
                        <FiTrash2 size={13} />
                        {deletingId === employee._id ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
