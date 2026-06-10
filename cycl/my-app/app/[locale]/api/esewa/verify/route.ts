import { NextRequest, NextResponse } from "next/server";
import { verifyEsewaTransaction } from "@/lib/esewa";

interface VerifyBody {
  data?: string;
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const body = (await request.json()) as VerifyBody;
    const result = await verifyEsewaTransaction(String(body.data || ""));

    if (!result.ok) {
      // A "not complete" payment is a valid (non-error) outcome for the client UI.
      if (result.status === 400 && result.error.startsWith("Payment is not complete")) {
        return NextResponse.json(
          { verified: false, status: "UNKNOWN", message: result.error },
          { status: 200 },
        );
      }
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      verified: true,
      status: result.data.status,
      transactionUuid: result.data.transactionUuid,
      totalAmount: result.data.totalAmount,
      refId: result.data.refId,
      transactionCode: result.data.transactionCode,
    });
  } catch (error) {
    console.error("Failed to verify eSewa payment:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 },
    );
  }
}
