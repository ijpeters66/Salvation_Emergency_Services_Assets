type FormSectionProps = {
  children: React.ReactNode;
  description?: string;
  title: string;
};

export function FormSection({ children, description, title }: FormSectionProps) {
  return (
    <section className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 p-4">
      <div className="grid gap-1">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--ink)]">{title}</h3>
        {description ? <p className="text-sm leading-6 text-[var(--muted)]">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

type FieldHintProps = {
  children: React.ReactNode;
};

export function FieldHint({ children }: FieldHintProps) {
  return <span className="text-xs font-normal leading-5 text-[var(--muted)]">{children}</span>;
}
