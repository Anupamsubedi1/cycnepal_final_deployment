"use client";

import { useEffect, useRef, type ChangeEvent } from "react";

type RichTextEditorProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helperText?: string;
  uploadImageEndpoint?: string;
};

function sanitizeLink(url: string) {
  const trimmed = url.trim();
  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("mailto:")) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function escapeHtmlAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function RichTextEditor({
  label,
  value,
  onChange,
  placeholder,
  helperText,
  uploadImageEndpoint,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const isMountedRef = useRef(false);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    if (!isMountedRef.current) {
      // On mount always initialize regardless of innerHTML
      isMountedRef.current = true;
      editor.innerHTML = value || "<p><br></p>";
      return;
    }

    // After mount, only update if external value differs to avoid cursor reset while typing
    if (editor.innerHTML !== value) {
      editor.innerHTML = value || "<p><br></p>";
    }
  }, [value]);

  const syncEditorValue = () => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    onChange(editor.innerHTML);
  };

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      savedRangeRef.current = selection.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    const selection = window.getSelection();
    const range = savedRangeRef.current;

    if (!selection || !range) {
      return;
    }

    selection.removeAllRanges();
    selection.addRange(range);
  };

  const runCommand = (command: string, commandValue?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    syncEditorValue();
  };

  const handleHeadingChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const heading = event.target.value;
    editorRef.current?.focus();

    if (heading === "normal") {
      document.execCommand("formatBlock", false, "p");
    } else {
      document.execCommand("formatBlock", false, heading);
    }

    syncEditorValue();
  };

  const handleLink = () => {
    const url = window.prompt("Enter a link URL");
    if (!url) {
      return;
    }

    const safeUrl = sanitizeLink(url);
    if (!safeUrl) {
      return;
    }

    editorRef.current?.focus();
    document.execCommand("createLink", false, safeUrl);
    syncEditorValue();
  };

  const handleImage = () => {
    if (uploadImageEndpoint) {
      imageInputRef.current?.click();
      return;
    }

    const url = window.prompt("Enter an image URL");
    if (!url) {
      return;
    }

    const safeUrl = sanitizeLink(url);
    if (!safeUrl) {
      return;
    }

    const altText = window.prompt("Enter alt text for the image (optional)") || "";
    const imageMarkup = `<img src="${escapeHtmlAttribute(safeUrl)}" alt="${escapeHtmlAttribute(altText)}" style="max-width:100%;height:auto;display:block;margin:1rem 0;" />`;

    editorRef.current?.focus();
    document.execCommand("insertHTML", false, imageMarkup);
    syncEditorValue();
  };

  const insertImageHtml = (src: string, altText: string) => {
    editorRef.current?.focus();
    restoreSelection();

    const imageMarkup = `<img src="${escapeHtmlAttribute(src)}" alt="${escapeHtmlAttribute(altText)}" style="max-width:100%;height:auto;display:block;margin:1rem 0;" />`;
    document.execCommand("insertHTML", false, imageMarkup);
    syncEditorValue();
  };

  const handleUploadImageClick = () => {
    imageInputRef.current?.click();
  };

  const handleUploadImageFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !uploadImageEndpoint) {
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(uploadImageEndpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = (await response.json()) as { url?: string; secure_url?: string };
      const uploadedUrl = result.url || result.secure_url;

      if (!uploadedUrl) {
        throw new Error("Upload failed");
      }

      const altText = window.prompt("Enter alt text for the image (optional)") || file.name;
      insertImageHtml(uploadedUrl, altText);
    } catch {
      window.alert("Image upload failed");
    }
  };

  const handleClearFormatting = () => {
    editorRef.current?.focus();
    document.execCommand("removeFormat");
    document.execCommand("unlink");
    syncEditorValue();
  };

  return (
    <div className="w-full max-w-full">
      <label className="mb-1 block text-sm font-medium text-zinc-900">{label}</label>
      {helperText && <p className="mb-2 text-xs text-zinc-500">{helperText}</p>}

      <div className="w-full max-w-full overflow-hidden rounded-xl border border-zinc-300 bg-white shadow-sm">
        <div className="flex flex-wrap gap-1 border-b border-zinc-200 bg-zinc-50 p-2">
          <select
            defaultValue="normal"
            onChange={handleHeadingChange}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-800"
            aria-label="Text style"
          >
            <option value="normal">Normal</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
          </select>

          <ToolbarButton label="Bold" onClick={() => runCommand("bold")} />
          <ToolbarButton label="Italic" onClick={() => runCommand("italic")} />
          <ToolbarButton label="Underline" onClick={() => runCommand("underline")} />
          <ToolbarButton label="Strike" onClick={() => runCommand("strikeThrough")} />
          <ToolbarButton label="Quote" onClick={() => runCommand("formatBlock", "blockquote")} />
          <ToolbarButton label="List" onClick={() => runCommand("insertUnorderedList")} />
          <ToolbarButton label="Numbered" onClick={() => runCommand("insertOrderedList")} />
          <ToolbarButton label="Link" onClick={handleLink} />
          <ToolbarButton label="Image" onClick={handleImage} />
          <ToolbarButton label="Clear" onClick={handleClearFormatting} />
        </div>

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          data-placeholder={placeholder || "Write content here..."}
          className="rich-text-editor min-h-[220px] max-w-full overflow-x-auto break-words px-4 py-3 text-sm leading-7 text-zinc-900 outline-none [&_img]:h-auto [&_img]:max-w-full"
          onMouseUp={saveSelection}
          onKeyUp={saveSelection}
          onFocus={saveSelection}
          onInput={syncEditorValue}
          onBlur={syncEditorValue}
        />

        {uploadImageEndpoint && (
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUploadImageFile}
          />
        )}
      </div>
    </div>
  );
}

type ToolbarButtonProps = {
  label: string;
  onClick: () => void;
};

function ToolbarButton({ label, onClick }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-100"
    >
      {label}
    </button>
  );
}
