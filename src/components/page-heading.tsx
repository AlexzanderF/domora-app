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
    <div className="mb-[25px] flex items-center justify-between gap-5 max-[700px]:flex-col max-[700px]:items-start max-[700px]:gap-2">
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
