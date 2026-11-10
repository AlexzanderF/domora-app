import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthAlert, AuthTitle } from "./auth-ui";

// Shown for an expired, used or unknown reset link.
export function ResetLinkInvalid() {
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <AuthTitle className="mb-0">Връзката не е валидна</AuthTitle>
      <AuthAlert tone="error" role="alert" className="w-full">
        Тази връзка за смяна на паролата е невалидна, вече е използвана или е
        изтекла.
      </AuthAlert>
      <Button asChild className="w-full">
        <Link href="/forgot-password">Заявете нова връзка</Link>
      </Button>
    </div>
  );
}
