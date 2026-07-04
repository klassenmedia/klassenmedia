"use client";

import { useEffect } from "react";
import { Platform, PLATFORMS, PostFormat, PostStatus, STATUS_LABELS } from "@/lib/types";

/** Kleines Format-Icon (Bild / Video / Karussell / Story / Text) */
export function FormatIcon({ format, size = 12 }: { format: PostFormat; size?: number }) {
  const paths: Record<PostFormat, React.ReactNode> = {
    text: (
      <path d="M2.5 4h9M2.5 7h9M2.5 10h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    ),
    image: (
      <>
        <rect x="2" y="2.5" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <circle cx="5.2" cy="5.7" r="1" fill="currentColor" />
        <path d="M3.5 10.5l3-3 2 2 1.8-1.8 1.7 1.7" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
      </>
    ),
    video: (
      <>
        <rect x="2" y="2.5" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <path d="M6 5.2l3 1.8-3 1.8V5.2z" fill="currentColor" />
      </>
    ),
    carousel: (
      <>
        <rect x="1.5" y="3.5" width="8" height="8" rx="1.2" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <path d="M11.5 4.5c.6 0 1 .4 1 1v5c0 .6-.4 1-1 1" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </>
    ),
    story: (
      <>
        <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.2" fill="none" strokeDasharray="3 1.6" />
        <circle cx="7" cy="7" r="2.2" fill="currentColor" />
      </>
    ),
  };
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" className="shrink-0">
      {paths[format]}
    </svg>
  );
}

export function PlatformChip({
  platform,
  size = 24,
}: {
  platform: Platform;
  size?: number;
}) {
  const p = PLATFORMS[platform];
  return (
    <span
      title={p.label}
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-accent-contrast"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: p.color,
      }}
    >
      {p.short}
    </span>
  );
}

export function StatusBadge({ status }: { status: PostStatus }) {
  const styles: Record<PostStatus, string> = {
    draft: "bg-surface-2 text-muted",
    scheduled: "bg-accent-soft text-accent-fg",
    published: "bg-success/15 text-success",
    failed: "bg-danger/15 text-danger",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-[8vh] backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full ${wide ? "max-w-2xl" : "max-w-md"} rounded-2xl border border-line bg-surface p-6 shadow-2xl`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Schließen"
            className="rounded-lg p-1.5 text-muted transition hover:bg-surface-2 hover:text-foreground"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
}) {
  const styles = {
    primary:
      "bg-accent text-accent-contrast hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100",
    ghost:
      "border border-line bg-transparent text-foreground hover:bg-surface-2 disabled:opacity-40",
    danger: "bg-danger/15 text-danger hover:bg-danger/25 disabled:opacity-40",
  } as const;
  return (
    <button
      className={`rounded-xl px-4 py-2 text-sm font-medium transition ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export const inputCls =
  "w-full rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm outline-none transition placeholder:text-muted/60 focus:border-accent";
