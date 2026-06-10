import { NextResponse } from "next/server";
import { getHeroSection, resolveHeroCopy, type HeroLocale } from "@/services/hero-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ locale: string }> },
) {
  try {
    const { locale } = await context.params;
    const hero = await getHeroSection();

    if (!hero) {
      return NextResponse.json(null);
    }

    const resolvedLocale: HeroLocale = locale === "ne" ? "ne" : "en";
    const copy = resolveHeroCopy(hero, resolvedLocale);

    return NextResponse.json({
      ...hero,
      ...copy,
    });
  } catch (error) {
    console.error("Error fetching hero section:", error);
    return NextResponse.json(
      { error: "Failed to fetch hero section" },
      { status: 500 },
    );
  }
}