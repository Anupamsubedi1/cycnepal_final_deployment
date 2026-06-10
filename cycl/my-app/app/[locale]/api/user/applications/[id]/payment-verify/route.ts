import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthenticatedUser } from "@/lib/user-session";
import { getApplicationById, updateApplication } from "@/services/vacancy-application-service";
import { getVacancyById } from "@/services/vacancy-service";
import { verifyEsewaTransaction } from "@/lib/esewa";

interface VerificationBody {
  // The base64 `data` blob returned by eSewa on success. This is the ONLY
  // trusted source of payment truth — it is HMAC-signed by eSewa and is
  // independently re-checked against eSewa's status API server-side.
  data?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const user = await getAuthenticatedUser();
    if (!user?._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: applicationId } = await params;
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

    const body = (await request.json()) as VerificationBody;
    if (!body.data) {
      return NextResponse.json(
        { error: "Missing eSewa response data" },
        { status: 400 },
      );
    }

    // Server-side trusted verification: signature + eSewa status API.
    const verification = await verifyEsewaTransaction(body.data);
    if (!verification.ok) {
      return NextResponse.json({ error: verification.error }, { status: verification.status });
    }

    const { transactionUuid, totalAmount, transactionCode, refId } = verification.data;

    // Ensure the verified transaction belongs to this application's initiated payment.
    let storedPayment: Record<string, unknown> = {};
    if (application.payment) {
      try {
        storedPayment = JSON.parse(application.payment) as Record<string, unknown>;
      } catch {
        // ignore parse error
      }
    }

    const storedTransactionUuid = storedPayment.transactionUuid as string | undefined;
    if (!storedTransactionUuid || storedTransactionUuid !== transactionUuid) {
      return NextResponse.json(
        { error: "Transaction does not match an initiated payment for this application" },
        { status: 400 },
      );
    }

    // Verify the paid amount matches the vacancy's application fee.
    const vacancy = await getVacancyById(application.vacancyId.toString());
    const expectedAmount = vacancy?.applicationFee ?? 100;
    if (Math.round(totalAmount) !== Math.round(expectedAmount)) {
      return NextResponse.json(
        { error: "Paid amount does not match the application fee" },
        { status: 400 },
      );
    }

    // Build the verified payment record (all values are server-derived).
    const verifiedPayment = {
      provider: "esewa",
      transactionUuid,
      amount: totalAmount,
      status: "COMPLETE",
      verified: true,
      verifiedAt: new Date().toISOString(),
      ...(refId ? { refId } : {}),
      ...(transactionCode ? { transactionCode } : {}),
    };

    const updatedResponses = [...(application.responses ?? [])];
    const paymentResponseIdx = updatedResponses.findIndex((r) => r.fieldId === "paymentData");

    const newPaymentData = {
      provider: "esewa",
      verified: true,
      status: "COMPLETE",
      transactionUuid,
      transactionCode,
      refId: refId ?? null,
      totalAmount,
      verifiedAt: new Date().toISOString(),
    };

    if (paymentResponseIdx !== -1) {
      let existing: Record<string, unknown> = {};
      try {
        existing = JSON.parse(updatedResponses[paymentResponseIdx].value as string) as Record<string, unknown>;
      } catch {
        // ignore
      }
      updatedResponses[paymentResponseIdx] = {
        ...updatedResponses[paymentResponseIdx],
        value: JSON.stringify({ ...existing, ...newPaymentData }),
      };
    } else {
      updatedResponses.push({
        fieldId: "paymentData",
        fieldLabel: "Payment Data",
        fieldType: "text",
        value: JSON.stringify(newPaymentData),
      });
    }

    const updatedApplication = await updateApplication(applicationId, {
      payment: JSON.stringify(verifiedPayment),
      responses: updatedResponses,
    });

    return NextResponse.json({
      success: true,
      message: "Payment verified and recorded",
      application: updatedApplication,
    });
  } catch (error) {
    console.error("Payment verification update error:", error);
    return NextResponse.json(
      { error: "Failed to update payment status" },
      { status: 500 },
    );
  }
}
