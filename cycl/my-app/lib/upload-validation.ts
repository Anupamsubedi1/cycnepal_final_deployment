// Server-side upload validation helpers. Keep limits conservative; these guard
// against storage abuse / DoS and obviously-wrong file types. They do not change
// which fields are accepted — only enforce sane type/size on the existing ones.

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB

const IMAGE_MIME = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const IMAGE_EXT = new Set(["jpg", "jpeg", "png", "webp"]);
const PDF_MIME = new Set(["application/pdf"]);
const PDF_EXT = new Set(["pdf"]);

function extensionOf(name: string): string {
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

/**
 * Returns an error message string if the file is invalid, or null if it's OK.
 * `label` is used to make the error message human-readable.
 */
export function validateUploadFile(
  file: File,
  kind: "image" | "pdf",
  label: string,
): string | null {
  const maxBytes = kind === "image" ? MAX_IMAGE_BYTES : MAX_PDF_BYTES;
  const allowedMime = kind === "image" ? IMAGE_MIME : PDF_MIME;
  const allowedExt = kind === "image" ? IMAGE_EXT : PDF_EXT;

  if (file.size <= 0) {
    return `${label} file is empty.`;
  }
  if (file.size > maxBytes) {
    return `${label} must be smaller than ${Math.round(maxBytes / (1024 * 1024))} MB.`;
  }

  const ext = extensionOf(file.name);
  const mime = (file.type || "").toLowerCase();

  // Accept if either the declared MIME or the extension is allowed (browsers
  // sometimes omit/normalize MIME), but reject when both are present and wrong.
  const mimeOk = mime ? allowedMime.has(mime) : false;
  const extOk = ext ? allowedExt.has(ext) : false;

  if (!mimeOk && !extOk) {
    const expected = kind === "image" ? "JPG, PNG, or WEBP" : "PDF";
    return `${label} must be a ${expected} file.`;
  }

  return null;
}

/**
 * Sniffs the leading bytes of an uploaded file and confirms they match the
 * expected kind. This closes the "rename evil.exe to evil.pdf" gap that the
 * MIME/extension check alone cannot catch (the declared type is attacker-
 * controlled). Returns an error string, or null when the content looks valid.
 */
export function validateUploadContent(
  buffer: Buffer | Uint8Array,
  kind: "image" | "pdf",
  label: string,
): string | null {
  const b = buffer;
  if (b.length < 4) {
    return `${label} file is empty or corrupt.`;
  }

  const startsWith = (sig: number[], offset = 0): boolean =>
    sig.every((byte, i) => b[offset + i] === byte);

  if (kind === "pdf") {
    // "%PDF"
    return startsWith([0x25, 0x50, 0x44, 0x46]) ? null : `${label} is not a valid PDF file.`;
  }

  // image: JPEG (FF D8 FF), PNG (89 50 4E 47), or WEBP (RIFF....WEBP)
  const isJpeg = startsWith([0xff, 0xd8, 0xff]);
  const isPng = startsWith([0x89, 0x50, 0x4e, 0x47]);
  const isWebp =
    b.length >= 12 && startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8);

  return isJpeg || isPng || isWebp ? null : `${label} is not a valid image file.`;
}
