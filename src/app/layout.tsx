import type { Metadata } from "next";
import { getServerSession } from "@/features/auth/server/session";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "DOMORA — грижа за дома", template: "%s | DOMORA" },
  description:
    "Вашите услуги, заявки и абонаменти за дома на едно място. Демонстрационен прототип.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const initialUser = await getServerSession();

  return (
    <html lang="bg">
      <body>
        <Providers initialUser={initialUser}>{children}</Providers>
      </body>
    </html>
  );
}
