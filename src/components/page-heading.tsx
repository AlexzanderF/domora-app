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
        <span className="hidden truncate md:inline text-[12px] font-bold tracking-[1.5px] text-muted-foreground">
          {eyebrow}
        </span>
        <h1>{title}</h1>
        <p className="hidden text-[14px] text-muted-foreground md:block">
          {description}
        </p>
      </div>
      {children && (
        <div className="w-full *:w-full md:w-auto md:*:w-auto">{children}</div>
      )}
    </div>
  );
}
