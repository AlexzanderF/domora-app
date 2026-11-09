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
          "--normal-bg": "#173b32",
          "--normal-text": "#ffffff",
          "--normal-border": "#173b32",
          "--border-radius": "10px",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
