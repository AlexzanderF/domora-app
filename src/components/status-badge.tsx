import { Badge } from "@/components/ui/badge";

/** Status pill: `pending` is the amber "waiting / urgent" tone. */
export function StatusBadge({
  tone = "default",
  className,
  children,
}: {
  tone?: "default" | "pending";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Badge
      variant={tone === "pending" ? "warning" : "default"}
      className={className}
    >
      {children}
    </Badge>
  );
}
