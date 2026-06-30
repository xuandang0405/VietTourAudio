export function AdminPageHeader({ eyebrow, title, description, action }) {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-600">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-black leading-tight text-slate-950 lg:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
