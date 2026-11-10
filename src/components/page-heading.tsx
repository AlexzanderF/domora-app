export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-[25px] flex flex-col items-start gap-2 md:flex-row md:items-center md:justify-between md:gap-5">
      <div>
        <span className="truncate text-[12px] font-bold tracking-[1.5px] text-muted-foreground">
          {eyebrow}
        </span>
        <h1>{title}</h1>
        <p className="text-[14px] text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}
