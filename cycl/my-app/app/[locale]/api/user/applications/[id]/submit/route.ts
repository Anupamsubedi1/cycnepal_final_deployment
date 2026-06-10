import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthenticatedUser } from "@/lib/user-session";
import { getApplicationById, updateApplication } from "@/services/vacancy-application-service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(
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

    if (application.userId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (application.status !== "payment_pending") {
      return NextResponse.json({ error: "Application is already submitted" }, { status: 400 });
    }

    // Verify payment is complete before allowing submission
    let hasPaid = false;
    try {
      const topPayment = application.payment ? JSON.parse(application.payment) : {};
      const isPaidTop =
        String(topPayment?.status).toUpperCase() === "COMPLETE" && topPayment?.verified === true;

      const paymentResp = application.responses?.find((r) => r.fieldId === "paymentData");
      const paymentData = paymentResp ? JSON.parse(paymentResp.value as string) : {};
      const isPaidResp =
        String(paymentData?.status).toUpperCase() === "COMPLETE" && paymentData?.verified === true;

      hasPaid = isPaidTop || isPaidResp;
    } catch {}

    if (!hasPaid) {
      return NextResponse.json(
        { error: "Payment must be completed before submitting the application" },
        { status: 402 },
      );
    }

    await updateApplication(id, { status: "submitted" });

    return NextResponse.json({ message: "Application submitted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error submitting application:", error);
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
  }
}
