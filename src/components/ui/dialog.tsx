"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { guardedOpenChange, type ConfirmClose } from "./dialog-guard";

const DismissContext = React.createContext({ blockOutsideDismiss: false });

type DialogProps = React.ComponentProps<typeof DialogPrimitive.Root> & {
  /** An outside tap no longer closes the dialog (Escape and the close button still do). */
  blockOutsideDismiss?: boolean;
  /** Asked before every close; resolve false to keep the dialog open. */
  confirmClose?: ConfirmClose;
};

function Dialog({
  blockOutsideDismiss = false,
  confirmClose,
  onOpenChange,
  ...props
}: DialogProps) {
  const dismiss = React.useMemo(
    () => ({ blockOutsideDismiss }),
    [blockOutsideDismiss],
  );
  return (
    <DismissContext.Provider value={dismiss}>
      <DialogPrimitive.Root
        data-slot="dialog"
        {...props}
        onOpenChange={(open) =>
          void guardedOpenChange(open, onOpenChange, confirmClose)
        }
      />
    </DismissContext.Provider>
  );
}

/** Lifts the sheet above the on-screen keyboard (iOS keeps fixed elements behind it). */
function useKeyboardInset(ref: React.RefObject<HTMLElement | null>) {
  React.useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () => {
      const node = ref.current;
      if (!node) return;
      const inset = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop,
      );
      node.style.setProperty("--dialog-kb", `${inset}px`);
      node.style.setProperty("--dialog-vh", `${viewport.height}px`);
    };
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, [ref]);
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-overlay backdrop-blur-xs data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  onInteractOutside,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
}) {
  const { blockOutsideDismiss } = React.useContext(DismissContext);
  const localRef = React.useRef<HTMLDivElement | null>(null);
  useKeyboardInset(localRef);
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={localRef}
        data-slot="dialog-content"
        onInteractOutside={(event) => {
          if (blockOutsideDismiss) event.preventDefault();
          onInteractOutside?.(event);
        }}
        className={cn(
          // Phones: bottom sheet above the keyboard. From sm: centred modal.
          "fixed inset-x-0 bottom-[var(--dialog-kb,0px)] z-50 flex max-h-[min(var(--dialog-vh,100dvh),calc(100dvh-env(safe-area-inset-top)))] w-full flex-col overflow-y-auto rounded-t-[18px] border-0 bg-white p-4 text-foreground shadow-[0_-10px_60px_var(--color-overlay-shadow)] data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:max-h-[90dvh] sm:w-[min(650px,94vw)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[18px] sm:p-[22px] sm:shadow-[0_25px_100px_var(--color-overlay-shadow)] sm:data-[state=closed]:slide-out-to-bottom-0 sm:data-[state=closed]:fade-out-0 sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=open]:fade-in-0 sm:data-[state=open]:zoom-in-95 md:p-7",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="absolute top-2 right-2 grid size-11 cursor-pointer place-items-center rounded-md border-0 bg-transparent text-muted-foreground hover:text-foreground focus-visible:outline-3 focus-visible:outline-ring"
          >
            <XIcon className="size-5" />
            <span className="sr-only">Затвори</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("mb-5 flex shrink-0 flex-col gap-2 pr-11", className)}
      {...props}
    />
  );
}

/** Scrolling middle of a sheet; header and footer stay pinned around it. */
function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-body"
      className={cn(
        "min-h-0 flex-1 overflow-y-auto overscroll-contain",
        className,
      )}
      {...props}
    />
  );
}

/** Sticky primary-action bar; pads for the home indicator below sm. */
function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "sticky bottom-0 mt-5 flex shrink-0 flex-col-reverse gap-2 bg-white pt-3 pb-[max(0px,env(safe-area-inset-bottom))] sm:static sm:flex-row sm:flex-wrap sm:justify-end sm:pb-0",
        className,
      )}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-[23px] leading-[1.3] font-bold", className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
