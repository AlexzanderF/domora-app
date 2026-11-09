import { AuthAlert, AuthLink, AuthTitle, SwitchPrompt } from "./auth-ui";

// Shown for an expired, used or unknown reset link.
export function ResetLinkInvalid() {
  return (
    <>
      <AuthTitle>Връзката не е валидна</AuthTitle>
      <AuthAlert tone="error" role="alert">
        Тази връзка за смяна на паролата е невалидна, вече е използвана или е
        изтекла.
      </AuthAlert>
      <SwitchPrompt>
        <AuthLink href="/forgot-password">Заявете нова връзка</AuthLink>
      </SwitchPrompt>
    </>
  );
}
