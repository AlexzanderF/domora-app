"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="bottom-center"
      toastOptions={{
        classNames: { toast: "!px-[22px] !py-3.5 !text-[14px]" },
      }}
      style={
        {
          "--normal-bg": "var(--toast)",
          "--normal-text": "var(--primary-foreground)",
          "--normal-border": "var(--toast)",
          "--border-radius": "10px",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
