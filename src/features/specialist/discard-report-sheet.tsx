"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Confirmation before an unsaved report is thrown away. Keeping the draft is
 * the primary action and the default (Escape and outside taps also keep it).
 */
export function DiscardReportSheet({
  open,
  onKeep,
  onDiscard,
}: {
  open: boolean;
  onKeep: () => void;
  onDiscard: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onKeep()}>
      <DialogContent showCloseButton={false}>
        <DialogHeader className="pr-0">
          <DialogTitle>Отхвърляне на отчета?</DialogTitle>
          <DialogDescription>
            Въведеният текст и снимки ще бъдат изгубени.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onDiscard}>
            Отхвърли
          </Button>
          <Button type="button" autoFocus onClick={onKeep}>
            Продължи редактирането
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
