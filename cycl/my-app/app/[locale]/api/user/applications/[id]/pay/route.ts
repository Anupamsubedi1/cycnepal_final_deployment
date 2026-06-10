import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthenticatedUser } from "@/lib/user-session";
import { getApplicationById, updateApplication } from "@/services/vacancy-application-service";
import { getVacancyById } from "@/services/vacancy-service";
import { createEsewaInitPayload, getEsewaConfig } from "@/lib/esewa";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  request: NextRequest,
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

    if (application.userId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get vacancy to retrieve application fee
    const vacancy = await getVacancyById(application.vacancyId.toString());
    if (!vacancy) {
      return NextResponse.json({ error: "Vacancy not found" }, { status: 404 });
    }

    const amount = vacancy.applicationFee || 100;

    const txPrefix = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    const txSuffix = Math.random().toString(36).slice(2, 8);
    const transactionUuid = `app-${txPrefix}-${id.slice(-6)}-${txSuffix}`;

    // Read locale from cookie (same source the middleware uses); fall back to "en"
    const locale = request.cookies.get("NEXT_LOCALE")?.value || "en";

    // eSewa does a browser redirect (not a server-side POST), so localhost works as the callback URL.
    // Use NEXT_PUBLIC_RETURN_URL (e.g. http://localhost:3000) as the base for both the
    // callback page and the final redirect. Fall back to NEXT_PUBLIC_APP_URL then request origin.
    const appBase =
      process.env.NEXT_PUBLIC_RETURN_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      request.nextUrl.origin;

    const returnTo = `${appBase}/${locale}/dashboard/applications?applicationId=${id}`;
    const successUrl = `${appBase}/${locale}/payment/esewa/callback?outcome=success&return_to=${encodeURIComponent(returnTo)}`;
    const failureUrl = `${appBase}/${locale}/payment/esewa/callback?outcome=failure&return_to=${encodeURIComponent(returnTo)}`;

    const payload = createEsewaInitPayload({
      totalAmount: amount,
      transactionUuid,
      successUrl,
      failureUrl,
    });

    await updateApplication(id, {
      payment: JSON.stringify({
        provider: "esewa",
        transactionUuid,
        amount,
        status: "PENDING",
        initiatedAt: new Date().toISOString(),
      }),
    });

    const config = getEsewaConfig();

    return NextResponse.json({
      formUrl: config.formUrl,
      payload,
    });
  } catch (error) {
    console.error("Failed to initiate payment:", error);
    return NextResponse.json(
      { error: "Failed to initiate payment" },
      { status: 500 },
    );
  }
}