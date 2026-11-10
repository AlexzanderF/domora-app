import { cn } from "@/lib/utils";

export function AccountAvatar({
  initial,
  className,
}: {
  initial: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-grid size-[34px] shrink-0 place-items-center rounded-full bg-tone-e9efdc font-semibold text-foreground",
        className,
      )}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}
