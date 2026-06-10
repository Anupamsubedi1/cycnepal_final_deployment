import { NextRequest, NextResponse } from "next/server";
import { getAllMessagesFromCeo, getMessageFromCeo } from "@/services/message-from-ceo-service";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (id) {
      const messages = await getAllMessagesFromCeo();
      const message = messages.find((item) => item._id?.toString() === id);
      return NextResponse.json(message || null);
    }

    const message = await getMessageFromCeo();
    return NextResponse.json(message || null);
  } catch (error) {
    console.error("Error fetching message from CEO:", error);
    return NextResponse.json(
      { error: "Failed to fetch message from CEO" },
      { status: 500 },
    );
  }
}