"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiEye, FiEyeOff } from "react-icons/fi";
import Link from "next/link";
import { ALL_PERMISSIONS, type EmployeePermission } from "@/lib/employee-permissions";
import { Button, Card, ErrorState, buttonClass } from "@/components/admin/ui";

const inputCls =
  "mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#0d837f] focus:ring-1 focus:ring-[#0d837f]";

export default function CreateEmployeeForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [permissions, setPermissions] = useState<EmployeePermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function togglePermission(key: EmployeePermission) {
    setPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key],
    );
  }

  function toggleAll() {
    if (permissions.length === ALL_PERMISSIONS.length) {
      setPermissions([]);
    } else {
      setPermissions(ALL_PERMISSIONS.map((p) => p.key));
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, permissions }),
      });

      const data = (await res.json()) as { message?: string };

      if (!res.ok) {
        setError(data.message ?? "Failed to create employee.");
        return;
      }

      router.push("/admin/employees");
      router.refresh();
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  const allSelected = permissions.length === ALL_PERMISSIONS.length;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link
          href="/admin/employees"
          className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-800"
        >
          <FiArrowLeft size={14} />
          Back to Employees
        </Link>
      </div>

      <Card className="p-6 sm:p-8">
        <h1 className="text-xl font-semibold text-slate-900">New Employee</h1>
        <p className="mt-1 text-sm text-slate-500">
          Create an employee account and choose which admin sections they can access.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-6">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="fullName">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className={inputCls}
              placeholder="Ram Poudel"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputCls}
              placeholder="employee@example.com"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="password">
              Password
            </label>
            <div className="relative mt-1.5">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 text-sm text-slate-900 outline-none transition focus:border-[#0d837f] focus:ring-1 focus:ring-[#0d837f]"
                placeholder="Minimum 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
              </button>
            </div>
          </div>

          {/* Permissions */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-700">
                Section Access
              </label>
              <button
                type="button"
                onClick={toggleAll}
                className="text-xs font-medium text-[#0d837f] hover:underline"
              >
                {allSelected ? "Deselect All" : "Select All"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {ALL_PERMISSIONS.map(({ key, label }) => {
                const checked = permissions.includes(key);
                return (
                  <label
                    key={key}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition ${
                      checked
                        ? "border-[#0d837f] bg-[#0d837f]/5 text-[#0d837f]"
                        : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePermission(key)}
                      className="h-4 w-4 rounded border-slate-300 accent-[#0d837f]"
                    />
                    <span className="font-medium">{label}</span>
                  </label>
                );
              })}
            </div>
            {permissions.length === 0 && (
              <p className="mt-2 text-xs text-amber-600">
                No sections selected. The employee will only see the dashboard.
              </p>
            )}
          </div>

          {error && <ErrorState message={error} />}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/admin/employees" className={buttonClass("secondary")}>
              Cancel
            </Link>
            <Button type="submit" disabled={loading} className="px-6">
              {loading ? "Creating..." : "Create Employee"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
