import "server-only";

import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type { EmployeePermission, EmployeePublic } from "@/lib/employee-permissions";

export type { EmployeePermission, EmployeePublic } from "@/lib/employee-permissions";
export { ALL_PERMISSIONS } from "@/lib/employee-permissions";

interface Employee {
  _id?: ObjectId;
  fullName: string;
  email: string;
  passwordHash: string;
  role: "employee";
  permissions: EmployeePermission[];
  createdAt: Date;
}

export async function createEmployee(data: {
  fullName: string;
  email: string;
  passwordHash: string;
  permissions: EmployeePermission[];
}): Promise<string> {
  const db = await getDb();
  const result = await db.collection<Employee>("employees").insertOne({
    fullName: data.fullName,
    email: data.email.toLowerCase(),
    passwordHash: data.passwordHash,
    role: "employee",
    permissions: data.permissions,
    createdAt: new Date(),
  });
  return result.insertedId.toHexString();
}

export async function findEmployeeByEmail(email: string): Promise<Employee | null> {
  const db = await getDb();
  return db.collection<Employee>("employees").findOne({ email: email.toLowerCase() });
}

export async function listEmployees(): Promise<EmployeePublic[]> {
  const db = await getDb();
  const employees = await db
    .collection<Employee>("employees")
    .find({}, { projection: { passwordHash: 0 } })
    .sort({ createdAt: -1 })
    .toArray();

  return employees.map((e) => ({
    _id: e._id!.toHexString(),
    fullName: e.fullName,
    email: e.email,
    permissions: e.permissions,
    createdAt: e.createdAt,
  }));
}

export async function deleteEmployee(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db
    .collection<Employee>("employees")
    .deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}
