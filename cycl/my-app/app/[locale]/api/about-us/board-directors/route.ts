import { NextResponse } from "next/server";
import { getAllBoardDirectors } from "@/services/board-of-directors-service";

export async function GET() {
  try {
    return NextResponse.json(await getAllBoardDirectors());
  } catch (error) {
    console.error("Error fetching board directors:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
