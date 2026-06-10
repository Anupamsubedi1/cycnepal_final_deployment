import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequestCookies } from "@/lib/admin-auth";
import { deleteCloudinaryFile } from "@/lib/cloudinary";
import {
  createFinancialHighlightBaseRateRow,
  createFinancialHighlightDocument,
  deleteFinancialHighlightBaseRateRow,
  deleteFinancialHighlightDocument,
  getAllFinancialHighlightBaseRateRows,
  getAllFinancialHighlightDocuments,
  getFinancialHighlightBaseRateRowById,
  getFinancialHighlightDocumentById,
  type FinancialHighlightBaseRateRow,
  type FinancialHighlightDocument,
  updateFinancialHighlightBaseRateRow,
  updateFinancialHighlightDocument,
} from "@/services/financial-highlights-service";

type FinancialHighlightsKind = "document" | "base-rate";

function getKind(request: NextRequest): FinancialHighlightsKind | null {
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind");

  return kind === "document" || kind === "base-rate" ? kind : null;
}

function hasRequiredDocumentFields(data: Partial<FinancialHighlightDocument>) {
  const title = data.title?.trim() || data["title-en"]?.trim() || data["title-ne"]?.trim() || "";

  return Boolean(title && data.fileUrl?.trim() && data.filePublicId?.trim());
}

function hasRequiredBaseRateFields(data: Partial<FinancialHighlightBaseRateRow>) {
  return Boolean(
    data.effectiveDate?.trim() &&
      Number.isFinite(Number(data.baseRate)) &&
      Number.isFinite(Number(data.spreadRate)) &&
      Number.isFinite(Number(data.finalRate)),
  );
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const kind = getKind(request);
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (kind === "document") {
      if (id) {
        const document = await getFinancialHighlightDocumentById(id);
        return NextResponse.json(document || null);
      }

      return NextResponse.json(await getAllFinancialHighlightDocuments());
    }

    if (kind === "base-rate") {
      if (id) {
        const row = await getFinancialHighlightBaseRateRowById(id);
        return NextResponse.json(row || null);
      }

      return NextResponse.json(await getAllFinancialHighlightBaseRateRows());
    }

    const [documents, baseRateRows] = await Promise.all([
      getAllFinancialHighlightDocuments(),
      getAllFinancialHighlightBaseRateRows(),
    ]);

    return NextResponse.json({ documents, baseRateRows });
  } catch (error) {
    console.error("Error fetching financial highlights:", error);
    return NextResponse.json(
      { error: "Failed to fetch financial highlights" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const kind = getKind(request);
    if (!kind) {
      return NextResponse.json({ error: "kind parameter required" }, { status: 400 });
    }

    const data = await request.json();

    if (kind === "document") {
      const payload = data as Partial<FinancialHighlightDocument>;

      if (!hasRequiredDocumentFields(payload)) {
        return NextResponse.json(
          { error: "Title and uploaded file are required" },
          { status: 400 },
        );
      }

      const document = await createFinancialHighlightDocument({
        section: payload.section || "annual-reports",
        title: payload.title?.trim() || payload["title-en"]?.trim() || "",
        "title-en": payload["title-en"]?.trim() || payload.title?.trim() || "",
        "title-ne": payload["title-ne"]?.trim() || payload.title?.trim() || payload["title-en"]?.trim() || "",
        fiscalYear: payload.fiscalYear?.trim() || "",
        fileUrl: payload.fileUrl?.trim() || "",
        filePublicId: payload.filePublicId?.trim() || "",
        fileName: payload.fileName?.trim() || "",
        fileType: payload.fileType || "pdf",
        displayOrder: Number(payload.displayOrder ?? 0) || 0,
      });

      return NextResponse.json(document, { status: 201 });
    }

    const payload = data as Partial<FinancialHighlightBaseRateRow>;

    if (!hasRequiredBaseRateFields(payload)) {
      return NextResponse.json(
        { error: "Effective date and base rate values are required" },
        { status: 400 },
      );
    }

    const row = await createFinancialHighlightBaseRateRow({
      effectiveDate: payload.effectiveDate?.trim() || "",
      baseRate: Number(payload.baseRate) || 0,
      spreadRate: Number(payload.spreadRate) || 0,
      finalRate: Number(payload.finalRate) || 0,
      displayOrder: Number(payload.displayOrder ?? 0) || 0,
    });

    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    console.error("Error creating financial highlights item:", error);
    return NextResponse.json(
      { error: "Failed to create financial highlights item" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const kind = getKind(request);
    if (!kind) {
      return NextResponse.json({ error: "kind parameter required" }, { status: 400 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID parameter required" }, { status: 400 });
    }

    const data = await request.json();

    if (kind === "document") {
      const payload = data as Partial<FinancialHighlightDocument> & {
        removedFilePublicId?: string;
      };

      if (!hasRequiredDocumentFields(payload)) {
        return NextResponse.json(
          { error: "Title and uploaded file are required" },
          { status: 400 },
        );
      }

      if (payload.removedFilePublicId) {
        try {
          await deleteCloudinaryFile(payload.removedFilePublicId);
        } catch (error) {
          console.error("Failed to delete replaced financial highlights file:", error);
        }
      }

      const document = await updateFinancialHighlightDocument(id, {
        section: payload.section || "annual-reports",
        title: payload.title?.trim() || payload["title-en"]?.trim() || "",
        "title-en": payload["title-en"]?.trim() || payload.title?.trim() || "",
        "title-ne": payload["title-ne"]?.trim() || payload.title?.trim() || payload["title-en"]?.trim() || "",
        fiscalYear: payload.fiscalYear?.trim() || "",
        fileUrl: payload.fileUrl?.trim() || "",
        filePublicId: payload.filePublicId?.trim() || "",
        fileName: payload.fileName?.trim() || "",
        fileType: payload.fileType || "pdf",
        displayOrder: Number(payload.displayOrder ?? 0) || 0,
      });

      if (!document) {
        return NextResponse.json(
          { error: "Financial highlights document not found" },
          { status: 404 },
        );
      }

      return NextResponse.json(document);
    }

    const payload = data as Partial<FinancialHighlightBaseRateRow>;

    if (!hasRequiredBaseRateFields(payload)) {
      return NextResponse.json(
        { error: "Effective date and base rate values are required" },
        { status: 400 },
      );
    }

    const row = await updateFinancialHighlightBaseRateRow(id, {
      effectiveDate: payload.effectiveDate?.trim() || "",
      baseRate: Number(payload.baseRate) || 0,
      spreadRate: Number(payload.spreadRate) || 0,
      finalRate: Number(payload.finalRate) || 0,
      displayOrder: Number(payload.displayOrder ?? 0) || 0,
    });

    if (!row) {
      return NextResponse.json(
        { error: "Financial highlights row not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(row);
  } catch (error) {
    console.error("Error updating financial highlights item:", error);
    return NextResponse.json(
      { error: "Failed to update financial highlights item" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const kind = getKind(request);
    if (!kind) {
      return NextResponse.json({ error: "kind parameter required" }, { status: 400 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID parameter required" }, { status: 400 });
    }

    if (kind === "document") {
      const existing = await getFinancialHighlightDocumentById(id);
      if (!existing) {
        return NextResponse.json(
          { error: "Financial highlights document not found" },
          { status: 404 },
        );
      }

      if (existing.filePublicId) {
        try {
          await deleteCloudinaryFile(existing.filePublicId);
        } catch (error) {
          console.error("Failed to delete financial highlights file:", error);
        }
      }

      const deleted = await deleteFinancialHighlightDocument(id);
      if (!deleted) {
        return NextResponse.json(
          { error: "Failed to delete financial highlights document" },
          { status: 500 },
        );
      }

      return NextResponse.json({ success: true });
    }

    const deleted = await deleteFinancialHighlightBaseRateRow(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Financial highlights row not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting financial highlights item:", error);
    return NextResponse.json(
      { error: "Failed to delete financial highlights item" },
      { status: 500 },
    );
  }
}