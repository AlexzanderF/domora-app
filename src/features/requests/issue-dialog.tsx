"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/** Sheet for describing a problem with finished work (replaces window.prompt). */
export function IssueDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (note: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && <IssueForm onOpenChange={onOpenChange} onSubmit={onSubmit} />}
    </Dialog>
  );
}

function IssueForm({
  onOpenChange,
  onSubmit,
}: {
  onOpenChange: (open: boolean) => void;
  onSubmit: (note: string) => void;
}) {
  const [note, setNote] = useState("");
  const trimmed = note.trim();

  return (
    <DialogContent>
      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          if (!trimmed) return;
          onSubmit(trimmed);
          onOpenChange(false);
        }}
      >
        <DialogHeader>
          <DialogTitle>Сигнализиране на проблем</DialogTitle>
          <DialogDescription>
            Опишете какво не е наред с извършената работа.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Label htmlFor="issue-note" className="mb-2 block">
            Опишете проблема с работата
          </Label>
          <Textarea
            id="issue-note"
            rows={5}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </DialogBody>
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            Отказ
          </Button>
          <Button type="submit" disabled={!trimmed}>
            Изпрати сигнал
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
