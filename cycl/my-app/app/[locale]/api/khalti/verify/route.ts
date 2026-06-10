import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthenticatedUser } from "@/lib/user-session";
import { getApplicationById, updateApplication } from "@/services/vacancy-application-service";
import { getVacancyById } from "@/services/vacancy-service";
import { lookupKhaltiPayment } from "@/lib/khalti";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthenticatedUser();
    if (!user?._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as { pidx?: string; applicationId?: string };
    const { pidx, applicationId } = body;

    if (!pidx || !applicationId) {
      return NextResponse.json({ error: "Missing pidx or applicationId" }, { status: 400 });
    }

    if (!ObjectId.isValid(applicationId)) {
      return NextResponse.json({ error: "Invalid application ID" }, { status: 400 });
    }

    const application = await getApplicationById(applicationId);
    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (application.userId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify stored pidx matches
    let storedPayment: Record<string, unknown> = {};
    try {
      storedPayment = JSON.parse(application.payment || "{}");
    } catch {
      // ignore
    }

    if (storedPayment.pidx !== pidx) {
      return NextResponse.json({ error: "Payment session mismatch" }, { status: 400 });
    }

    const lookup = await lookupKhaltiPayment(pidx);

    if (lookup.status !== "Completed") {
      return NextResponse.json(
        { verified: false, status: lookup.status, message: `Payment status: ${lookup.status}` },
        { status: 200 },
      );
    }

    // Defense-in-depth: confirm the paid amount matches the application fee
    // (mirrors the eSewa verification). Khalti amounts are in paisa.
    const vacancy = await getVacancyById(application.vacancyId.toString());
    const expectedPaisa = Math.round((vacancy?.applicationFee ?? 100) * 100);
    if (Math.round(lookup.total_amount) !== expectedPaisa) {
      return NextResponse.json(
        { error: "Paid amount does not match the application fee" },
        { status: 400 },
      );
    }

    // Update paymentData response
    const paymentResponseIdx = application.responses.findIndex((r) => r.fieldId === "paymentData");
    const newPaymentData = {
      verified: true,
      status: "COMPLETE",
      provider: "khalti",
      pidx,
      transactionId: lookup.transaction_id,
      totalAmount: lookup.total_amount / 100, // convert back to NPR
      verifiedAt: new Date().toISOString(),
    };

    const updatedResponses = [...application.responses];
    if (paymentResponseIdx !== -1) {
      let existing: Record<string, unknown> = {};
      try {
        existing = JSON.parse(updatedResponses[paymentResponseIdx].value as string);
      } catch {
        // ignore
      }
      updatedResponses[paymentResponseIdx] = {
        ...updatedResponses[paymentResponseIdx],
        value: JSON.stringify({ ...existing, ...newPaymentData }),
      };
    }

    await updateApplication(applicationId, {
      payment: JSON.stringify({
        provider: "khalti",
        pidx,
        transactionId: lookup.transaction_id,
        amount: lookup.total_amount / 100,
        status: "COMPLETE",
        verified: true,
        verifiedAt: new Date().toISOString(),
      }),
      ...(paymentResponseIdx !== -1 ? { responses: updatedResponses } : {}),
    });

    return NextResponse.json({ verified: true, status: "Completed" });
  } catch (error) {
    console.error("Khalti verification error:", error);
    return NextResponse.json({ error: "Failed to verify Khalti payment" }, { status: 500 });
  }
}
