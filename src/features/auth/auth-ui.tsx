import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/* Shared building blocks for the auth screens. */

export const authInputClass =
  "rounded-lg border-border px-3.5 py-3 text-[15px] leading-[1.55] focus-visible:border-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/12 aria-invalid:border-tone-c93b2b aria-invalid:focus-visible:ring-tone-c93b2b/12";

export const authSelectClass = cn(authInputClass, "cursor-pointer");

export const authLinkClass =
  "font-semibold text-primary no-underline hover:underline";

export function AuthTitle({ className, ...props }: React.ComponentProps<"h1">) {
  return (
    <h1
      className={cn(
        "mt-0 mb-1.5 text-[24px] font-bold tracking-[-0.5px] text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function AuthSubtitle({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "m-0 mb-6 text-[14px] leading-[1.4] text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function AuthForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  return (
    <form
      noValidate
      className={cn("flex flex-col gap-[18px]", className)}
      {...props}
    />
  );
}

export function AuthLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return <Label className={cn("leading-[1.55]", className)} {...props} />;
}

export function Required() {
  return <span className="ml-0.5 text-tone-c93b2b">*</span>;
}

export function FieldError({ id, children }: { id: string; children: string }) {
  return (
    <span
      id={id}
      role="alert"
      className="mt-0.5 text-[13px] leading-[1.3] text-tone-c93b2b"
    >
      {children}
    </span>
  );
}

/** Label, control and inline error stacked as one form field. */
export function AuthField({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5", className)} {...props} />;
}

export function AuthInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return <Input className={cn(authInputClass, className)} {...props} />;
}

export function PasswordInput({
  showPassword,
  onToggle,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "type"> & {
  showPassword: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative flex w-full items-center">
      <AuthInput
        type={showPassword ? "text" : "password"}
        className={cn("pr-[76px]", className)}
        {...props}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-2 cursor-pointer rounded-md border-0 bg-transparent px-2 py-1.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-primary"
        aria-label={showPassword ? "Скрий паролата" : "Покажи паролата"}
      >
        {showPassword ? "Скрий" : "Покажи"}
      </button>
    </div>
  );
}

export function AuthCheckbox({
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "type">) {
  return (
    <input
      type="checkbox"
      className={cn(
        "mt-0.5 size-[18px] shrink-0 cursor-pointer accent-primary",
        className,
      )}
      {...props}
    />
  );
}

export function SubmitButton({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      className={cn(
        "mt-1.5 w-full py-[13px] text-[16px] hover:bg-primary-hover active:not-disabled:translate-y-px disabled:opacity-65",
        className,
      )}
      {...props}
    />
  );
}

export function SecondaryButton({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant="secondary"
      className={cn(
        "px-[18px] text-[15px] whitespace-nowrap text-foreground hover:border-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

type AlertTone = "error" | "success" | "info";

const alertTones: Record<AlertTone, string> = {
  error: "border-tone-f8b4b4 bg-tone-fdf2f2 text-tone-9b1c1c",
  success: "border-tone-a7f3d0 bg-tone-ecfdf5 text-tone-065f46",
  info: "border-tone-bfdbfe bg-tone-eff6ff text-tone-1e40af",
};

export function AuthAlert({
  tone,
  className,
  ...props
}: React.ComponentProps<"div"> & { tone: AlertTone }) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3.5 py-3 text-[14px] leading-[1.4]",
        alertTones[tone],
        className,
      )}
      {...props}
    />
  );
}

export function SwitchPrompt({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "mt-[22px] mb-0 text-center text-[14px] text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function AuthLink({
  className,
  ...props
}: React.ComponentProps<typeof Link>) {
  return <Link className={cn(authLinkClass, className)} {...props} />;
}

export function AuthSelect({
  className,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        authSelectClass,
        "block w-full border bg-white text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function AuthTextarea({
  className,
  ...props
}: React.ComponentProps<typeof Textarea>) {
  return (
    <Textarea
      className={cn(authInputClass, "min-h-[90px]", className)}
      {...props}
    />
  );
}

/** Label, input and inline error for one text-like field. */
export function TextField({
  id,
  label,
  required,
  hint,
  error,
  errorId = `${id}-error`,
  ...inputProps
}: Omit<React.ComponentProps<typeof Input>, "id"> & {
  id: string;
  label: string;
  required?: boolean;
  /** Muted text after the label, e.g. "(незадължително)". */
  hint?: string;
  error?: string;
  errorId?: string;
}) {
  return (
    <AuthField>
      <AuthLabel htmlFor={id}>
        {label}
        {required && (
          <>
            {" "}
            <Required />
          </>
        )}
        {hint && (
          <>
            {" "}
            <span className="text-muted-foreground">{hint}</span>
          </>
        )}
      </AuthLabel>
      <AuthInput
        id={id}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        {...inputProps}
      />
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </AuthField>
  );
}
