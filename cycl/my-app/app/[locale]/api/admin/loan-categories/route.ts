import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequestCookies } from "@/lib/admin-auth";
import {
  createLoanCategoryRow,
  deleteLoanCategoryRow,
  getAllLoanCategoryRows,
  updateLoanCategoryRow,
  type LoanCategoryRow,
} from "@/services/loan-categories-service";

function validate(data: Partial<LoanCategoryRow>) {
  return Boolean(data.loanType?.trim() && data.interestRate?.trim() && Number.isFinite(Number(data.sn)));
}

export async function GET() {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json(await getAllLoanCategoryRows());
  } catch {
    return NextResponse.json({ error: "Failed to fetch rows" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = (await request.json()) as Partial<LoanCategoryRow>;
    if (!validate(data)) return NextResponse.json({ error: "Loan type, interest rate, and S.N are required" }, { status: 400 });

    const row = await createLoanCategoryRow({
      sn: Number(data.sn),
      loanType: data.loanType!.trim(),
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

    const data = (await request.json()) as Partial<LoanCategoryRow>;
    if (!validate(data)) return NextResponse.json({ error: "Loan type, interest rate, and S.N are required" }, { status: 400 });

    const row = await updateLoanCategoryRow(id, {
      sn: Number(data.sn),
      loanType: data.loanType!.trim(),
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

    const deleted = await deleteLoanCategoryRow(id);
    if (!deleted) return NextResponse.json({ error: "Row not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete row" }, { status: 500 });
  }
}
