import Link from "next/link";

/**
 * 自定义 404：使用站点语义色（bg-background / text-text-*），随 `html.dark` 与全局主题脚本一致。
 * 默认 Next 404 组件常带固定浅色样式，导致暗黑模式下观感割裂。
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex w-full min-w-0 max-w-lg flex-1 flex-col items-center justify-center px-6 py-24 text-center sm:py-32">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-mute">
        Error
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-text-main sm:text-5xl">
        404
      </h1>
      <p className="mt-4 max-w-sm text-sm leading-relaxed text-text-sub">
        This page doesn’t exist or the link is outdated.
      </p>
      <Link
        href="/"
        className="mt-10 inline-flex h-10 items-center justify-center rounded-full bg-brand px-6 text-sm font-medium text-brand-fg transition-opacity hover:opacity-90 active:opacity-80"
      >
        Back home
      </Link>
    </main>
  );
}
