import { getLocale } from "next-intl/server";
import { getMarqueeSettings, defaultMarqueeText } from "@/services/marquee-service";
import BottomMarqueeClient from "./BottomMarqueeClient";

export default async function BottomMarquee() {
  const locale = await getLocale();
  const isNe = locale === "ne";
  const s = await getMarqueeSettings();

  const content = (isNe && s.textNe) ? s.textNe : (s.textEn || defaultMarqueeText);

  return <BottomMarqueeClient content={content} />;
}
