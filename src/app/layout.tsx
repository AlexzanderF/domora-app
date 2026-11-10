import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import { getServerSession } from "@/lib/server/session";
import { findTariffs } from "@/domain/pricing/tariffs";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "DOMORA — грижа за дома", template: "%s | DOMORA" },
  description:
    "Вашите услуги, заявки и абонаменти за дома на едно място. Демонстрационен прототип.",
};

// Explicit viewport: safe-area insets resolve on iPhones; zoom stays enabled.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Tariffs come from the database, so never prerender this layout at build time.
  await connection();
  const [initialUser, tariffs] = await Promise.all([
    getServerSession(),
    findTariffs(),
  ]);

  return (
    <html lang="bg">
      <body>
        <Providers initialUser={initialUser} tariffs={tariffs}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
