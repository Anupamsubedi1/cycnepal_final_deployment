import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequestCookies } from "@/lib/admin-auth";
import {
  createBranchOffice,
  deleteBranchOffice,
  getAllBranchOffices,
  getBranchOfficesByProvince,
  updateBranchOffice,
  type BranchOffice,
} from "@/services/branches-service";

function validate(data: Partial<BranchOffice>) {
  return Boolean(data.provinceId?.trim() && data.branchName?.trim());
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(request.url);
    const province = url.searchParams.get("province");
    const branches = province ? await getBranchOfficesByProvince(province) : await getAllBranchOffices();
    return NextResponse.json(branches);
  } catch {
    return NextResponse.json({ error: "Failed to fetch branches" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = (await request.json()) as Partial<BranchOffice>;
    if (!validate(data)) return NextResponse.json({ error: "Province and branch name are required" }, { status: 400 });

    const branch = await createBranchOffice({
      provinceId: data.provinceId!.trim(),
      branchName: data.branchName!.trim(),
      manager: data.manager?.trim() ?? "",
      address: data.address?.trim() ?? "",
      phone: data.phone?.trim() ?? "",
      email: data.email?.trim() ?? "",
      displayOrder: Number(data.displayOrder ?? 0),
    });
    return NextResponse.json(branch, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create branch" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const data = (await request.json()) as Partial<BranchOffice>;
    if (!validate(data)) return NextResponse.json({ error: "Province and branch name are required" }, { status: 400 });

    const branch = await updateBranchOffice(id, {
      provinceId: data.provinceId!.trim(),
      branchName: data.branchName!.trim(),
      manager: data.manager?.trim() ?? "",
      address: data.address?.trim() ?? "",
      phone: data.phone?.trim() ?? "",
      email: data.email?.trim() ?? "",
      displayOrder: Number(data.displayOrder ?? 0),
    });
    if (!branch) return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    return NextResponse.json(branch);
  } catch {
    return NextResponse.json({ error: "Failed to update branch" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const deleted = await deleteBranchOffice(id);
    if (!deleted) return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete branch" }, { status: 500 });
  }
}
