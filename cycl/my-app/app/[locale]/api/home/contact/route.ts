import { NextResponse } from "next/server";
import { getContactDetails, type ContactDetails } from "@/services/contact-service";

type ContactItemLike =
  | ContactDetails["phone"]
  | {
      text?: unknown;
      textNe?: unknown;
      link?: unknown;
    }
  | string
  | null
  | undefined;

function normalizeContactItem(item: ContactItemLike) {
  if (typeof item === "string") {
    return { text: item, textNe: "", link: "" };
  }

  return {
    text: typeof item?.text === "string" ? item.text : "",
    textNe: typeof (item as { textNe?: unknown })?.textNe === "string"
      ? (item as { textNe: string }).textNe
      : "",
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
      return NextResponse.json(null);
    }

    return NextResponse.json(normalizeStoredContact(contact));
  } catch (error) {
    console.error("Error fetching contact details:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact details" },
      { status: 500 },
    );
  }
}