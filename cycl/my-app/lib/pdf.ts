import PDFDocument from "pdfkit";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

export const INSTITUTION_NAME = "CYC Nepal Laghubitta Bittiya Sanstha Ltd.";

/** Seller address lines shown on the payment voucher (below the institution name). */
export const SELLER_ADDRESS_LINES = [
  "Sabhagriha Chowk, Pokhara",
  "Kaski, Gandaki Province, Nepal",
  "Tel: 061-590894",
];

const DEFAULT_PDF_FONT_PATH = join(
  process.cwd(),
  "node_modules",
  "next",
  "dist",
  "compiled",
  "@vercel",
  "og",
  "Geist-Regular.ttf",
);

const LOGO_PATH = join(process.cwd(), "public", "cyc-logo.jpg");
const SIGNATURE_PATH = join(process.cwd(), "public", "signature.png");

function resolvePdfFontPath(): string | undefined {
  if (existsSync(DEFAULT_PDF_FONT_PATH)) {
    return DEFAULT_PDF_FONT_PATH;
  }
  return undefined;
}

/** Reads the institution logo from disk once; returns undefined if missing. */
function loadLogoBuffer(): Buffer | undefined {
  try {
    if (existsSync(LOGO_PATH)) {
      return readFileSync(LOGO_PATH);
    }
  } catch (error) {
    console.error("Failed to read institution logo for PDF:", error);
  }
  return undefined;
}

/** Reads the authorized signature image from disk once; returns undefined if missing. */
function loadSignatureBuffer(): Buffer | undefined {
  try {
    if (existsSync(SIGNATURE_PATH)) {
      return readFileSync(SIGNATURE_PATH);
    }
  } catch (error) {
    console.error("Failed to read signature image for PDF:", error);
  }
  return undefined;
}

export interface PDFApplicationData {
  fullName: string;
  email: string;
  phone: string;
  jobTitle: string;
  applicantName?: string;
}

export function generateApplicationThankYouPDF(data: PDFApplicationData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const fontPath = resolvePdfFontPath();
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
        ...(fontPath ? { font: fontPath } : {}),
      });

      const chunks: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });

      doc.on("end", () => {
        resolve(Buffer.concat(chunks));
      });

      doc.on("error", (err: Error) => {
        reject(err);
      });

      // Header
      doc.fontSize(24).font(fontPath || "Helvetica").text("Thank You for Your Application!", {
        align: "center",
      });

      doc.moveDown(0.5);
      doc
        .fontSize(12)
        .font(fontPath || "Helvetica")
        .text(
          "We have received your application and appreciate your interest in joining our team.",
          {
            align: "center",
          },
        );

      doc.moveDown(1.5);

      // Application Details
      doc.fontSize(14).font(fontPath || "Helvetica").text("Application Details");
      doc.strokeColor("#cccccc").lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();

      doc.moveDown(0.5);

      const details = [
        { label: "Full Name:", value: data.fullName },
        { label: "Email:", value: data.email },
        { label: "Phone:", value: data.phone },
        { label: "Position Applied For:", value: data.jobTitle },
      ];

      details.forEach(({ label, value }) => {
        doc.fontSize(11).font(fontPath || "Helvetica").text(label, { width: 150 });
        doc.fontSize(11).font(fontPath || "Helvetica").text(value, { indent: 160, continued: false });
        doc.moveDown(0.3);
      });

      doc.moveDown(1);

      // Next Steps
      doc.fontSize(14).font(fontPath || "Helvetica").text("What Happens Next?");
      doc.strokeColor("#cccccc").lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();

      doc.moveDown(0.5);

      doc
        .fontSize(11)
        .font(fontPath || "Helvetica")
        .text(
          "Thank you for submitting your application. Our recruitment team will review your application carefully and will reach out to you very soon with updates regarding the next steps.",
          {
            align: "left",
            width: 495,
          },
        );

      doc.moveDown(1.5);

      // Footer
      doc
        .fontSize(10)
        .font(fontPath || "Helvetica")
        .text("If you have any questions, please feel free to contact us.", {
          align: "center",
        });

      doc.moveDown(0.3);
      doc
        .fontSize(9)
        .font(fontPath || "Helvetica")
        .fillColor("#666666")
        .text("Generated on " + new Date().toLocaleDateString(), {
          align: "center",
        });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export async function generateApplicationDetailsPDF(
  applicationData: { [key: string]: string | boolean },
  jobTitle: string,
  userName: string,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const fontPath = resolvePdfFontPath();
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
        ...(fontPath ? { font: fontPath } : {}),
      });

      const chunks: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });

      doc.on("end", () => {
        resolve(Buffer.concat(chunks));
      });

      doc.on("error", (err: Error) => {
        reject(err);
      });

      // Header
      doc
        .fontSize(16)
        .font(fontPath || "Helvetica")
        .text("Job Application Details", {
          align: "center",
        });

      doc.moveDown(0.3);

      doc
        .fontSize(11)
        .font(fontPath || "Helvetica")
        .text(`Position: ${jobTitle}`, {
          align: "center",
        });

      doc.moveDown(0.5);
      doc
        .fontSize(10)
        .font(fontPath || "Helvetica")
        .fillColor("#666666")
        .text(
          `Applicant: ${userName} | Date: ${new Date().toLocaleDateString()}`,
          {
            align: "center",
          },
        );

      doc.moveDown(1.5);

      // Application Responses
      doc.fontSize(12).font(fontPath || "Helvetica").text("Application Responses");
      doc.strokeColor("#cccccc").lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();

      doc.moveDown(0.8);

      let isAlternate = false;
      Object.entries(applicationData).forEach(([fieldLabel, value]) => {
        // Background color for alternating rows
        if (isAlternate) {
          doc.rect(50, doc.y - 3, 495, 18).fill("#f5f5f5");
          doc.fillColor("#000000");
        }

        doc.fontSize(10).font(fontPath || "Helvetica").text(fieldLabel + ":", { indent: 10 });

        const valueStr = Array.isArray(value) ? value.join(", ") : String(value);
        doc
          .fontSize(10)
          .font(fontPath || "Helvetica")
          .text(valueStr, { indent: 20, width: 475, continued: false });

        doc.moveDown(0.5);
        isAlternate = !isAlternate;
      });

      doc.moveDown(1);

      // Footer
      doc.fontSize(9).font(fontPath || "Helvetica").fillColor("#666666").text("Confidential", {
        align: "center",
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export interface AdmitCardPDFData {
  applicationId: string;
  symbolNumber?: number;
  fullName: string;
  email: string;
  phone: string;
  jobTitle: string;
  department?: string;
  appliedDate: Date;
  citizenshipNumber?: string;
  dobAD?: string;
  address?: string;
  examDate?: string;
  examTime?: string;
  examVenue?: string;
  photoUrl?: string;
}

function toCloudinaryJpgUrl(url: string): string {
  if (!url.includes("/upload/")) return url;
  return url.replace("/upload/", "/upload/f_jpg/");
}

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(toCloudinaryJpgUrl(url));
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    console.error("Failed to fetch image for PDF:", error);
    return null;
  }
}

export async function generateApplicationAdmitCardPDF(
  data: AdmitCardPDFData,
): Promise<Buffer> {
  // Resolve remote photo before entering the synchronous drawing routine.
  const photoBuffer = data.photoUrl ? await fetchImageBuffer(data.photoUrl) : null;
  const logoBuffer = loadLogoBuffer();

  return new Promise((resolve, reject) => {
    try {
      const fontPath = resolvePdfFontPath();
      const font = fontPath || "Helvetica";
      const doc = new PDFDocument({
        size: "A4",
        margin: 0, // Manual margins for precise layout
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err: Error) => reject(err));

      const cardX = 40;
      const cardY = 50;
      const cardWidth = 515;
      const cardHeight = 740;
      const contentX = cardX + 24;
      const contentW = cardWidth - 48;

      // Card frame
      doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 12).fillAndStroke("#f8fbfc", "#0f766e");

      // ── Header: logo (top center), institution name, title ──
      let cursorY = cardY + 18;
      if (logoBuffer) {
        try {
          doc.image(logoBuffer, cardX + cardWidth / 2 - 26, cursorY, { fit: [52, 52], align: "center" });
        } catch {
          // ignore logo failures
        }
        cursorY += 56;
      }

      doc
        .fillColor("#0f766e")
        .font(font)
        .fontSize(13)
        .text(INSTITUTION_NAME, cardX, cursorY, { width: cardWidth, align: "center" });
      cursorY += 20;

      doc
        .fillColor("#0f172a")
        .font(font)
        .fontSize(26)
        .text("ADMIT CARD", cardX, cursorY, { width: cardWidth, align: "center", characterSpacing: 2 });
      cursorY += 34;

      doc
        .strokeColor("#0f766e")
        .lineWidth(1)
        .moveTo(contentX, cursorY)
        .lineTo(cardX + cardWidth - 24, cursorY)
        .stroke();
      cursorY += 18;

      // ── Photo box (right) ──
      const photoW = 96;
      const photoH = 112;
      const photoX = cardX + cardWidth - 24 - photoW;
      const photoY = cursorY;
      doc.rect(photoX - 2, photoY - 2, photoW + 4, photoH + 4).fill("#ffffff");
      if (photoBuffer) {
        try {
          doc.image(photoBuffer, photoX, photoY, { fit: [photoW, photoH], align: "center", valign: "center" });
        } catch (error) {
          doc.rect(photoX, photoY, photoW, photoH).stroke();
          doc.fontSize(8).text("Photo Not Found", photoX, photoY + 50, { width: photoW, align: "center" });
        }
      } else {
        doc.fillColor("#94a3b8").font(font).fontSize(9).text("PHOTO", photoX, photoY + photoH / 2 - 5, { width: photoW, align: "center" });
      }
      doc.lineWidth(0.8).strokeColor("#9ca3af").rect(photoX, photoY, photoW, photoH).stroke();

      // ── Symbol number — prominent bordered box (left) ──
      const symbolBoxW = photoX - contentX - 18;
      doc.roundedRect(contentX, photoY, symbolBoxW, 70, 8).fillAndStroke("#ecfdf5", "#0f766e");
      doc
        .fillColor("#0f766e")
        .font(font)
        .fontSize(10)
        .text("SYMBOL NUMBER", contentX, photoY + 12, { width: symbolBoxW, align: "center", characterSpacing: 1 });
      doc
        .fillColor("#064e3b")
        .font(font)
        .fontSize(34)
        .text(data.symbolNumber != null ? String(data.symbolNumber) : "—", contentX, photoY + 28, {
          width: symbolBoxW,
          align: "center",
        });

      let contentY = photoY + photoH + 20;

      // ── Applicant information rows ──
      doc.fillColor("#0f172a").font(font).fontSize(13).text("Candidate Details", contentX, contentY);
      contentY += 20;

      const rows: Array<{ label: string; value: string }> = [
        { label: "Full Name", value: data.fullName || "-" },
        { label: "Date of Birth", value: data.dobAD || "-" },
      ];
      if (data.citizenshipNumber) rows.push({ label: "Citizenship No.", value: data.citizenshipNumber });
      if (data.address) rows.push({ label: "Address", value: data.address });
      rows.push({ label: "Applied Post", value: data.jobTitle || "-" });
      if (data.department) rows.push({ label: "Department", value: data.department });
      rows.push({ label: "Email", value: data.email || "-" });
      rows.push({ label: "Phone", value: data.phone || "-" });
      rows.push({ label: "Application Date", value: new Date(data.appliedDate).toLocaleDateString("en-GB") });

      const rowH = 28;
      rows.forEach((row, index) => {
        const rowY = contentY + index * rowH;
        doc.rect(contentX, rowY, contentW, rowH).fill(index % 2 === 0 ? "#eef7f6" : "#ffffff");
        doc.fillColor("#134e4a").font(font).fontSize(10).text(row.label, contentX + 12, rowY + 8, { width: 130 });
        doc.fillColor("#0f172a").font(font).fontSize(10).text(row.value, contentX + 150, rowY + 8, { width: contentW - 162 });
      });

      contentY += rows.length * rowH + 18;

      // ── Exam details (only if any field is set) ──
      if (data.examDate || data.examTime || data.examVenue) {
        const examRows = [
          data.examDate ? { label: "Exam Date", value: data.examDate } : null,
          data.examTime ? { label: "Exam Time", value: data.examTime } : null,
          data.examVenue ? { label: "Exam Venue", value: data.examVenue } : null,
        ].filter(Boolean) as Array<{ label: string; value: string }>;

        const examBoxH = 30 + examRows.length * 20;
        doc.roundedRect(contentX, contentY, contentW, examBoxH, 8).fillAndStroke("#fff7ed", "#fdba74");
        doc.fillColor("#9a3412").font(font).fontSize(11).text("Examination Details", contentX + 12, contentY + 10);
        examRows.forEach((row, index) => {
          const y = contentY + 30 + index * 20;
          doc.fillColor("#7c2d12").font(font).fontSize(10).text(`${row.label}:`, contentX + 12, y, { width: 110 });
          doc.fillColor("#7c2d12").font(font).fontSize(10).text(row.value, contentX + 120, y, { width: contentW - 132 });
        });
        contentY += examBoxH + 18;
      }

      // ── Signature line ──
      const signY = cardY + cardHeight - 90;
      doc.strokeColor("#475569").lineWidth(0.8).moveTo(cardX + cardWidth - 24 - 160, signY).lineTo(cardX + cardWidth - 24, signY).stroke();
      doc.fillColor("#475569").font(font).fontSize(9).text("Authorized Signature", cardX + cardWidth - 24 - 160, signY + 6, { width: 160, align: "center" });

      // ── Footer ──
      doc
        .fillColor("#0f766e")
        .font(font)
        .fontSize(9)
        .text(`This admit card is issued by ${INSTITUTION_NAME}`, contentX, cardY + cardHeight - 48, {
          width: contentW,
          align: "center",
        });
      doc
        .fillColor("#6b7280")
        .font(font)
        .fontSize(8)
        .text(
          `Application ID: ${data.applicationId}  •  Generated on ${new Date().toLocaleString("en-GB")}`,
          contentX,
          cardY + cardHeight - 32,
          { width: contentW, align: "center" },
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export interface PaymentReceiptPDFData {
  receiptNumber: string;
  applicantName: string;
  email: string;
  phone: string;
  vacancyTitle: string;
  amount: number | string;
  gateway: string;
  transactionId?: string;
  paymentDate?: string;
  /** Admin-assigned exam symbol number, shown in the "Paid By" block. */
  symbolNumber?: number | string;
}

export async function generatePaymentReceiptPDF(
  data: PaymentReceiptPDFData,
): Promise<Buffer> {
  const logoBuffer = loadLogoBuffer();
  const signatureBuffer = loadSignatureBuffer();

  return new Promise((resolve, reject) => {
    try {
      const fontPath = resolvePdfFontPath();
      const font = fontPath || "Helvetica";
      const doc = new PDFDocument({
        size: "A4",
        margin: 40,
        ...(fontPath ? { font: fontPath } : {}),
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err: Error) => reject(err));

      const left = 40;
      const right = 555;
      const fullW = right - left; // 515

      const TEAL = "#0f766e";
      const DARK = "#0f172a";
      const MUTE = "#64748b";
      const LINE = "#cbd5e1";
      const BANDLT = "#f1f5f9";

      const formatMoney = (val: number | string): string => {
        const num =
          typeof val === "number"
            ? val
            : parseFloat(String(val).replace(/[^0-9.\-]/g, ""));
        if (!isFinite(num)) return String(val);
        return num.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      };
      const amountNum = (() => {
        const n =
          typeof data.amount === "number"
            ? data.amount
            : parseFloat(String(data.amount).replace(/[^0-9.\-]/g, ""));
        return isFinite(n) ? n : 0;
      })();

      // ── Header: logo (top center) + title centered below ──
      const centerX = (left + right) / 2;
      let cy = 45;
      const logoW = 165;
      if (logoBuffer) {
        try {
          doc.image(logoBuffer, centerX - logoW / 2, cy, { width: logoW });
          cy += logoW / 4 + 12; // logo aspect 4:1 → height ≈ logoW / 4
        } catch {
          cy += 6;
        }
      } else {
        cy += 6;
      }
      doc
        .fillColor(TEAL)
        .font(font)
        .fontSize(26)
        .text("PAYMENT VOUCHER", left, cy, { width: fullW, align: "center" });
      cy += 34;
      doc.strokeColor(TEAL).lineWidth(2).moveTo(left, cy).lineTo(right, cy).stroke();
      cy += 22;

      // ── Info boxes: Receipt Number / Date / Payment Method ──
      const infoGap = 11;
      const infoW = (fullW - infoGap * 2) / 3;
      const infos: Array<{ label: string; value: string }> = [
        { label: "Receipt Number", value: data.receiptNumber || "-" },
        {
          label: "Receipt Date",
          value: data.paymentDate || new Date().toLocaleString("en-GB"),
        },
        { label: "Payment Method", value: data.gateway || "-" },
      ];
      const infoLabelY = cy;
      const infoBoxY = cy + 16;
      const infoBoxH = 30;
      infos.forEach((info, i) => {
        const x = left + i * (infoW + infoGap);
        doc
          .fillColor(MUTE)
          .font(font)
          .fontSize(10)
          .text(info.label.toUpperCase(), x, infoLabelY, { width: infoW, align: "center" });
        doc.rect(x, infoBoxY, infoW, infoBoxH).fillAndStroke("#f8fafc", LINE);
        doc
          .fillColor(DARK)
          .font(font)
          .fontSize(11)
          .text(info.value, x + 6, infoBoxY + 9, {
            width: infoW - 12,
            align: "center",
            lineBreak: false,
          });
      });
      cy = infoBoxY + infoBoxH + 22;

      // ── Parties: PAID TO (organization) / PAID BY (applicant) ──
      const partyGap = 15;
      const partyW = (fullW - partyGap) / 2;
      const orgX = left;
      const applicantX = left + partyW + partyGap;

      doc.fillColor(TEAL).font(font).fontSize(11).text("PAID TO", orgX, cy, {
        characterSpacing: 1,
      });
      doc
        .fillColor(TEAL)
        .font(font)
        .fontSize(11)
        .text("PAID BY", applicantX, cy, { characterSpacing: 1 });

      const partyRowsY = cy + 18;
      const partyRowH = 24;
      const orgLines = [INSTITUTION_NAME, ...SELLER_ADDRESS_LINES];
      const hasSymbol =
        data.symbolNumber != null && String(data.symbolNumber).trim() !== "";
      const applicantLines = [
        data.applicantName || "-",
        data.email || "-",
        data.phone || "-",
        `Symbol Number: ${hasSymbol ? data.symbolNumber : "—"}`,
      ];
      for (let i = 0; i < 4; i++) {
        const y = partyRowsY + i * partyRowH;
        const head = i === 0;
        doc
          .rect(orgX, y, partyW, partyRowH)
          .fillAndStroke(head ? "#f8fafc" : "#ffffff", LINE);
        doc
          .fillColor(head ? DARK : "#334155")
          .font(font)
          .fontSize(9)
          .text(orgLines[i] || "", orgX + 8, y + 7, {
            width: partyW - 16,
            lineBreak: false,
          });
        doc
          .rect(applicantX, y, partyW, partyRowH)
          .fillAndStroke(head ? "#f8fafc" : "#ffffff", LINE);
        doc
          .fillColor(head ? DARK : "#334155")
          .font(font)
          .fontSize(9)
          .text(applicantLines[i] || "", applicantX + 8, y + 7, {
            width: partyW - 16,
            lineBreak: false,
          });
      }

      // ── Line items table (Description / Subtotal / Tax) ──
      const tableTop = partyRowsY + 4 * partyRowH + 22;
      const cols = [
        { key: "desc", label: "DESCRIPTION", w: 355, align: "left" as const },
        { key: "sub", label: "SUBTOTAL", w: 80, align: "right" as const },
        { key: "tax", label: "TAX", w: 80, align: "right" as const },
      ];
      const colX: number[] = [];
      {
        let cx = left;
        for (const c of cols) {
          colX.push(cx);
          cx += c.w;
        }
      }

      const headH = 26;
      const rowH = 26;
      const bodyRows = 4;
      const tableBottom = tableTop + headH + bodyRows * rowH;

      // Header band
      doc.rect(left, tableTop, fullW, headH).fill(TEAL);
      cols.forEach((c, i) => {
        const headerAlign = c.key === "desc" ? "left" : "center";
        const padL = c.key === "desc" ? 8 : 4;
        doc
          .fillColor("#ffffff")
          .font(font)
          .fontSize(9)
          .text(c.label, colX[i] + padL, tableTop + 9, {
            width: c.w - padL - 4,
            align: headerAlign,
          });
      });

      // Body rows (first row holds the line item; rest are blank)
      const dataRow = [
        `Payment for ${data.vacancyTitle || "Application"}`,
        formatMoney(amountNum),
        "0.00",
      ];
      for (let r = 0; r < bodyRows; r++) {
        const y = tableTop + headH + r * rowH;
        doc
          .rect(left, y, fullW, rowH)
          .fillAndStroke(r % 2 === 0 ? "#ffffff" : "#fafafa", LINE);
        if (r === 0) {
          cols.forEach((c, i) => {
            doc
              .fillColor(DARK)
              .font(font)
              .fontSize(9)
              .text(dataRow[i], colX[i] + 8, y + 8, {
                width: c.w - 16,
                align: c.align,
                lineBreak: false,
                ellipsis: c.key === "desc",
              });
          });
        }
      }

      // Column separators + table border
      let vx = left;
      cols.forEach((c) => {
        vx += c.w;
        if (vx < right) {
          doc
            .strokeColor(LINE)
            .lineWidth(0.5)
            .moveTo(vx, tableTop)
            .lineTo(vx, tableBottom)
            .stroke();
        }
      });
      doc
        .strokeColor(LINE)
        .lineWidth(0.8)
        .rect(left, tableTop, fullW, headH + bodyRows * rowH)
        .stroke();

      // ── Notes (left) + totals (right) ──
      const sumRowH = 26;
      const summary: Array<{ label: string; value: string; strong?: boolean }> = [
        { label: "Subtotal", value: `NPR ${formatMoney(amountNum)}` },
        { label: "Tax (0%)", value: "NPR 0.00" },
        { label: "Total", value: `NPR ${formatMoney(amountNum)}`, strong: true },
      ];
      const sumTotalW = 185;
      const sumStartX = right - sumTotalW;
      const sumW1 = 85; // label cell
      const sumW2 = sumTotalW - sumW1; // value cell
      const sumLabelX = sumStartX;
      const sumValX = sumStartX + sumW1;
      summary.forEach((s, i) => {
        const y = tableBottom + i * sumRowH;
        doc
          .rect(sumLabelX, y, sumW1, sumRowH)
          .fillAndStroke(s.strong ? TEAL : BANDLT, LINE);
        doc
          .rect(sumValX, y, sumW2, sumRowH)
          .fillAndStroke(s.strong ? TEAL : "#ffffff", LINE);
        doc
          .fillColor(s.strong ? "#ffffff" : "#475569")
          .font(font)
          .fontSize(s.strong ? 11 : 9)
          .text(s.label, sumLabelX + 8, y + (s.strong ? 7 : 8), {
            width: sumW1 - 16,
          });
        doc
          .fillColor(s.strong ? "#ffffff" : DARK)
          .font(font)
          .fontSize(s.strong ? 11 : 10)
          .text(s.value, sumValX + 6, y + (s.strong ? 7 : 8), {
            width: sumW2 - 12,
            align: "right",
            lineBreak: false,
          });
      });
      const summaryBottom = tableBottom + summary.length * sumRowH;

      const notesW = sumStartX - left - 12;
      const notesH = summary.length * sumRowH;
      doc.rect(left, tableBottom, notesW, notesH).fillAndStroke("#ffffff", LINE);
      doc
        .fillColor(DARK)
        .font(font)
        .fontSize(9)
        .text("Notes", left + 8, tableBottom + 7);
      const noteLines: string[] = [];
      if (data.transactionId) noteLines.push(`Transaction ID: ${data.transactionId}`);
      noteLines.push("Application processing fee — non-refundable.");
      noteLines.push("System-generated; no physical signature required.");
      doc
        .fillColor("#475569")
        .font(font)
        .fontSize(8)
        .text(noteLines.join("\n"), left + 8, tableBottom + 22, {
          width: notesW - 16,
        });

      // ── Signature lines (with signature image above each) ──
      const signY = summaryBottom + 95;
      const lineLen = 170;
      const sigImgW = 110;
      const sigImgH = sigImgW / 1.834; // signature aspect ≈ 1.834

      const drawSignature = (lineX: number, label: string) => {
        if (signatureBuffer) {
          try {
            doc.image(signatureBuffer, lineX + (lineLen - sigImgW) / 2, signY - sigImgH - 2, {
              width: sigImgW,
            });
          } catch {
            // ignore signature image failures
          }
        }
        doc
          .strokeColor("#475569")
          .lineWidth(0.8)
          .moveTo(lineX, signY)
          .lineTo(lineX + lineLen, signY)
          .stroke();
        doc
          .fillColor("#475569")
          .font(font)
          .fontSize(9)
          .text(label, lineX, signY + 6, { width: lineLen, align: "center" });
      };

      drawSignature(left + 10, "Prepared By");
      drawSignature(right - 10 - lineLen, "Authorized Signature");

      // ── Footer ──
      const thankY = signY + 50;
      doc
        .fillColor(TEAL)
        .font(font)
        .fontSize(13)
        .text("THANK YOU FOR THE PAYMENT!", left, thankY, {
          width: fullW,
          align: "center",
        });
      doc
        .fillColor("#94a3b8")
        .font(font)
        .fontSize(8)
        .text(
          `Issued by ${INSTITUTION_NAME}  •  Generated on ${new Date().toLocaleString("en-GB")}`,
          left,
          thankY + 22,
          { width: fullW, align: "center" },
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
