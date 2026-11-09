"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Card>
      <h1>Възникна проблем.</h1>
      <p className="text-[14px] text-muted-foreground">
        Опитайте да заредите страницата отново.
      </p>
      <Button onClick={reset}>Опитай отново</Button>
    </Card>
  );
}
