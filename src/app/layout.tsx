import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "tiramigear",
  description: "Equipment Management für Dispo, Technik und Logistik"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
