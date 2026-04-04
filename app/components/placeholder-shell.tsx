export function PlaceholderShell({
  title,
  description = "Placeholder page—replace with real content later.",
}: {
  title: string;
  description?: string;
}) {
  return (
    <main className="mx-auto flex w-full flex-1 flex-col items-center justify-center px-6 pt-24 pb-24 text-center sm:px-16">
      <p className="text-xs font-medium uppercase tracking-widest text-text-mute">
        Placeholder
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        {title}
      </h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-text-sub">
        {description}
      </p>
    </main>
  );
}
