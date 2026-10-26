"use client";

import { Check, Copy } from "lucide-react";
import {
  Children,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

const CommandColumnsContext = createContext<number[]>([]);
const ColumnIndexContext = createContext<number | null>(null);
const CommandCellContext = createContext(false);

const inlineCodeClass =
  "rounded bg-surface-muted px-1.5 py-0.5 font-mono text-[0.9em] text-text-main";

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  }
}

export function CommandTable({
  columns,
  children,
  ...props
}: React.ComponentProps<"table"> & { columns: number[] }) {
  return (
    <CommandColumnsContext.Provider value={columns}>
      <div className="my-6 max-w-full overflow-x-auto">
        <table
          className="w-max min-w-full border-collapse text-left text-sm"
          {...props}
        >
          {children}
        </table>
      </div>
    </CommandColumnsContext.Provider>
  );
}

/** Gives each cell its column index so the command column can be recognized. */
export function IndexedRow({ children }: { children: ReactNode }) {
  return Children.map(children, (child, index) => (
    <ColumnIndexContext.Provider key={index} value={index}>
      {child}
    </ColumnIndexContext.Provider>
  ));
}

export function CommandAwareCell({
  children,
  ...props
}: React.ComponentProps<"td">) {
  const index = useContext(ColumnIndexContext);
  const columns = useContext(CommandColumnsContext);
  const isCommand = index !== null && columns.includes(index);

  return (
    <td {...props}>
      <CommandCellContext.Provider value={isCommand}>
        {children}
      </CommandCellContext.Provider>
    </td>
  );
}

export function MaybeCopyableCode({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  const isCommand = useContext(CommandCellContext);
  const text = codeText(children).trim();
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  const onCopy = useCallback(async () => {
    if (!text) return;
    const ok = await copyToClipboard(text);
    if (!ok) return;
    setCopied(true);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1200);
  }, [text]);

  if (!isCommand || !text) {
    return <code className={[inlineCodeClass, className].filter(Boolean).join(" ")}>{children}</code>;
  }

  const label = copied ? "Copied" : "Copy";

  return (
    <span className="inline-flex max-w-full items-center gap-1 align-middle">
      <code className={[inlineCodeClass, className].filter(Boolean).join(" ")}>
        {children}
      </code>
      <button
        type="button"
        onClick={onCopy}
        className={[
          "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-text-sub transition-colors",
          "hover:bg-ui-hover hover:text-text-main",
          copied ? "text-brand" : "",
        ].join(" ")}
        aria-label={label}
        title={label}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <Copy className="h-3.5 w-3.5" aria-hidden />
        )}
      </button>
    </span>
  );
}

function codeText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(codeText).join("");
  return "";
}
