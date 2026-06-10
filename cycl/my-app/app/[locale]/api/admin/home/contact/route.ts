import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequestCookies } from "@/lib/admin-auth";
import {
  getAllContactDetails,
  createContactDetails,
  updateContactDetails,
  deleteContactDetails,
  type ContactDetails,
} from "@/services/contact-service";

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

function normalizeCreatePayload(
  payload: Partial<Omit<ContactDetails, "_id">>,
): Omit<ContactDetails, "_id"> {
  return {
    phone: normalizeContactItem(payload.phone),
    email: normalizeContactItem(payload.email),
    facebook: normalizeContactItem(payload.facebook),
    whatsapp: normalizeContactItem(payload.whatsapp),
    location: normalizeContactItem(payload.location),
    isActive: Boolean(payload.isActive),
  };
}

function normalizeUpdatePayload(payload: Partial<ContactDetails>) {
  const normalized: Partial<ContactDetails> = {
    ...payload,
  };

  if (payload.phone !== undefined) {
    normalized.phone = normalizeContactItem(payload.phone);
  }

  if (payload.email !== undefined) {
    normalized.email = normalizeContactItem(payload.email);
  }

  if (payload.facebook !== undefined) {
    normalized.facebook = normalizeContactItem(payload.facebook);
  }

  if (payload.whatsapp !== undefined) {
    normalized.whatsapp = normalizeContactItem(payload.whatsapp);
  }

  if (payload.location !== undefined) {
    normalized.location = normalizeContactItem(payload.location);
  }

  return normalized;
}

function normalizeResponseContact(contact: ContactDetails | null) {
  if (!contact) {
    return null;
  }

  return normalizeStoredContact(contact);
}

function hasValidContactItem(item: { text?: string; link?: string } | undefined) {
  return Boolean(item?.text?.trim() && item?.link?.trim());
}

function hasValidContactDetails(details: ContactDetails | undefined) {
  if (!details) return false;

  return (
    hasValidContactItem(details.phone) &&
    hasValidContactItem(details.email) &&
    hasValidContactItem(details.facebook) &&
    hasValidContactItem(details.whatsapp) &&
    hasValidContactItem(details.location)
  );
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (id) {
      const contacts = await getAllContactDetails();
      const contact = contacts.find((c) => c._id?.toString() === id);
      return NextResponse.json(normalizeResponseContact(contact || null));
    }

    const contacts = await getAllContactDetails();
    return NextResponse.json(contacts.map(normalizeStoredContact));
  } catch (error) {
    console.error("Error fetching contact details:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact details" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawData = (await request.json()) as Partial<Omit<ContactDetails, "_id">>;
    const data = normalizeCreatePayload(rawData);

    if (!hasValidContactDetails(data)) {
      return NextResponse.json(
        {
          error:
            "All contact details (phone, email, facebook, whatsapp) and location are required",
        },
        { status: 400 },
      );
    }

    const contact = await createContactDetails(data);
    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error("Error creating contact details:", error);
    return NextResponse.json(
      { error: "Failed to create contact details" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Contact ID is required" },
        { status: 400 },
      );
    }

    const rawData = (await request.json()) as Partial<ContactDetails>;
    const data = normalizeUpdatePayload(rawData);

    // If isActive is being set, we still need all contact fields to be valid
    if (data.isActive && !hasValidContactDetails(data as ContactDetails)) {
      return NextResponse.json(
        {
          error:
            "All contact details (phone, email, facebook, whatsapp) and location are required",
        },
        { status: 400 },
      );
    }

    const contact = await updateContactDetails(id, data);
    if (!contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.error("Error updating contact details:", error);
    return NextResponse.json(
      { error: "Failed to update contact details" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAdminSessionFromRequestCookies();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Contact ID is required" },
        { status: 400 },
      );
    }

    const deleted = await deleteContactDetails(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting contact details:", error);
    return NextResponse.json(
      { error: "Failed to delete contact details" },
      { status: 500 },
    );
  }
}
