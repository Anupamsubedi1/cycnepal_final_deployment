import { NextResponse } from "next/server";
import { getContactDetails, type ContactDetails } from "@/services/contact-service";
import { createContactMessage } from "@/services/contact-message-service";
import { emailRegex } from "@/lib/validation";
import { sendContactEmail } from "@/lib/email";

type ContactItemLike =
  | ContactDetails["phone"]
  | {
      text?: unknown;
      link?: unknown;
    }
  | string
  | null
  | undefined;

function normalizeContactItem(item: ContactItemLike) {
  if (typeof item === "string") {
    return { text: item, link: "" };
  }

  return {
    text: typeof item?.text === "string" ? item.text : "",
    link: typeof item?.link === "string" ? item.link : "",
  };
}

function normalizeStoredContact(contact: ContactDetails): ContactDetails {
  return {
    ...contact,
    phone: normalizeContactItem(contact.phone),
    email: normalizeContactItem(contact.email),
    facebook: normalizeContactItem(contact.facebook),
    whatsapp: normalizeContactItem(contact.whatsapp),
    location: normalizeContactItem(contact.location),
  };
}

export async function GET() {
  try {
    const contact = await getContactDetails();

    if (!contact) {
      return NextResponse.json(
        { error: "Contact details not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(normalizeStoredContact(contact), { status: 200 });
  } catch (error) {
    console.error("Error fetching public contact details:", error);
    return NextResponse.json(
      { error: "Failed to retrieve contact details" },
      { status: 500 },
    );
  }
}

// Public contact-form submission. Persists a message to `contact_messages`.
const MAX = { name: 120, email: 200, subject: 200, message: 5000 } as const;

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
    }

    const name = str((body as Record<string, unknown>).name);
    const email = str((body as Record<string, unknown>).email);
    const subject = str((body as Record<string, unknown>).subject);
    const message = str((body as Record<string, unknown>).message);

    const errors: Record<string, string> = {};
    if (!name) errors.name = "Name is required.";
    else if (name.length > MAX.name) errors.name = "Name is too long.";

    if (!email) errors.email = "Email is required.";
    else if (!emailRegex.test(email) || email.length > MAX.email)
      errors.email = "A valid email is required.";

    if (subject.length > MAX.subject) errors.subject = "Subject is too long.";

    if (!message) errors.message = "Message is required.";
    else if (message.length > MAX.message) errors.message = "Message is too long.";

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { success: false, error: "Please correct the highlighted fields.", errors },
        { status: 400 },
      );
    }

    await createContactMessage({ name, email, subject, message });

    try {
      await sendContactEmail({ senderName: name, senderEmail: email, subject, message });
    } catch (mailErr) {
      console.error("Contact email send failed (message still saved):", mailErr);
    }

    return NextResponse.json(
      { success: true, message: "Thank you. Your message has been submitted successfully." },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error submitting contact message:", error);
    return NextResponse.json(
      { success: false, error: "Unable to submit your message right now." },
      { status: 500 },
    );
  }
}
