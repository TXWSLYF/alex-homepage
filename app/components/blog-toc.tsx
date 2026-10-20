import type { TocItem } from "@/lib/blog-toc";
import { ChevronDown } from "lucide-react";

const depthPadding: Record<TocItem["depth"], string> = {
  2: "pl-2",
  3: "pl-5",
  4: "pl-8",
};

function TocLinks({ items }: { items: TocItem[] }) {
  return (
    <ol className="m-0 list-none space-y-0.5 p-0">
      {items.map((item) => (
        <li key={item.id}>
          <a
            href={`#${item.id}`}
            className={`block rounded-md py-1 text-[13px] leading-snug text-text-sub transition-colors hover:bg-ui-hover hover:text-text-main ${depthPadding[item.depth]}`}
          >
            {item.text}
          </a>
        </li>
      ))}
    </ol>
  );
}

export function BlogToc({
  items,
  collapsible = false,
}: {
  items: TocItem[];
  collapsible?: boolean;
}) {
  if (items.length === 0) return null;

  if (collapsible) {
    return (
      <details className="group rounded-xl border border-border-base px-4 py-3">
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-text-main [&::-webkit-details-marker]:hidden">
          目录
          <ChevronDown
            aria-hidden
            size={16}
            strokeWidth={1.5}
            className="toc-chevron shrink-0 text-text-mute transition-transform"
          />
        </summary>
        <nav aria-label="目录" className="mt-3">
          <TocLinks items={items} />
        </nav>
      </details>
    );
  }

  return (
    <nav aria-label="目录">
      <p className="px-2 text-xs font-medium text-text-mute">目录</p>
      <div className="mt-2">
        <TocLinks items={items} />
      </div>
    </nav>
  );
}
