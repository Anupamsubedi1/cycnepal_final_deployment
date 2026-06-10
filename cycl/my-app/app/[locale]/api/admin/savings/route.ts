import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequestCookies } from "@/lib/admin-auth";
import {
  createSavingsRateRow,
  deleteSavingsRateRow,
  getAllSavingsRateRows,
  updateSavingsRateRow,
  type SavingsRateRow,
} from "@/services/savings-rates-service";

function validate(data: Partial<SavingsRateRow>) {
  return Boolean(data.savingsType?.trim() && data.interestRate?.trim() && Number.isFinite(Number(data.sn)));
}

export async function GET() {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json(await getAllSavingsRateRows());
  } catch {
    return NextResponse.json({ error: "Failed to fetch rows" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = (await request.json()) as Partial<SavingsRateRow>;
    if (!validate(data)) return NextResponse.json({ error: "Savings type, interest rate, and S.N are required" }, { status: 400 });

    const row = await createSavingsRateRow({
      sn: Number(data.sn),
      savingsType: data.savingsType!.trim(),
      interestRate: data.interestRate!.trim(),
      displayOrder: Number(data.displayOrder ?? data.sn ?? 0),
    });
    return NextResponse.json(row, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create row" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const data = (await request.json()) as Partial<SavingsRateRow>;
    if (!validate(data)) return NextResponse.json({ error: "Savings type, interest rate, and S.N are required" }, { status: 400 });

    const row = await updateSavingsRateRow(id, {
      sn: Number(data.sn),
      savingsType: data.savingsType!.trim(),
      interestRate: data.interestRate!.trim(),
      displayOrder: Number(data.displayOrder ?? data.sn ?? 0),
    });
    if (!row) return NextResponse.json({ error: "Row not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch {
    return NextResponse.json({ error: "Failed to update row" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const deleted = await deleteSavingsRateRow(id);
    if (!deleted) return NextResponse.json({ error: "Row not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete row" }, { status: 500 });
  }
}
