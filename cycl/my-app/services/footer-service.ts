import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export interface FooterLinkItem {
  id: string;
  labelEn: string;
  labelNe: string;
  href: string;
}

export type SocialPlatform = "facebook" | "instagram" | "youtube" | "twitter" | "linkedin" | "tiktok";

export type ContactType = "phone" | "email" | "address";

export interface ContactItem {
  id: string;
  type: ContactType;
  labelEn: string;
  labelNe: string;
  href: string;
}

export interface FooterSettings {
  _id?: ObjectId;
  logoUrl: string;
  logoPublicId: string;
  descriptionEn: string;
  descriptionNe: string;
  usefulLinksTitleEn: string;
  usefulLinksTitleNe: string;
  usefulLinks: FooterLinkItem[];
  aboutUsTitleEn: string;
  aboutUsTitleNe: string;
  aboutUsLinks: FooterLinkItem[];
  socialLinks: Record<SocialPlatform, string>;
  contactUsTitleEn: string;
  contactUsTitleNe: string;
  contactItems: ContactItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

export const defaultFooterSettings: Omit<FooterSettings, "_id" | "createdAt" | "updatedAt"> = {
  logoUrl: "/cyc-logo.jpg",
  logoPublicId: "",
  descriptionEn:
    "CYC Nepal Laghubitta Bittiya Sanstha previously known as CYC (Chartare Youth Club) is a leading Microfinance in Nepal which is located in Sabhagriha Chowk, Pokhara.",
  descriptionNe: "",
  usefulLinksTitleEn: "Useful Links",
  usefulLinksTitleNe: "उपयोगी लिङ्कहरू",
  usefulLinks: [
    { id: "ul1", labelEn: "Nepal Rastra Bank", labelNe: "नेपाल राष्ट्र बैंक", href: "https://www.nrb.org.np" },
    { id: "ul2", labelEn: "Reliable Nepal Life Insurance", labelNe: "रिलायबल नेपाल लाइफ इन्स्योरेन्स", href: "https://reliablenepallife.com.np" },
    { id: "ul3", labelEn: "Karja Suchana Kendra", labelNe: "कर्जा सूचना केन्द्र", href: "https://www.karjasuchana.com.np" },
  ],
  aboutUsTitleEn: "About Us",
  aboutUsTitleNe: "हाम्रो बारेमा",
  aboutUsLinks: [
    { id: "au1", labelEn: "About", labelNe: "बारेमा", href: "/about-us" },
    { id: "au2", labelEn: "News", labelNe: "समाचार", href: "/news" },
    { id: "au3", labelEn: "Notices", labelNe: "सूचनाहरू", href: "/notices" },
    { id: "au4", labelEn: "Contact", labelNe: "सम्पर्क", href: "/contact" },
  ],
  socialLinks: {
    facebook: "",
    instagram: "",
    youtube: "",
    twitter: "",
    linkedin: "",
    tiktok: "",
  },
  contactUsTitleEn: "Contact Us",
  contactUsTitleNe: "सम्पर्क गर्नुहोस्",
  contactItems: [
    { id: "ct1", type: "phone", labelEn: "+(977) 061-590894", labelNe: "", href: "tel:+977061590894" },
    { id: "ct2", type: "email", labelEn: "info@cycnlbsl.org.np", labelNe: "", href: "mailto:info@cycnlbsl.org.np" },
    { id: "ct3", type: "address", labelEn: "Sabhagriha Chowk, Pokhara, Nepal", labelNe: "", href: "" },
  ],
};

const COLLECTION = "footer_settings";

export async function getFooterSettings(): Promise<FooterSettings> {
  const db = await getDb();
  const doc = await db.collection<FooterSettings & { _key?: string }>(COLLECTION).findOne({ _key: "footer" });
  if (!doc) return { ...defaultFooterSettings };
  return doc;
}

export async function upsertFooterSettings(
  data: Omit<FooterSettings, "_id" | "createdAt" | "updatedAt">,
): Promise<FooterSettings> {
  const db = await getDb();
  const now = new Date();
  const existing = await db.collection<FooterSettings & { _key?: string }>(COLLECTION).findOne({ _key: "footer" });

  if (existing?._id) {
    await db
      .collection<FooterSettings>(COLLECTION)
      .updateOne({ _id: existing._id }, { $set: { ...data, updatedAt: now } });
    return { ...existing, ...data, updatedAt: now };
  }

  const result = await db.collection<FooterSettings & { _key: string }>(COLLECTION).insertOne({
    _key: "footer",
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return { _id: result.insertedId, ...data, createdAt: now, updatedAt: now };
}
