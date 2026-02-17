"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/* ── Toolbar icon SVG paths ────────────────────────────── */
const icons: Record<string, string> = {
  bold: "M6.5 4v3H10c1.1 0 2-.9 2-2s-.9-2-2-2H6.5zM6.5 10.5v3H11c1.1 0 2-.9 2-2s-.9-2-2-2H6.5z",
  italic: "M10 4v1.5h2.21l-3.42 8H6v1.5h8V13.5h-2.21l3.42-8H18V4h-8z",
  strikethrough:
    "M10 13h4v-1.5H10V13zM3 12h18v-1H3v1zm7.5-5.5v2h3v-2h-3zm0 9v2h3v-2h-3z",
  heading: "M5 4v3h5.5v12h3V7H19V4H5z",
  link: "M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z",
  image:
    "M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z",
  code: "M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z",
  list: "M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z",
  quote: "M6 17h3l2-4V7H5v6h3l-2 4zm8 0h3l2-4V7h-6v6h3l-2 4z",
  divider: "M2 11h8v2H2v-2zm10 0h10v2H12v-2z",
  table:
    "M3 3v18h18V3H3zm8 16H5v-6h6v6zm0-8H5V5h6v6zm8 8h-6v-6h6v6zm0-8h-6V5h6v6z",
};

/* ── Simple markdown → HTML (no external library) ────── */
export function markdownToHtml(md: string): string {
  let html = md
    // Code blocks
    .replace(
      /```(\w*)\n([\s\S]*?)```/g,
      '<pre class="bg-gray-900 text-green-300 rounded-lg p-4 overflow-x-auto text-sm font-mono my-4"><code>$2</code></pre>',
    )
    // Headings
    .replace(
      /^#### (.+)$/gm,
      '<h4 class="text-base font-semibold mt-6 mb-2">$1</h4>',
    )
    .replace(
      /^### (.+)$/gm,
      '<h3 class="text-lg font-semibold mt-6 mb-2">$1</h3>',
    )
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-8 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
    // HR
    .replace(/^---$/gm, '<hr class="my-6 border-gray-200" />')
    // Bold & Italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/~~(.+?)~~/g, "<del>$1</del>")
    // Inline code
    .replace(
      /`([^`]+)`/g,
      '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-rose-600">$1</code>',
    )
    // Images
    .replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      '<img src="$2" alt="$1" class="rounded-lg my-4 max-w-full" />',
    )
    // Links
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-indigo-600 underline underline-offset-2">$1</a>',
    )
    // Blockquotes
    .replace(
      /^> (.+)$/gm,
      '<blockquote class="border-l-4 border-indigo-300 pl-4 italic text-gray-600 my-4">$1</blockquote>',
    )
    // Unordered list
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    // Paragraphs: wrap remaining lines
    .replace(
      /^(?!<[hblupdi]|<li|<hr|<pre|<code|<img|<a|<strong|<em|<del)(.+)$/gm,
      "<p>$1</p>",
    );
  // Wrap adjacent <li> in <ul>
  html = html.replace(
    /(<li[^>]*>[\s\S]*?<\/li>\n?)+/g,
    (match) => `<ul class="my-3 space-y-1">${match}</ul>`,
  );
  return html;
}

/* ── Props ──────────────────────────────────────────────── */
interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Minimum height for the editor textarea in px */
  minHeight?: number;
}

/* ── Component ──────────────────────────────────────────── */
export default function MarkdownEditor({
  value,
  onChange,
  placeholder = "Tulis konten dengan Markdown...",
  disabled = false,
  minHeight = 400,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  // Mobile: tab toggle; Desktop: always split
  const [mobileTab, setMobileTab] = useState<"write" | "preview">("write");

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.max(minHeight, ta.scrollHeight) + "px";
    }
  }, [value, minHeight]);

  // Insert markdown helper
  const insertMarkdown = useCallback(
    (before: string, after: string = "") => {
      if (disabled) return;
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const selected = value.substring(start, end);
      const newText =
        value.substring(0, start) +
        before +
        selected +
        after +
        value.substring(end);
      onChange(newText);
      setTimeout(() => {
        ta.focus();
        ta.selectionStart = start + before.length;
        ta.selectionEnd = start + before.length + selected.length;
      }, 0);
    },
    [value, onChange, disabled],
  );

  // Upload image handler
  const handleImageUpload = useCallback(
    async (file: File) => {
      if (disabled || uploading) return;
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowed = [".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp"];
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      if (!allowed.includes(ext)) {
        alert(
          "Format file tidak didukung. Gunakan JPG, PNG, GIF, SVG, atau WebP.",
        );
        return;
      }
      if (file.size > maxSize) {
        alert("Ukuran file melebihi 10MB.");
        return;
      }

      setUploading(true);
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("access_token")
            : null;
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`${API_URL}/admin/media/upload`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Upload gagal");
        }
        const data = await res.json();
        if (data.url) {
          insertMarkdown(`![${file.name}](${data.url})\n`, "");
        }
      } catch (err) {
        alert(err instanceof Error ? err.message : "Gagal upload gambar");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [disabled, uploading, insertMarkdown],
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (disabled) return;
      if (!e.ctrlKey && !e.metaKey) return;
      const key = e.key.toLowerCase();
      if (key === "b") {
        e.preventDefault();
        insertMarkdown("**", "**");
      } else if (key === "i") {
        e.preventDefault();
        insertMarkdown("*", "*");
      } else if (key === "k") {
        e.preventDefault();
        insertMarkdown("[", "](url)");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [insertMarkdown, disabled]);

  // Toolbar groups
  const toolbarGroups = [
    [
      {
        icon: "bold",
        title: "Bold",
        shortcut: "⌘B",
        action: () => insertMarkdown("**", "**"),
      },
      {
        icon: "italic",
        title: "Italic",
        shortcut: "⌘I",
        action: () => insertMarkdown("*", "*"),
      },
      {
        icon: "strikethrough",
        title: "Strikethrough",
        action: () => insertMarkdown("~~", "~~"),
      },
    ],
    [
      {
        icon: "heading",
        title: "Heading",
        action: () => insertMarkdown("## "),
      },
      {
        icon: "quote",
        title: "Blockquote",
        action: () => insertMarkdown("> "),
      },
      {
        icon: "divider",
        title: "Divider",
        action: () => insertMarkdown("\n---\n"),
      },
    ],
    [
      {
        icon: "list",
        title: "Bullet List",
        action: () => insertMarkdown("- "),
      },
      {
        icon: "code",
        title: "Code Block",
        action: () => insertMarkdown("```\n", "\n```"),
      },
      {
        icon: "table",
        title: "Table",
        action: () =>
          insertMarkdown(
            "| Header | Header |\n| ------ | ------ |\n| Cell   | Cell   |\n",
          ),
      },
    ],
    [
      {
        icon: "link",
        title: "Link",
        shortcut: "⌘K",
        action: () => insertMarkdown("[", "](url)"),
      },
      {
        icon: "image",
        title: "Upload Image",
        action: () => fileInputRef.current?.click(),
      },
    ],
  ];

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  /* ── Toolbar Row ──────────────────────────────────────── */
  const ToolbarRow = () => (
    <div className="flex flex-wrap items-center gap-0.5">
      {toolbarGroups.map((group, gi) => (
        <div key={gi} className="flex items-center">
          {gi > 0 && <div className="mx-1 h-5 w-px bg-gray-200 sm:mx-1.5" />}
          {group.map((t) => (
            <button
              key={t.icon}
              onClick={t.action}
              disabled={disabled}
              title={`${t.title}${t.shortcut ? ` (${t.shortcut})` : ""}`}
              className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-all hover:bg-indigo-50 hover:text-indigo-600 disabled:pointer-events-none disabled:opacity-40 sm:h-8 sm:w-8"
            >
              <svg
                className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d={icons[t.icon]} />
              </svg>
            </button>
          ))}
        </div>
      ))}
    </div>
  );

  /* ── Preview Panel ────────────────────────────────────── */
  const previewPanel = (
    <div className="prose prose-sm max-w-none">
      {value ? (
        <div
          className="text-[15px] leading-[1.8] text-gray-800"
          dangerouslySetInnerHTML={{ __html: markdownToHtml(value) }}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg
            className="h-10 w-10 text-gray-200"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
          <p className="mt-3 text-sm text-gray-400">
            Belum ada konten untuk di-preview
          </p>
        </div>
      )}
    </div>
  );

  /* ── Editor Textarea ──────────────────────────────────── */
  const editorTextarea = (
    <textarea
      ref={textareaRef}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      style={{ minHeight: `${minHeight}px` }}
      className="w-full resize-none border-none bg-transparent font-mono text-sm leading-[1.8] text-gray-800 outline-none placeholder:text-gray-300 disabled:cursor-not-allowed disabled:opacity-60"
    />
  );

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/svg+xml,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleImageUpload(f);
        }}
      />
      {/* Toolbar + View Toggle */}
      <div className="flex flex-col gap-2 border-b border-gray-100 bg-gray-50/60 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        {/* Mobile tab toggle (hidden on md+) */}
        <div className="flex items-center justify-between md:hidden">
          <div className="flex gap-0.5 rounded-lg bg-gray-100 p-0.5">
            <button
              onClick={() => setMobileTab("write")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                mobileTab === "write"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                />
              </svg>
              Editor
            </button>
            <button
              onClick={() => setMobileTab("preview")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                mobileTab === "preview"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Preview
            </button>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-400">
            <span>{wordCount} kata</span>
            <span>~{readTime} min</span>
          </div>
        </div>

        {/* Toolbar (always visible on desktop; on mobile only in write tab) */}
        <div
          className={`${mobileTab === "preview" ? "hidden md:flex" : "flex"}`}
        >
          <ToolbarRow />
        </div>

        {/* Upload indicator */}
        {uploading && (
          <div className="flex items-center gap-1.5 rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-600">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-sky-200 border-t-sky-600" />
            Mengupload...
          </div>
        )}

        {/* Desktop stats + label (hidden on mobile) */}
        <div className="hidden items-center gap-3 md:flex">
          <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-2.5 py-1 text-[11px] text-gray-400">
            <span>{wordCount} kata</span>
            <span className="text-gray-300">·</span>
            <span>~{readTime} min</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-gray-400">
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"
              />
            </svg>
            <span>Split view</span>
          </div>
        </div>
      </div>

      {/* ── Mobile: Tab toggle view ─────────────────────── */}
      <div className="md:hidden">
        {mobileTab === "write" ? (
          <div className="p-4">{editorTextarea}</div>
        ) : (
          <div className="p-4">{previewPanel}</div>
        )}
      </div>

      {/* ── Desktop: Side-by-side split view ────────────── */}
      <div className="hidden md:flex">
        {/* Left: Editor */}
        <div
          className="flex-1 overflow-y-auto border-r border-gray-100 p-5"
          style={{ maxHeight: `calc(${minHeight}px + 8rem)` }}
        >
          {editorTextarea}
        </div>
        {/* Right: Preview */}
        <div
          className="flex-1 overflow-y-auto bg-gray-50/30 p-5"
          style={{ maxHeight: `calc(${minHeight}px + 8rem)` }}
        >
          {previewPanel}
        </div>
      </div>
    </div>
  );
}
