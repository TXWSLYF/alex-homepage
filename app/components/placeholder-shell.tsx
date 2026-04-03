export function PlaceholderShell({
  title,
  description = "占位页面，后续可替换为真实内容。",
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="relative z-1 flex min-h-0 flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 pt-24 pb-24 text-center sm:px-16">
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Placeholder
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {title}
        </h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          {description}
        </p>
      </main>
    </div>
  );
}
