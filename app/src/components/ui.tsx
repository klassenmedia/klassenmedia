"use client";

import { useEffect } from "react";
import { Platform, PLATFORMS, PostStatus, STATUS_LABELS } from "@/lib/types";

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
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
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
    scheduled: "bg-accent-soft text-accent",
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
      "bg-accent text-white hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100",
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
