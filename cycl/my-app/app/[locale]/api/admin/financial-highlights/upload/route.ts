import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequestCookies } from "@/lib/admin-auth";
import { uploadCloudinaryFile } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const oldPublicId = formData.get("oldPublicId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const uploadResult = await uploadCloudinaryFile(buffer, file.name, {
      folder: "financial-highlights",
      resourceType: isPdf ? "raw" : "image",
    });

    if (oldPublicId) {
      try {
        const { deleteCloudinaryFile } = await import("@/lib/cloudinary");
        await deleteCloudinaryFile(oldPublicId);
      } catch (error) {
        console.error("Failed to delete old financial highlights file:", error);
      }
    }

    return NextResponse.json(uploadResult);
  } catch (error) {
    console.error("Error uploading financial highlights file:", error);
    return NextResponse.json(
      { error: "Failed to upload financial highlights file" },
      { status: 500 },
    );
  }
}