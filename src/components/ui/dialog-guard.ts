export type ConfirmClose = () => boolean | Promise<boolean>;

/**
 * Forwards open-state changes, asking `confirmClose` before a close.
 * Resolving to false keeps the dialog open.
 */
export async function guardedOpenChange(
  open: boolean,
  onOpenChange: ((open: boolean) => void) | undefined,
  confirmClose?: ConfirmClose,
) {
  if (!open && confirmClose && !(await confirmClose())) return;
  onOpenChange?.(open);
}
