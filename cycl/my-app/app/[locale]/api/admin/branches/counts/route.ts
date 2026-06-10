import { NextResponse } from "next/server";
import { getAdminSessionFromRequestCookies } from "@/lib/admin-auth";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = await getDb();
    const agg = await db
      .collection("branch_offices")
      .aggregate<{ _id: string; count: number }>([
        { $group: { _id: "$provinceId", count: { $sum: 1 } } },
      ])
      .toArray();

    const counts: Record<string, number> = {};
    for (const row of agg) {
      counts[row._id] = row.count;
    }
    return NextResponse.json(counts);
  } catch {
    return NextResponse.json({ error: "Failed to fetch counts" }, { status: 500 });
  }
}
