interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  headingId?: string;
}

export function SectionHeader({ eyebrow, title, description, headingId }: SectionHeaderProps) {
  return (
    <div className="max-w-2xl">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {eyebrow}
        </p>
      ) : null}
      <h2
        id={headingId}
        className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
      >
        {title}
      </h2>
      {description ? <p className="mt-3 text-base text-muted-foreground">{description}</p> : null}
    </div>
  );
}
