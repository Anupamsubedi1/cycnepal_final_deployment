import { getTranslations } from "next-intl/server";
import Image from "next/image";

type AboutUsPillarsProps = {
  vision: string;
  mission: string;
  goals: string[];
};

type PillarCard = {
  title: string;
  content?: string;
  imageUrl?: string;
  items?: string[];
};

export async function AboutUsPillars({
  vision,
  mission,
  goals,
}: AboutUsPillarsProps) {
  const t = await getTranslations("about-us");
  const cards: PillarCard[] = [
    {
      title: `${t("vision_title")}`,
      content: vision,
      imageUrl: "/aboutusPillars/vision.png",
    },
    {
      title: `${t("mission_title")}`,
      content: mission,
      imageUrl: "/aboutusPillars/mission.png",
    },
    { title: `${t("goals_title")}`, items: goals, imageUrl: "/aboutusPillars/goals.png" },
  ];

  return (
    <section className="mt-10">
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <article
            key={card.title}
            className="flex h-full flex-col bg-white text-teal-mid shadow-[0_12px_28px_rgba(0,0,0,0.12)] duration-300 ease-out transform hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-2 bg-teal-mid text-white px-6 py-4">
              <h3 className="text-[24px] font-bold uppercase tracking-[4px]">
                {card.title}
              </h3>
              <div className="h-10 w-10 rounded-full flex items-center justify-center bg-white">
               <Image
                  src={`${card.imageUrl}`}
                  alt={`${card.title} icon`} height={80} width={80} />
              </div>
            </div>

            {card.content ? (
              <p className="mt-2 ext-base leading-6 text-teal-deep px-6 pb-4">
                {card.content}
              </p>
            ) : (
              <ul className="mt-2 space-y-2 text-base leading-6 w-full px-6 pb-4 list-disc list-inside marker:text-teal-deep">
                {card.items?.map((item) => (
                  <li key={item} className="pl-1">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
