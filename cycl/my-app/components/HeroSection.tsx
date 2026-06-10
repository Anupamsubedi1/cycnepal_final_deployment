import { getHeroSection } from "@/services/hero-service";
import HeroCarousel from "@/components/HeroCarousel";
import { getLocale } from "next-intl/server";

export async function HeroSection() {
  const locale = await getLocale();
  const hero = await getHeroSection();

  if (!hero || hero.slides.length === 0) {
    const isNepali = locale === "ne";

    return (
      <section className="relative w-full h-[calc(100svh-60px)] max-h-[calc(100dvh-60px)] min-h-75 bg-linear-to-r from-gray-900 to-gray-800 flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">
            {isNepali ? "हाम्रो साइटमा स्वागत छ" : "Welcome to Our Site"}
          </h1>
          <p className="text-xl text-gray-300">
            {isNepali
              ? "अहिलेसम्म कुनै hero section सेट गरिएको छैन"
              : "No hero section configured yet"}
          </p>
        </div>
      </section>
    );
  }

  const title =
    locale === "ne"
      ? hero["title-ne"] || hero.title || hero["title-en"] || ""
      : hero["title-en"] || hero.title || hero["title-ne"] || "";
  const subtitle =
    locale === "ne"
      ? hero["subtitle-ne"] || hero.subtitle || hero["subtitle-en"] || ""
      : hero["subtitle-en"] || hero.subtitle || hero["subtitle-ne"] || "";

  return (
    <HeroCarousel
      title={title}
      subtitle={subtitle || undefined}
      slides={hero.slides}
    />
  );
}