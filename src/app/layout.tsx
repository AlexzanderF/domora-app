import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "DOMORA — грижа за дома", template: "%s | DOMORA" },
  description:
    "Вашите услуги, заявки и абонаменти за дома на едно място. Демонстрационен прототип.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="bg">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
