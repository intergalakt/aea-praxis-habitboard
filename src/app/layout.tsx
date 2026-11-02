import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HabitBoard",
  description: "Gewohnheiten täglich abhaken und Serien sichtbar machen.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased">{children}</body>
    </html>
  );
}
