import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequestCookies } from "@/lib/admin-auth";
import { uploadToCloudinary, deleteCloudinaryImage } from "@/lib/cloudinary";
import { validateUploadFile } from "@/lib/upload-validation";

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
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 },
      );
    }

    const fileError = validateUploadFile(file, "image", "Image");
    if (fileError) {
      return NextResponse.json({ error: fileError }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResult = await uploadToCloudinary(buffer, file.name);

    if (oldPublicId) {
      try {
        await deleteCloudinaryImage(oldPublicId);
      } catch (error) {
        console.error("Failed to delete old image:", error);
      }
    }

    return NextResponse.json(uploadResult);
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 },
    );
  }
}