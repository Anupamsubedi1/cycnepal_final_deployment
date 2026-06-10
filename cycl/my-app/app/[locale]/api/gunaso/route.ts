import { NextResponse } from "next/server";
import { sendGunasEmail } from "@/lib/email";
import { emailRegex } from "@/lib/validation";

const MAX = { name: 120, email: 200, phone: 30, complaintType: 100, message: 5000 } as const;

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
    }

    const b = body as Record<string, unknown>;
    const name = str(b.name);
    const email = str(b.email);
    const phone = str(b.phone);
    const complaintType = str(b.complaintType);
    const message = str(b.message);

    const errors: Record<string, string> = {};

    if (!name) errors.name = "Name is required.";
    else if (name.length > MAX.name) errors.name = "Name is too long.";

    if (!email) errors.email = "Email is required.";
    else if (!emailRegex.test(email) || email.length > MAX.email)
      errors.email = "A valid email is required.";

    if (phone.length > MAX.phone) errors.phone = "Phone number is too long.";

    if (!complaintType) errors.complaintType = "Please select a complaint type.";
    else if (complaintType.length > MAX.complaintType) errors.complaintType = "Complaint type is too long.";

    if (!message) errors.message = "Complaint details are required.";
    else if (message.length > MAX.message) errors.message = "Message is too long.";

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { success: false, error: "Please correct the highlighted fields.", errors },
        { status: 400 },
      );
    }

    await sendGunasEmail({
      senderName: name,
      senderEmail: email,
      senderPhone: phone,
      complaintType,
      message,
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Your complaint has been submitted. Our team will review it and respond within 3 business days.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Gunaso submission error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to submit your complaint. Please try again." },
      { status: 500 },
    );
  }
}
