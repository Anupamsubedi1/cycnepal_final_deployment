import { NextResponse } from "next/server";
import { getActiveVacancies } from "@/services/vacancy-service";

export async function GET(): Promise<NextResponse> {
  try {
    const vacancies = await getActiveVacancies();

    return NextResponse.json(vacancies, { status: 200 });
  } catch (error) {
    console.error("Error fetching vacancies:", error);
    return NextResponse.json(
      { error: "Failed to fetch vacancies" },
      { status: 500 },
    );
  }
}
