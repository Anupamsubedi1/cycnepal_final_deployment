import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function deleteCloudinaryImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Failed to delete image from Cloudinary:", error);
    throw new Error("Failed to delete image from Cloudinary");
  }
}

export async function deleteCloudinaryFile(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Failed to delete file from Cloudinary:", error);
    throw new Error("Failed to delete file from Cloudinary");
  }
}

export function getCloudinaryRawPdfUrl(publicId: string): string {
  return cloudinary.url(publicId, {
    secure: true,
    resource_type: "raw",
  });
}

export async function uploadToCloudinary(
  file: Buffer,
  fileName: string,
): Promise<{ secure_url: string; public_id: string }> {
  return uploadCloudinaryFile(file, fileName, {
    folder: "hero-sections",
    resourceType: "image",
  });
}

export async function uploadCloudinaryFile(
  file: Buffer,
  fileName: string,
  options: {
    folder: string;
    resourceType: "image" | "raw" | "auto";
  },
): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: options.resourceType,
        folder: options.folder,
        public_id: fileName.replace(/\.[^/.]+$/, ""),
      },
      (error, result) => {
        if (error) {
          reject(new Error(`Failed to upload ${options.resourceType} file to Cloudinary`));
        } else if (result) {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        } else {
          reject(new Error("Upload completed but no result returned"));
        }
      },
    );

    uploadStream.end(file);
  });
}

export async function uploadPDFToCloudinary(
  file: Buffer,
  fileName: string,
  folder: string = "application-pdfs",
): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: folder,
        public_id: fileName.replace(/\.[^/.]+$/, ""),
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", JSON.stringify(error, null, 2));
          reject(new Error(`Failed to upload PDF to Cloudinary: ${error.message}`));
        } else if (result) {
          console.log("Cloudinary upload result:", {
            public_id: result.public_id,
            secure_url: result.secure_url,
            resource_type: result.resource_type,
            version: result.version,
          });
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        } else {
          reject(new Error("PDF upload completed but no result returned"));
        }
      },
    );

    uploadStream.end(file);
  });
}

export async function uploadApplicationFileToCloudinary(
  file: Buffer,
  fileName: string,
  fileType: string,
  vacancyId: string,
): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const extension = fileName.split(".").pop() || "pdf";
    const resourceType = fileType === "pdf" || extension === "pdf" ? "raw" : "auto";

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder: `job-applications/${vacancyId}`,
        public_id: fileName.replace(/\.[^/.]+$/, ""),
      },
      (error, result) => {
        if (error) {
          reject(new Error("Failed to upload file to Cloudinary"));
        } else if (result) {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        } else {
          reject(new Error("File upload completed but no result returned"));
        }
      },
    );

    uploadStream.end(file);
  });
}
