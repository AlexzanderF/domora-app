import { cn } from "@/lib/utils";

export function EmptyState({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("p-9 text-center", className)}>{children}</div>;
}
