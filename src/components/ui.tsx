import clsx from "clsx";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  PropsWithChildren,
  SelectHTMLAttributes
} from "react";
import type { StatusTone } from "@/types/domain";

export function Panel({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <section
      className={clsx(
        "rounded-lg border bg-[var(--bg)] p-4 shadow-panel",
        "border-[var(--line)]",
        className
      )}
    >
      {children}
    </section>
  );
}

export function StatusBadge({
  children,
  tone = "neutral"
}: PropsWithChildren<{ tone?: StatusTone }>) {
  return (
    <span
      className={clsx(
        "inline-flex min-h-6 items-center gap-1 rounded-full bg-[var(--bg2)] px-2 text-[11px] font-bold",
        tone === "good" && "text-[var(--success)]",
        tone === "warn" && "text-[var(--warning)]",
        tone === "bad" && "text-[var(--danger)]",
        tone === "neutral" && "text-[var(--text2)]"
      )}
    >
      {children}
    </span>
  );
}

export function Button({
  children,
  variant = "secondary",
  className,
  ...props
}: PropsWithChildren<
  {
    variant?: "primary" | "secondary";
    className?: string;
  } & ButtonHTMLAttributes<HTMLButtonElement>
>) {
  return (
    <button
      className={clsx(
        "min-h-9 rounded-lg border px-3 font-medium transition",
        variant === "primary"
          ? "border-[var(--cyan)] bg-[var(--cyan)] text-[#001a2a]"
          : "border-[var(--line)] bg-[var(--bg)] text-[var(--text)] hover:border-[var(--cyan)]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="min-h-9 w-full rounded-lg border border-[var(--line)] bg-[var(--bg2)] px-3 text-[var(--text)] outline-none focus:border-[var(--cyan)]"
      {...props}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className="min-h-9 w-full rounded-lg border border-[var(--line)] bg-[var(--bg2)] px-3 text-[var(--text)] outline-none focus:border-[var(--cyan)]"
      {...props}
    />
  );
}

export function ListRow({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={clsx("grid min-h-[54px] gap-1 rounded-lg border border-[var(--line)] bg-[var(--bg2)] p-3", className)}>
      {children}
    </div>
  );
}
