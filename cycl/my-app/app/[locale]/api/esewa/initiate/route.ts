import { NextRequest, NextResponse } from "next/server";
import { createEsewaInitPayload, getEsewaConfig } from "@/lib/esewa";

interface InitiateBody {
  vacancyId?: string;
  amount?: number;
  returnTo?: string;
}

function resolveBaseUrl(request: NextRequest): string {
  return process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const body = (await request.json()) as InitiateBody;
    const vacancyId = String(body.vacancyId || "").trim();

    if (!vacancyId) {
      return NextResponse.json(
        { error: "vacancyId is required" },
        { status: 400 },
      );
    }

    const amount =
      typeof body.amount === "number" && Number.isFinite(body.amount) && body.amount > 0
        ? body.amount
        : Number.parseFloat(process.env.ESEWA_DEFAULT_AMOUNT || "100");

    const txPrefix = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    const txSuffix = Math.random().toString(36).slice(2, 8);
    const transactionUuid = `${txPrefix}-${vacancyId.slice(-6)}-${txSuffix}`;

    // Default locale to 'en' since this endpoint might be called without locale prefix
    const locale = process.env.NEXT_PUBLIC_LOCALE || "en";
    const baseUrl = resolveBaseUrl(request);
    const returnTo = String(body.returnTo || "").trim() || `/${locale}/vacancies/${vacancyId}/apply`;

    // Build successUrl pointing directly to the page component (NOT /api/)
    const successUrl = `${baseUrl}/${locale}/payment/esewa/callback?outcome=success&return_to=${encodeURIComponent(returnTo)}`;
    const failureUrl = `${baseUrl}/${locale}/payment/esewa/callback?outcome=failure&return_to=${encodeURIComponent(returnTo)}`;

    const payload = createEsewaInitPayload({
      totalAmount: amount,
      transactionUuid,
      successUrl,
      failureUrl,
    });

    return NextResponse.json({
      formUrl: getEsewaConfig().formUrl,
      payload,
    });
  } catch (error) {
    console.error("Failed to initiate eSewa payment:", error);
    return NextResponse.json(
      { error: "Failed to initiate payment" },
      { status: 500 },
    );
  }
}
