import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Per-surface max widths. Add a key here instead of hand-writing widths in a
 * page (spec: docs/specs/mobile-responsive.md, section 1).
 */
const MAX_WIDTH = {
  workspace: "max-w-330", // 1320px: client / specialist shells, landing
  contact: "max-w-310", // 1240px
  plans: "max-w-295", // 1180px
} as const;

export type PageContainerSize = keyof typeof MAX_WIDTH;

type PageContainerProps<T extends React.ElementType> = {
  as?: T;
  size?: PageContainerSize;
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "size">;

/** Centred page column with 16/24/44px gutters (phone / sm / lg). */
function PageContainer<T extends React.ElementType = "div">({
  as,
  size = "workspace",
  className,
  ...props
}: PageContainerProps<T>) {
  const Tag: React.ElementType = as ?? "div";
  return (
    <Tag
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-11",
        MAX_WIDTH[size],
        className,
      )}
      {...props}
    />
  );
}

export { PageContainer };
