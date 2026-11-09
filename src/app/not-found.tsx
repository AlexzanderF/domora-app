import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NotFound() {
  return (
    <Card>
      <h1>Страницата не е намерена.</h1>
      <p className="text-[14px] text-muted-foreground">
        Проверете адреса или се върнете към началото.
      </p>
      <Button asChild>
        <Link href="/">Към началото</Link>
      </Button>
    </Card>
  );
}
