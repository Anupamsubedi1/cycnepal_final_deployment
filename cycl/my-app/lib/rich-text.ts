import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitizes rich-text HTML (produced by the TipTap editor / stored CMS content)
 * before it is rendered via `dangerouslySetInnerHTML`.
 *
 * This is the single defense against **stored XSS** in CMS content: the admin
 * editor only constrains input on the client, so a crafted `POST` to an admin
 * content API could otherwise persist `<script>` / `onerror=` / `javascript:`
 * payloads that execute on public pages and in other admins' browsers.
 *
 * DOMPurify removes scripts, event-handler attributes and dangerous URL schemes
 * while preserving the formatting tags the editor emits (headings, lists,
 * bold/italic, links, etc.). Every `dangerouslySetInnerHTML` sink that renders
 * user/CMS-authored HTML MUST pass through this function.
 *
 * Works in both Server Components and Client Components (isomorphic).
 */
export function sanitizeRichText(html?: string | null): string {
  if (!html) {
    return "";
  }

  return DOMPurify.sanitize(html, {
    // Allow links to open in a new tab; DOMPurify still strips javascript:/data:
    // and other dangerous protocols from href/src regardless.
    ADD_ATTR: ["target", "rel"],
  });
}

export function hasRichTextContent(value?: string | null) {
  if (!value) {
    return false;
  }

  // Strip tags, decode the common &nbsp; entity, then trim — String.trim()
  // also removes literal non-breaking spaces (U+00A0), so a value containing
  // only whitespace/nbsp correctly reports as empty.
  const text = value
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();

  return text.length > 0;
}
