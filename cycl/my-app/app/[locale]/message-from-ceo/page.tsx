import { PublicPageShell } from "@/components/public/PublicPageShell";
import { getMessageFromCeo } from "@/services/message-from-ceo-service";
import { MessageFromCeoSection } from "@/components/public/MessageFromCeoSection";

export default async function MessageFromCeoPage() {
  const messageFromCeo = await getMessageFromCeo();
  const messageFromCeoPublic = messageFromCeo
    ? {
        heading: messageFromCeo.heading,
        description: messageFromCeo.description,
        imageUrl: messageFromCeo.imageUrl,
        imagePublicId: messageFromCeo.imagePublicId,
      }
    : null;

  return (
    <PublicPageShell
    imageUrl="/banner/banner.jpg"
      eyebrow="Leadership"
      title={messageFromCeo?.heading || "Message From CEO"}
      description="A complete note from the CEO highlighting our institutional vision, service commitment, and direction for sustainable financial inclusion."
      actions={[
        { label: "Back to Home", href: "/" },
        { label: "Contact Us", href: "/contact" },
      ]}
    >
      <MessageFromCeoSection
        messageFromCeo={messageFromCeoPublic}
        buttonLabel="Return Home"
        buttonHref="/"
      />
    </PublicPageShell>
  );
}
