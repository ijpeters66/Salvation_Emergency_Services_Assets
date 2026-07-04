import type { ReactNode } from "react";

type PageHeroProps = {
  actions?: ReactNode;
  aside?: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
};

export function PageHero({ actions, aside, description, eyebrow, title }: PageHeroProps) {
  return (
    <section className="page-hero px-5 py-6 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.6fr)] lg:items-end">
        <div className="grid gap-3">
          <p className="section-kicker text-xs font-semibold text-[var(--brand-red)]">{eyebrow}</p>
          <div className="grid gap-3">
            <h1 className="text-4xl font-semibold tracking-tight text-[var(--ink)] sm:text-5xl">{title}</h1>
            <p className="max-w-3xl text-base leading-7 text-[var(--muted)] sm:text-lg sm:leading-8">
              {description}
            </p>
          </div>
        </div>

        <div className="grid gap-3 lg:justify-items-end">
          {aside ? <div className="text-sm leading-6 text-[var(--muted)]">{aside}</div> : null}
          {actions ? <div className="flex flex-wrap gap-2 lg:justify-end">{actions}</div> : null}
        </div>
      </div>
    </section>
  );
}
