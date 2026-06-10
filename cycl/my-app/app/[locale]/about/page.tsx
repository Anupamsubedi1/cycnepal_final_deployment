import { redirect } from "next/navigation";

type AboutPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale = "en" } = await params;
  redirect(`/${locale}/about-us`);
}
