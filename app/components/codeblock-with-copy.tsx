"use client";

import { Check, Copy } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";

function getTextFromPre(pre: HTMLElement | null): string {
  if (!pre) return "";
  // `innerText` preserves line breaks more reliably for highlighted code.
  const text = pre.innerText ?? "";
  return text.replace(/\n+$/, "");
}

export function CodeBlockWithCopy({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLPreElement>) {
  const ref = useRef<HTMLPreElement | null>(null);
  const [copied, setCopied] = useState(false);

  const label = useMemo(() => (copied ? "Copied" : "Copy"), [copied]);

  const onCopy = useCallback(async () => {
    const text = getTextFromPre(ref.current);
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // Fallback for older browsers / blocked clipboard permission
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        ta.style.top = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      } catch {
        // ignore
      }
    }
  }, []);

  return (
    <div className="relative">
      <pre
        ref={ref}
        {...props}
        className={[
          "my-0 max-w-full min-w-0 overflow-x-auto rounded-xl border border-border-base bg-surface-muted p-0 text-sm leading-relaxed shadow-sm",
          "[&_code]:block [&_code]:min-w-0 [&_code]:max-w-full [&_code]:bg-transparent [&_code]:p-4 [&_code]:font-mono [&_code]:leading-relaxed [&_code]:text-[0.9em]",
          className ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </pre>

      <button
        type="button"
        onClick={onCopy}
        className={[
          "absolute top-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent bg-transparent text-text-sub transition-colors",
          "hover:border-border-base/70 hover:bg-ui-hover active:bg-ui-active",
          copied ? "text-brand" : "",
        ].join(" ")}
        aria-label={label}
        title={label}
      >
        {copied ? (
          <Check className="h-4 w-4" aria-hidden />
        ) : (
          <Copy className="h-4 w-4" aria-hidden />
        )}
      </button>
    </div>
  );
}

