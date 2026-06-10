import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getVacancyById } from "@/services/vacancy-service";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  _request: Request,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Validate ID format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid vacancy ID" },
        { status: 400 },
      );
    }

    const vacancy = await getVacancyById(id);
    if (!vacancy) {
      return NextResponse.json(
        { error: "Vacancy not found" },
        { status: 404 },
      );
    }

    // Check if vacancy is active
    if (!vacancy.isActive) {
      return NextResponse.json(
        { error: "This vacancy is no longer available" },
        { status: 404 },
      );
    }

    return NextResponse.json(vacancy, { status: 200 });
  } catch (error) {
    console.error("Error fetching vacancy:", error);
    return NextResponse.json(
      { error: "Failed to fetch vacancy" },
      { status: 500 },
    );
  }
}
