import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthenticatedUser } from "@/lib/user-session";
import { getApplicationById } from "@/services/vacancy-application-service";
import { getVacancyById } from "@/services/vacancy-service";
import { generatePaymentReceiptPDF } from "@/lib/pdf";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function parseJsonObject(value: unknown): Record<string, unknown> {
  if (typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function asString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

const GATEWAY_LABELS: Record<string, string> = {
  esewa: "eSewa",
  khalti: "Khalti",
};

export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const user = await getAuthenticatedUser();
    if (!user?._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid application ID" }, { status: 400 });
    }

    const application = await getApplicationById(id);
    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Ownership check
    if (application.userId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Merge payment info from the top-level field and the paymentData response.
    const topPayment = parseJsonObject(application.payment);
    const paymentResponse = application.responses.find((r) => r.fieldId === "paymentData");
    const responsePayment = parseJsonObject(paymentResponse?.value);
    const payment = { ...responsePayment, ...topPayment };

    const status = asString(payment.status).toUpperCase();
    const verified = payment.verified === true;
    const hasPaid = status === "COMPLETE" && verified;

    // Guard: only issue a receipt when a verified payment exists.
    if (!hasPaid) {
      return NextResponse.json(
        { error: "No completed payment found for this application" },
        { status: 403 },
      );
    }

    const personalDetails = parseJsonObject(
      application.responses.find((r) => r.fieldId === "personalDetails")?.value,
    );
    const contactDetails = parseJsonObject(
      application.responses.find((r) => r.fieldId === "contactDetails")?.value,
    );
    const vacancy = await getVacancyById(application.vacancyId);

    const fullName =
      [personalDetails.firstName, personalDetails.lastName]
        .filter((v) => typeof v === "string" && v.trim().length > 0)
        .join(" ") || application.userFullName;

    const provider = asString(payment.provider).toLowerCase();
    const gateway = GATEWAY_LABELS[provider] || (provider ? provider : "Online Payment");

    const transactionId =
      asString(payment.transactionId) ||
      asString(payment.transactionCode) ||
      asString(payment.transactionUuid) ||
      asString(payment.refId) ||
      asString(payment.pidx);

    const amount =
      asString(payment.amount) || asString(payment.totalAmount) || String(vacancy?.applicationFee ?? "");

    const paidAtRaw = asString(payment.verifiedAt);
    const paymentDate = paidAtRaw
      ? new Date(paidAtRaw).toLocaleString("en-GB")
      : new Date(application.updatedAt).toLocaleString("en-GB");

    const receiptNumber = (application._id?.toString() || id).slice(-8).toUpperCase();

    const pdfBuffer = await generatePaymentReceiptPDF({
      receiptNumber,
      applicantName: fullName,
      email: asString(contactDetails.email) || application.userEmail,
      phone: asString(contactDetails.mobile) || application.userPhone,
      vacancyTitle: vacancy?.titleEn || vacancy?.titleNp || "Applied Position",
      amount: amount || "—",
      gateway,
      transactionId: transactionId || undefined,
      paymentDate,
      symbolNumber: application.symbolNumber ?? undefined,
    });

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="payment-receipt-${receiptNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("[Receipt] Error generating payment receipt:", error);
    return NextResponse.json({ error: "Failed to generate receipt" }, { status: 500 });
  }
}
