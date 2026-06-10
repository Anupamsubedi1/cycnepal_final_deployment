import { sanitizeRichText } from "@/lib/rich-text";

type RichTextContentProps = {
  html: string | undefined;
  className?: string;
};

export function RichTextContent({ html, className = "" }: RichTextContentProps) {
  if (!html) return null; // Don't render the wrapper div if there's no content

  // Sanitize CMS-authored HTML before injecting it — defends against stored XSS.
  const clean = sanitizeRichText(html);
  if (!clean) return null;

  return <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
}
