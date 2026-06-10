import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthenticatedUser } from "@/lib/user-session";
import { getApplicationById, updateApplication } from "@/services/vacancy-application-service";
import { getVacancyById } from "@/services/vacancy-service";
import { initiateKhaltiPayment } from "@/lib/khalti";

interface RouteParams {
  params: Promise<{ id: string }>;
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

    const vacancy = await getVacancyById(application.vacancyId.toString());
    if (!vacancy) {
      return NextResponse.json({ error: "Vacancy not found" }, { status: 404 });
    }

    const amountNPR = vacancy.applicationFee || 100;
    const amountPaisa = amountNPR * 100;

    const appBase =
      process.env.NEXT_PUBLIC_RETURN_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      request.nextUrl.origin;
    const locale = request.cookies.get("NEXT_LOCALE")?.value || "en";
    const returnTo = `${appBase}/${locale}/dashboard/applications?applicationId=${id}`;
    const returnUrl = `${appBase}/${locale}/payment/khalti/callback?applicationId=${id}&return_to=${encodeURIComponent(returnTo)}`;

    // Get customer info from application responses if available
    const personalResp = application.responses?.find((r) => r.fieldId === "personalDetails");
    const contactResp = application.responses?.find((r) => r.fieldId === "contactDetails");
    let customerInfo: { name: string; email: string; phone: string } | undefined;
    try {
      const personal = personalResp ? JSON.parse(personalResp.value as string) : {};
      const contact = contactResp ? JSON.parse(contactResp.value as string) : {};
      const name = `${personal.firstName || ""} ${personal.lastName || ""}`.trim();
      if (name && contact.email && contact.mobile) {
        customerInfo = { name, email: contact.email, phone: contact.mobile };
      }
    } catch {
      // skip customer_info if parsing fails
    }

    const khaltiResponse = await initiateKhaltiPayment({
      return_url: returnUrl,
      website_url: appBase,
      amount: amountPaisa,
      purchase_order_id: id,
      purchase_order_name: vacancy.titleEn || vacancy.titleNp || "Vacancy Application",
      ...(customerInfo ? { customer_info: customerInfo } : {}),
    });

    // Store pidx so we can verify later
    await updateApplication(id, {
      payment: JSON.stringify({
        provider: "khalti",
        pidx: khaltiResponse.pidx,
        amount: amountNPR,
        status: "PENDING",
        initiatedAt: new Date().toISOString(),
      }),
    });

    return NextResponse.json({ payment_url: khaltiResponse.payment_url });
  } catch (error) {
    console.error("Khalti payment initiation failed:", error);
    return NextResponse.json({ error: "Failed to initiate Khalti payment" }, { status: 500 });
  }
}
